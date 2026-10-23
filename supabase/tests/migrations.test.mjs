// Tests de la base : rejoue les migrations 00001 -> 00003 sur PostgreSQL (PGlite, sans serveur)
// et vérifie les règles d'accès (RLS) et les garde-fous (factures certifiées, caisse fermée,
// conversion devis → facture, numérotation). Lancer : npm run test:db
// Schéma auth minimal qui imite Supabase (auth.users + auth.uid()).
import { PGlite } from '@electric-sql/pglite'
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp'
import fs from 'node:fs'

const MIG = new URL('../migrations/', import.meta.url).pathname
const db = await PGlite.create()
// Shim : les migrations demandent uuid-ossp et pgcrypto (absents de PGlite).
// gen_random_uuid() est intégré à PostgreSQL 13+ et suffit pour uuid_generate_v4().
const sansExt = (sql) => sql.replace(/CREATE EXTENSION[^;]*;/g, '')
await db.exec(`CREATE FUNCTION uuid_generate_v4() RETURNS uuid LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;`)

let passes = 0, fails = 0
const ok = (name) => { passes++; console.log('  ✓', name) }
const ko = (name, detail) => { fails++; console.log('  ✗', name, '\n     ->', detail) }

async function expectOk(name, fn) {
  try { await fn(); ok(name) } catch (e) { ko(name, e.message) }
}
async function expectErr(name, fn, motif) {
  try { await fn() } catch (e) {
    if (!motif || e.message.includes(motif)) return ok(name + ` (bloqué : ${e.message.slice(0, 90)})`)
    return ko(name, 'erreur inattendue : ' + e.message)
  }
  ko(name, 'aurait dû être bloqué')
}
async function rows(sql) { return (await db.query(sql)).rows }

const ADMIN = '00000000-0000-0000-0000-00000000000a'
const USER = '00000000-0000-0000-0000-00000000000b'
const INACTIF = '00000000-0000-0000-0000-00000000000c'
const asSuper = () => db.exec(`RESET ROLE; SELECT set_config('app.uid', '', false);`)
const asUser = (uid) => db.exec(`RESET ROLE; SET ROLE authenticated; SELECT set_config('app.uid', '${uid}', false);`)

// ── 0. Socle Supabase minimal ────────────────────────────────
await db.exec(`
  CREATE ROLE authenticated NOLOGIN;
  CREATE ROLE anon NOLOGIN;
  CREATE SCHEMA auth;
  CREATE TABLE auth.users (id uuid PRIMARY KEY);
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
    SELECT NULLIF(current_setting('app.uid', true), '')::uuid $$;
  GRANT USAGE ON SCHEMA public, auth TO authenticated, anon;
`)

console.log('\n== Migrations 00001 + 00002 ==')
await expectOk('00001 s\'applique', () => db.exec(sansExt(fs.readFileSync(MIG + '00001_init_schema.sql', 'utf8'))))
await expectOk('00002 s\'applique', () => db.exec(sansExt(fs.readFileSync(MIG + '00002_module_imprimerie.sql', 'utf8'))))
await db.exec(`GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
               GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;`)

console.log('\n== Migration 00003 ==')
await expectOk('00003 s\'applique', () => db.exec(sansExt(fs.readFileSync(MIG + '00003_audit_correctifs.sql', 'utf8'))))
await expectOk('00003 rejouée sans erreur (idempotence)', () => db.exec(sansExt(fs.readFileSync(MIG + '00003_audit_correctifs.sql', 'utf8'))))
await db.exec(`GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;`)

// ── Données de test (superutilisateur) ───────────────────────
await asSuper()
await db.exec(`
  INSERT INTO auth.users (id) VALUES ('${ADMIN}'), ('${USER}'), ('${INACTIF}');
  INSERT INTO profiles (id, nom, email, role, actif) VALUES
    ('${ADMIN}',   'Admin',   'a@x.ci', 'Admin', true),
    ('${USER}',    'Secr',    'u@x.ci', 'Secrétaire/Comptable', true),
    ('${INACTIF}', 'Inactif', 'i@x.ci', 'Production', false);
  INSERT INTO clients (id, nom, template_fne_defaut) VALUES
    ('00000000-0000-0000-0000-0000000000c1', 'Client Test', 'B2B');
  INSERT INTO compteurs_numero (type, annee, dernier_numero) VALUES ('FA', 2026, 0) ON CONFLICT DO NOTHING;
  INSERT INTO devis (id, numero, client_id, statut) VALUES
    ('00000000-0000-0000-0000-0000000000d1', 'DV-2026-001', '00000000-0000-0000-0000-0000000000c1', 'Accepté');
  INSERT INTO devis_lignes (devis_id, designation, qte, pu, ordre) VALUES
    ('00000000-0000-0000-0000-0000000000d1', 'Flyer A5', 2, 35000, 0),
    ('00000000-0000-0000-0000-0000000000d1', 'Affiche A2', 1, 4500, 1);
  INSERT INTO fne_config (api_key, mode) VALUES ('SECRET-FNE-123', 'test');
`)

console.log('\n== Rôles et accès ==')
await asUser(USER)
await expectErr('utilisateur normal ne peut pas se promouvoir Admin',
  () => db.query(`UPDATE profiles SET role = 'Admin' WHERE id = '${USER}'`), 'Seul un administrateur')
await db.query(`UPDATE profiles SET role = 'Production' WHERE id = '${ADMIN}'`) // silencieux : 0 ligne visible
await asSuper()
const roleAdmin = (await rows(`SELECT role FROM profiles WHERE id = '${ADMIN}'`))[0].role
if (roleAdmin === 'Admin') ok('utilisateur normal ne peut pas modifier le rôle d\'un autre (aucune ligne changée)')
else ko('utilisateur normal ne peut pas modifier le rôle d\'un autre', 'rôle devenu ' + roleAdmin)
await asUser(USER)
await expectOk('utilisateur normal peut modifier son propre nom',
  () => db.query(`UPDATE profiles SET nom = 'Secrétaire Test' WHERE id = '${USER}'`))
const cfgUser = await rows(`SELECT api_key FROM fne_config`)
if (cfgUser.length === 0) ok('utilisateur normal ne voit PAS la clé API FNE')
else ko('utilisateur normal ne voit PAS la clé API FNE', `voit ${cfgUser.length} ligne(s)`)

await asUser(INACTIF)
const cliInactif = await rows(`SELECT id FROM clients`)
if (cliInactif.length === 0) ok('compte désactivé ne lit plus les clients')
else ko('compte désactivé ne lit plus les clients', `lit ${cliInactif.length} client(s)`)
await expectErr('compte désactivé ne peut pas créer de client',
  () => db.query(`INSERT INTO clients (nom) VALUES ('Intrus')`))

await asUser(ADMIN)
const cfgAdmin = await rows(`SELECT api_key FROM fne_config`)
if (cfgAdmin.length >= 1) ok('administrateur lit la configuration FNE')
else ko('administrateur lit la configuration FNE', `lignes: ${cfgAdmin.length}`)
await expectOk('administrateur peut modifier le rôle d\'un autre compte',
  () => db.query(`UPDATE profiles SET role = 'Production' WHERE id = '${USER}'`))
await db.query(`UPDATE profiles SET role = 'Secrétaire/Comptable' WHERE id = '${USER}'`)

await asUser(USER)
await db.query(`UPDATE entreprise SET nom = 'Pirate'`) // silencieux : 0 ligne visible
await asSuper()
const nomEnt = (await rows(`SELECT nom FROM entreprise`))[0].nom
if (nomEnt !== 'Pirate') ok('utilisateur normal ne peut pas modifier les paramètres de l\'entreprise (aucune ligne changée)')
else ko('utilisateur normal ne peut pas modifier les paramètres de l\'entreprise', 'nom modifié')
await asUser(USER)

console.log('\n== Conversion devis → facture (atomique, sans doublon) ==')
await asUser(USER)
let f1, f2
await expectOk('conversion d\'un devis crée une facture', async () => {
  f1 = (await rows(`SELECT * FROM creer_facture_depuis_devis('00000000-0000-0000-0000-0000000000d1')`))[0]
  if (!f1 || !f1.numero.startsWith('FA-2026-')) throw new Error('numéro invalide: ' + f1?.numero)
})
await expectOk('la conversion recopie les lignes du devis', async () => {
  const n = (await rows(`SELECT count(*)::int AS n FROM factures_lignes WHERE facture_id = '${f1.id}'`))[0].n
  if (n !== 2) throw new Error('lignes: ' + n)
})
await expectOk('deuxième conversion renvoie la même facture (pas de doublon)', async () => {
  f2 = (await rows(`SELECT * FROM creer_facture_depuis_devis('00000000-0000-0000-0000-0000000000d1')`))[0]
  if (f2.id !== f1.id) throw new Error('facture différente créée')
  const total = (await rows(`SELECT count(*)::int AS n FROM factures WHERE devis_id = '00000000-0000-0000-0000-0000000000d1'`))[0].n
  if (total !== 1) throw new Error('factures pour ce devis: ' + total)
})
await expectOk('une facture de numéro FA-2026-001 est bien attribuée', async () => {
  if (!f1.numero.endsWith('-001')) throw new Error(f1.numero)
})

console.log('\n== Facture certifiée FNE figée ==')
await asUser(USER)
await expectOk('certification : mise à jour des champs FNE autorisée',
  () => db.query(`UPDATE factures SET fne_certifiee = true, fne_reference = 'REF1', qr_code_url = 'x' WHERE id = '${f1.id}'`))
await expectErr('facture certifiée : modification du montant/notes interdite',
  () => db.query(`UPDATE factures SET notes = 'changé' WHERE id = '${f1.id}'`), 'certifiée FNE')
await expectErr('facture certifiée : lignes non modifiables',
  () => db.query(`UPDATE factures_lignes SET pu = 1 WHERE facture_id = '${f1.id}'`), 'certifiée FNE')
await expectErr('facture certifiée : suppression interdite',
  () => db.query(`DELETE FROM factures WHERE id = '${f1.id}'`), 'certifiée FNE')

console.log('\n== Facture avec paiement : suppression interdite ==')
await asUser(USER)
const f3 = (await rows(`INSERT INTO factures (numero, client_id, date) VALUES ('FA-2026-099', '00000000-0000-0000-0000-0000000000c1', CURRENT_DATE) RETURNING id`))[0]
await db.query(`INSERT INTO paiements (facture_id, montant) VALUES ('${f3.id}', 1000)`)
await expectErr('facture payée non supprimable', () => db.query(`DELETE FROM factures WHERE id = '${f3.id}'`), 'paiements')

console.log('\n== Caisse : jour fermé figé ==')
await asUser(ADMIN)
await db.query(`INSERT INTO caisse_ouvertures (date, solde_debut) VALUES ('2026-03-10', 50000)`)
await expectOk('opération sur jour ouvert autorisée',
  () => db.query(`INSERT INTO caisse_operations (date, type, categorie, libelle, montant) VALUES ('2026-03-10', 'entree', 'Vente', 'Test', 1000)`))
await db.query(`UPDATE caisse_ouvertures SET ferme = true, solde_fin = 51000 WHERE date = '2026-03-10'`)
await expectErr('jour fermé : ajout interdit',
  () => db.query(`INSERT INTO caisse_operations (date, type, categorie, libelle, montant) VALUES ('2026-03-10', 'sortie', 'X', 'Y', 100)`), 'fermée')
await expectErr('jour fermé : suppression interdite',
  () => db.query(`DELETE FROM caisse_operations WHERE date = '2026-03-10'`), 'fermée')
await expectErr('jour fermé : ouverture non modifiable',
  () => db.query(`UPDATE caisse_ouvertures SET solde_debut = 0 WHERE date = '2026-03-10'`), 'fermée')
await expectErr('montant de caisse négatif refusé',
  () => db.query(`INSERT INTO caisse_operations (date, type, categorie, libelle, montant) VALUES ('2026-03-11', 'entree', 'V', 'N', -5)`))

console.log('\n== Numérotation ==')
await asUser(USER)
await expectOk('numéro BL disponible via next_numero', async () => {
  const n = (await rows(`SELECT next_numero('BL', 2026) AS n`))[0].n
  if (n !== 'BL-2026-001') throw new Error(n)
})
await expectOk('numéro BT disponible via next_numero', async () => {
  const n = (await rows(`SELECT next_numero('BT', 2026) AS n`))[0].n
  if (n !== 'BT-2026-001') throw new Error(n)
})
await expectErr('numéro BL en double refusé sur productions',
  async () => {
    await asSuper()
    await db.query(`INSERT INTO productions (caracteristique, numero_bl) VALUES ('a', 'BL-2026-001')`)
    await db.query(`INSERT INTO productions (caracteristique, numero_bl) VALUES ('b', 'BL-2026-001')`)
  }, 'duplicate key')

console.log(`\nRésultat : ${passes} réussis, ${fails} échoué(s)`)
await db.close()
process.exit(fails ? 1 : 0)
