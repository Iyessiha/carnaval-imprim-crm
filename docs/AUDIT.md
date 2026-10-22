# Audit complet — Carnaval Imprim CRM

Audit du code (≈ 9 000 lignes), de la base (migrations 00001 à 00003) et des parcours métier
avant la mise en service auprès des équipes.

## 1. Résumé

| Domaine | Gravité avant audit | Correctifs |
|---|---|---|
| Sécurité des accès (base et application) | **Critique** | RLS réelle, droits de module imposés, clé FNE protégée |
| Intégrité légale (factures FNE, caisse, numérotation) | **Critique** | Garde-fous en base, numérotation continue, conversion atomique |
| Calculs et chiffre d'affaires | Élevée | Avoirs soustraits, dates lues sans décalage de fuseau |
| Schéma de base incohérent avec le code | Élevée | Migration 00003 (tables, colonnes, rôles) |
| Erreurs ignorées ou silencieuses | Moyenne | Contrôle des écritures, messages clairs |
| Build et qualité | Moyenne | Erreurs TypeScript désormais bloquantes, typecheck propre |

Vérifications faites : `tsc --noEmit` sans erreur, `next build` réussi avec la vérification
des types activée, et **30 tests de base de données** passés (`npm run test:db`), qui rejouent les
migrations sur PostgreSQL et vérifient chaque règle d'accès et garde-fou.

## 2. Ce qui est corrigé

### 2.1 Sécurité

- **RLS réelle (migration 00003).** Les anciennes politiques donnaient à tout utilisateur connecté
  le droit de tout faire. Désormais :
  - les données métier ne sont accessibles qu'aux comptes **actifs** ;
  - seul un **administrateur** peut modifier `entreprise` et la configuration FNE (clé API comprise) ;
  - un trigger empêche un non-administrateur de changer son **rôle**, son **accès** ou ses **permissions** ;
  - le journal d'activité est en ajout et lecture seulement.
- **Clé API FNE jamais envoyée au navigateur.** La page Paramètres ne la lit plus ; elle indique seulement si
  une clé est enregistrée. La route `/api/fne/certifier` la lit côté serveur.
- **Route FNE durcie** (`src/app/api/fne/certifier/route.ts`) : compte actif, droit « Factures » requis,
  contenu validé (zod) avant envoi, configuration unique (base de données, puis variables d'environnement)
  et **respect du mode test / production** choisi dans Paramètres (avant, le mode était ignoré).
- **Route de debug supprimée** : `/api/test-env` exposait publiquement la configuration.
- **Droits par module appliqués** (`src/lib/acces.ts`) : la barre latérale, les pages (redirection) et
  les API ne montrent ou n'ouvrent que les modules autorisés. Avant, les permissions étaient
  enregistrées mais jamais utilisées.
- **Gestion des comptes côté serveur** (`/api/admin/utilisateurs`) : création, mot de passe, activation,
  rôle et permissions passent par l'API d'administration, après vérification que l'appelant est un
  administrateur actif. Garde-fous : impossible de retirer ses propres droits, impossible de
  désactiver le dernier administrateur actif.
- **Compte désactivé** : au lieu d'une application vide, un écran de blocage explique la situation.
- **Connexion** : si la session n'est pas créée, l'écran n'attend plus indéfiniment.

### 2.2 Intégrité légale et métier

- **Factures certifiées FNE figées** (trigger en base + interface) : plus de modification, de suppression
  ni de changement de lignes après certification. Les factures avec paiements ne peuvent plus être supprimées.
- **Certification FNE** : utilise le même mapping que le module FNE (taxes, références, remises) ;
  NCC client exigé pour une facture B2B ; un échec d'enregistrement après certification affiche la référence
  DGI à noter.
- **Paiements** : montant strictement positif et jamais supérieur au reste à payer.
- **Caisse** :
  - un jour fermé ne peut plus recevoir, perdre ou modifier une opération, et son ouverture est figée (trigger en base) ;
  - le solde de début de mois est reporté depuis la dernière situation connue (avant, il retombait à 0
    pour un mois sans ouverture) ;
  - une sortie qui rend le solde négatif demande confirmation ;
  - fermer une caisse sans ouverture affiche un message au lieu de ne rien faire.
- **Numérotation** :
  - les bons de livraison reçoivent un numéro de la série continue (`BL-AAAA-NNN`), au lieu d'un nombre
    tiré au hasard ou saisi librement ;
  - un bon déjà émis n'est jamais renuméroté (réimpression seulement) et ne peut plus être supprimé ;
  - contrôle en base de l'unicité des numéros de BL ;
  - les numéros de devis, factures et bons sont vérifiés avant enregistrement (avant, une erreur était ignorée).
- **Conversion devis → facture atomique** (fonction `creer_facture_depuis_devis`) : la facture et ses lignes
  sont créées dans une seule transaction, et la conversion ne peut plus créer un doublon. Utilisée par le
  devis et par le bon de livraison (avant : doublons possibles, factures orphelines, lignes non copiées).
- **Avoirs** : soustraits du chiffre d'affaires dans la comptabilité, les statistiques et le tableau de
  bord (avant : comptés comme des ventes). Exclus des relances d'impayés.
- **Ordres de production** : le client est repris du devis (avant : champ laissé vide).
- **Lignes de devis et factures** : modifier une désignation après avoir choisi un produit retire le lien
  produit (avant, le mauvais produit restait associé). Quantités et prix négatifs ramenés à 0, prix arrondis
  à l'entier FCFA.
- **Bons de commande reçus** : suppression interdite (pièce d'achat).
- **Suppressions** : l'écran retire une ligne seulement si la base l'a réellement supprimée, et les
  refus de clé étrangère donnent un message en français (au lieu de l'erreur brute de Postgres).

### 2.3 Dates et calculs

- Les dates `AAAA-MM-JJ` étaient lues en UTC : selon le fuseau, une écriture pouvait basculer de mois.
  Désormais lues sans décalage (`moisDe` dans `src/lib/utils.ts`).
- « Aujourd'hui » était calculé en UTC ; il est maintenant en heure locale (`today()`).
- Le premier jour du mois du tableau de bord ne dépend plus de la conversion UTC.

### 2.4 Schéma de base et migrations

- **Migration 00003** ajoute ce que le code utilisait sans que rien ne le crée :
  tables `charges_fixes`, `depenses`, `tarifs_impression`, `caisse_ouvertures`, `caisse_operations` ;
  colonnes `profiles` (poste, téléphone, permissions, dernière connexion), `entreprise.capital`,
  colonnes de `productions` (numéro de BL, livraison réelle, contrôles stock et BAT, sous-traitance).
- **Rôles** : la base n'acceptait que `Commercial` et `Comptabilité`, alors que l'application utilise
  `Secrétaire/Comptable`. Les anciens rôles sont convertis.
- **Migration 00002** : l'insertion du compteur `BT` échouait (la contrainte ne l'acceptait pas) ; supprimée,
  le compteur est créé à la demande.
- La migration 00003 est **rejouable sans risque** (testée).

### 2.5 Build

- `next.config.ts` ignorait les erreurs TypeScript au build. C'est maintenant bloquant ; le code passe.

## 3. Points à décider ou à vérifier avant la mise en service

1. **Appliquer les migrations sur la base réelle.** Cette session n'avait pas accès au projet Supabase
   défini dans `.env.example` (`lpgflgekyxluhyyjxmsj`). Les migrations ont été testées sur PostgreSQL,
   **pas sur la base de production**. Vérifier avant d'appliquer : `list_migrations`, les politiques RLS
   existantes, et les fonctions `create_user_with_profile`, `admin_toggle_user`, `admin_set_password`
   (absentes du dépôt, désormais remplacées par l'API) : elles peuvent être supprimées.
2. **Variable `SUPABASE_SERVICE_ROLE_KEY`** à définir dans Vercel (Production et Preview). Sans elle, la gestion
   des comptes et la certification FNE renvoient une erreur explicite.
3. **Règlement de facture en caisse** : une entrée « Règlement facture » n'enregistre pas de paiement sur la
   facture. Il faut choisir : soit la caisse crée le paiement automatiquement (risque de double saisie si
   l'encaissement est aussi saisi dans Factures), soit on garde deux écritures séparées. Décision métier.
4. **Avoirs** : rien dans l'interface ne permet d'en créer (le champ existe, jamais activé). À développer si
   besoin. Vérifier aussi, dans la spécification DGI, la référence à la facture d'origine exigée pour un avoir
   (`/api/fne/certifier` la transmet telle quelle).
5. **URL FNE de test en `http://`** (`54.247.95.108`) : le jeton d'accès circule en clair. À passer en HTTPS si la
   DGI le propose ; ne pas utiliser ce mode pour de vraies factures.
6. **Lint** : aucune configuration ESLint dans le dépôt, donc `npm run lint` attend une saisie interactive.
   À configurer (ESLint 9, configuration plate).

## 4. Limites connues (non traitées dans cette passe)

- **Édition des devis, factures et bons** : la sauvegarde se fait en plusieurs étapes (en-tête puis lignes).
  Si l'étape échoue, le document peut rester partiellement modifié. Recommandé : une fonction SQL
  transactionnelle comme pour la conversion.
- **Numérotation** : si la mise à jour d'un bon de livraison échoue après l'attribution du numéro, la série
  contient un trou. Acceptable pour l'instant, à traiter avec la fonction transactionnelle ci-dessus.
- **Messages `alert()`** : utilisés dans tout le CRM. Fonctionnels, mais à remplacer par des notifications.
- **Clavier** : les suggestions de produits dans les lignes ne se parcourent qu'à la souris.
- **Tests** : seule la base est testée automatiquement (`npm run test:db`). Aucun test d'interface.
- **Numéro de compte généré** : sans e-mail saisi, un identifiant technique `@comptes.carnavalimprim.local`
  est créé ; la personne se connecte avec ce compte.

## 5. Procédure de mise en service

1. Sauvegarder la base.
2. Appliquer `supabase/migrations/00003_audit_correctifs.sql` (SQL Editor).
3. Vérifier les rôles existants (ils sont convertis automatiquement).
4. Définir `SUPABASE_SERVICE_ROLE_KEY` dans Vercel, puis redéployer.
5. Se connecter avec un compte administrateur : vérifier Paramètres → FNE (mode, clé) et la liste des utilisateurs.
6. Tester une conversion devis → facture, une certification FNE en mode test, et une fermeture de caisse.
7. Lancer `npm run test:db` et `npm run typecheck` sur le même commit.
