-- ============================================================
-- CARNAVAL IMPRIM — CRM + FNE
-- Migration 00001 : Schéma initial complet
-- Supabase / PostgreSQL
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. PROFILES (utilisateurs — liés à Supabase Auth)
-- ============================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom         TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'Commercial'
                CHECK (role IN ('Admin','Commercial','Production','Comptabilité')),
  actif       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. ENTREPRISE (paramètres société — 1 seule ligne)
-- ============================================================
CREATE TABLE entreprise (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom                  TEXT NOT NULL DEFAULT 'CARNAVAL IMPRIM',
  forme                TEXT NOT NULL DEFAULT 'SARL au capital de 1 000 000 FCFA',
  siege                TEXT NOT NULL DEFAULT 'Cocody - Blockhauss, Abidjan',
  tel                  TEXT NOT NULL DEFAULT '07 19 14 13 13 / 07 58 26 53 12',
  email                TEXT NOT NULL DEFAULT 'contact@carnavalimprim.ci',
  rc                   TEXT NOT NULL DEFAULT 'CI-ABJ-03-2024-B13-05735',
  ncc                  TEXT NOT NULL DEFAULT '240220333S',
  regime               TEXT NOT NULL DEFAULT 'Réel simplifié',
  centre_impots        TEXT NOT NULL DEFAULT 'Cocody',
  taux_tva             NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  logo_url             TEXT,
  signature_url        TEXT,
  -- Champs FNE
  fne_point_of_sale    TEXT DEFAULT 'CARNAVAL IMPRIM',
  fne_establishment    TEXT DEFAULT 'CARNAVAL IMPRIM Cocody',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. FNE CONFIG (clé API DGI — 1 seule ligne)
-- ============================================================
CREATE TABLE fne_config (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key          TEXT,           -- Bearer Token DGI (chiffré côté app)
  url_test         TEXT DEFAULT 'http://54.247.95.108/ws',
  url_prod         TEXT,           -- fourni par la DGI après validation
  mode             TEXT NOT NULL DEFAULT 'test'
                   CHECK (mode IN ('test','production')),
  balance_stickers INTEGER DEFAULT 0,
  actif            BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. TYPES IMPRESSION
-- ============================================================
CREATE TABLE types_impression (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  libelle  TEXT NOT NULL UNIQUE
);

INSERT INTO types_impression (libelle) VALUES
  ('Numérique'),
  ('Offset'),
  ('Textile'),
  ('Affichage'),
  ('Conception graphique');

-- ============================================================
-- 5. CLIENTS
-- ============================================================
CREATE TABLE clients (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom                  TEXT NOT NULL,
  contact              TEXT,
  telephone            TEXT,
  email                TEXT,
  adresse              TEXT,
  ncc                  TEXT,        -- Obligatoire pour FNE B2B
  type                 TEXT NOT NULL DEFAULT 'Entreprise'
                       CHECK (type IN ('Entreprise','Institution','ONG','Particulier')),
  template_fne_defaut  TEXT NOT NULL DEFAULT 'B2B'
                       CHECK (template_fne_defaut IN ('B2B','B2G','B2C','B2F')),
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. PRODUITS (catalogue)
-- ============================================================
CREATE TABLE produits (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom                 TEXT NOT NULL,
  categorie           TEXT NOT NULL
                      CHECK (categorie IN (
                        'Supports imprimés','Grand format',
                        'Textile','Objets pub','Service'
                      )),
  type_impression_id  UUID REFERENCES types_impression(id),
  prix_base           NUMERIC(12,0) NOT NULL DEFAULT 0,
  unite               TEXT NOT NULL DEFAULT 'unité',
  description         TEXT,
  actif               BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Catalogue complet basé sur les images Carnaval Imprim
INSERT INTO produits (nom, categorie, prix_base, unite, description) VALUES
  -- Supports imprimés
  ('Carte de visite',             'Supports imprimés', 15000,  '100 ex',    '350g, recto-verso, soft touch'),
  ('Flyer A5 quadri',             'Supports imprimés', 35000,  '1000 ex',   'Quadrichromie recto-verso'),
  ('Flyer A4',                    'Supports imprimés', 55000,  '1000 ex',   'Quadrichromie recto-verso'),
  ('Affiche A3',                  'Supports imprimés', 2500,   'unité',     'Impression numérique'),
  ('Affiche A2',                  'Supports imprimés', 4500,   'unité',     'Impression numérique'),
  ('Affiche A1',                  'Supports imprimés', 8000,   'unité',     'Impression numérique'),
  ('Affiche A0',                  'Supports imprimés', 15000,  'unité',     'Impression numérique'),
  ('Brochure piqûre à cheval',    'Supports imprimés', 250000, '1000 ex',   'Couv 250g, offset 80g, recto-verso'),
  ('Brochure dos carré collé',    'Supports imprimés', 300000, '1000 ex',   'Couv 250g, offset 80g'),
  ('Dépliant 2 plis',             'Supports imprimés', 40000,  '1000 ex',   'Quadrichromie recto-verso'),
  ('Dépliant 3 plis',             'Supports imprimés', 60000,  '1000 ex',   'Quadrichromie recto-verso'),
  ('Papier à en-tête',            'Supports imprimés', 45000,  '1000 ex',   'A4, quadrichromie'),
  ('Enveloppe personnalisée',     'Supports imprimés', 50000,  '1000 ex',   'Format DL ou C4'),
  ('Facturier / carnet autocopiant','Supports imprimés',35000, '50 feuillets','Dupli ou tripli'),
  ('Livre / magazine',            'Supports imprimés', 400000, '1000 ex',   'Offset, dos carré'),
  -- Grand format & signalétique
  ('Bâche / banderole',           'Grand format',      12000,  'm²',        'Impression numérique grand format'),
  ('Kakémono / Roll-up',          'Grand format',      45000,  'unité',     'Format 85x200cm avec pied'),
  ('Oriflamme',                   'Grand format',      55000,  'unité',     'Avec mât et ancrage'),
  ('Panneau publicitaire',        'Grand format',      80000,  'unité',     'Dibond ou PVC expansé'),
  ('Sticker / autocollant',       'Grand format',      8000,   'm²',        'Vinyle adhésif'),
  ('Vinyle adhésif vitrine',      'Grand format',      15000,  'm²',        'Vitrophanie ou opaque'),
  ('Vinyle adhésif véhicule',     'Grand format',      18000,  'm²',        'Covering partiel ou total'),
  ('PLV (Publicité lieu de vente)','Grand format',     60000,  'unité',     'Stop-rayon, présentoir'),
  -- Textile
  ('T-shirt personnalisé',        'Textile',           6000,   'unité',     'Impression DTG ou sérigraphie'),
  ('Casquette',                   'Textile',           5000,   'unité',     'Broderie ou impression'),
  ('Parapluie',                   'Textile',           8000,   'unité',     'Impression numérique'),
  -- Objets pub
  ('Calendrier de bureau',        'Objets pub',        4500,   'unité',     '13 feuillets, spirale'),
  ('Bloc-note',                   'Objets pub',        3500,   'unité',     'A5, 50 feuilles'),
  ('Badge',                       'Objets pub',        1200,   'unité',     'Avec clip ou épingle'),
  ('Agenda 4en1',                 'Objets pub',        12000,  'unité',     'Agenda + bloc + stylo + règle'),
  ('Stylo personnalisé',          'Objets pub',        1500,   'unité',     'Tampographie'),
  ('Sac cabas',                   'Objets pub',        3500,   'unité',     'Non-tissé ou coton'),
  ('Sac à dos',                   'Objets pub',        8000,   'unité',     'Personnalisation logo'),
  -- Services
  ('Conception graphique',        'Service',           50000,  'forfait',   'Création visuelle complète'),
  ('Retouche / adaptation',       'Service',           15000,  'forfait',   'Adaptation fichier existant'),
  ('Photomontage',                'Service',           25000,  'forfait',   'Intégration photo');

-- ============================================================
-- 7. COMPTEURS NUMÉROTATION (série ininterrompue — requis FNE)
-- ============================================================
CREATE TABLE compteurs_numero (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type            TEXT NOT NULL CHECK (type IN ('DV','FA','BC')),
  annee           INTEGER NOT NULL,
  dernier_numero  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (type, annee)
);

-- Fonction pour obtenir le prochain numéro (thread-safe)
CREATE OR REPLACE FUNCTION next_numero(p_type TEXT, p_annee INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_num INTEGER;
BEGIN
  INSERT INTO compteurs_numero (type, annee, dernier_numero)
  VALUES (p_type, p_annee, 1)
  ON CONFLICT (type, annee)
  DO UPDATE SET dernier_numero = compteurs_numero.dernier_numero + 1
  RETURNING dernier_numero INTO v_num;

  RETURN p_type || '-' || p_annee || '-' || LPAD(v_num::TEXT, 3, '0');
END;
$$;

-- ============================================================
-- 8. DEVIS
-- ============================================================
CREATE TABLE devis (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero        TEXT NOT NULL UNIQUE,
  client_id     UUID NOT NULL REFERENCES clients(id),
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  validite      DATE,                          -- date d'expiration
  statut        TEXT NOT NULL DEFAULT 'Brouillon'
                CHECK (statut IN ('Brouillon','Envoyé','Accepté','Refusé')),
  remise        NUMERIC(12,0) NOT NULL DEFAULT 0,
  tva_applicable BOOLEAN NOT NULL DEFAULT true,
  notes         TEXT,
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE devis_lignes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  devis_id     UUID NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
  produit_id   UUID REFERENCES produits(id),
  designation  TEXT NOT NULL,
  qte          NUMERIC(10,2) NOT NULL DEFAULT 1,
  pu           NUMERIC(12,0) NOT NULL DEFAULT 0,
  remise_ligne NUMERIC(12,0) NOT NULL DEFAULT 0,
  ordre        SMALLINT NOT NULL DEFAULT 0
);

-- ============================================================
-- 9. FACTURES
-- ============================================================
CREATE TABLE factures (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero            TEXT NOT NULL UNIQUE,
  client_id         UUID NOT NULL REFERENCES clients(id),
  devis_id          UUID REFERENCES devis(id),
  date              DATE NOT NULL DEFAULT CURRENT_DATE,
  echeance          DATE,
  remise            NUMERIC(12,0) NOT NULL DEFAULT 0,
  tva_applicable    BOOLEAN NOT NULL DEFAULT true,
  notes             TEXT,
  -- Avoir
  is_avoir          BOOLEAN NOT NULL DEFAULT false,
  facture_origine_id UUID REFERENCES factures(id),
  -- FNE
  template_fne      TEXT NOT NULL DEFAULT 'B2B'
                    CHECK (template_fne IN ('B2B','B2G','B2C','B2F')),
  payment_method_fne TEXT NOT NULL DEFAULT 'cash'
                    CHECK (payment_method_fne IN (
                      'cash','mobile-money','wave','cheque','virement','carte'
                    )),
  fne_certifiee     BOOLEAN NOT NULL DEFAULT false,
  fne_reference     TEXT,           -- référence fiscale DGI ex: 9606123E25000000019
  qr_code_url       TEXT,           -- lien vérification DGI
  created_by        UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE factures_lignes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id       UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  produit_id       UUID REFERENCES produits(id),
  designation      TEXT NOT NULL,
  qte              NUMERIC(10,2) NOT NULL DEFAULT 1,
  pu               NUMERIC(12,0) NOT NULL DEFAULT 0,
  remise_ligne     NUMERIC(12,0) NOT NULL DEFAULT 0,
  -- FNE
  taxes            TEXT[] NOT NULL DEFAULT ARRAY['TVA'],  -- ['TVA'] | ['TVAB'] | ['TVAC'] | ['TVAD']
  custom_taxes     JSONB,           -- [{name: "GRA", amount: 5}]
  reference_article TEXT,
  measurement_unit  TEXT DEFAULT 'pcs',
  ordre            SMALLINT NOT NULL DEFAULT 0
);

-- ============================================================
-- 10. PAIEMENTS
-- ============================================================
CREATE TABLE paiements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id  UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  montant     NUMERIC(12,0) NOT NULL,
  mode        TEXT NOT NULL DEFAULT 'cash'
              CHECK (mode IN ('cash','mobile-money','wave','cheque','virement','carte')),
  reference   TEXT,            -- numéro de transaction Mobile Money / virement
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. FNE TRANSMISSIONS
-- ============================================================
CREATE TABLE fne_transmissions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id       UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  statut           TEXT NOT NULL DEFAULT 'en_attente'
                   CHECK (statut IN ('en_attente','transmis','certifié','erreur')),
  invoice_type     TEXT NOT NULL DEFAULT 'sale'
                   CHECK (invoice_type IN ('sale','avoir')),
  template         TEXT NOT NULL CHECK (template IN ('B2B','B2G','B2C','B2F')),
  payment_method   TEXT NOT NULL,
  fne_reference    TEXT,           -- ex: 9606123E25000000019
  fne_token        TEXT,           -- UUID de vérification DGI
  qr_code_url      TEXT,
  balance_stickers INTEGER,        -- solde après transmission
  response_raw     JSONB,          -- réponse brute API DGI (archivage 10 ans requis)
  error_message    TEXT,
  transmitted_at   TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. PRODUCTIONS
-- ============================================================
CREATE TABLE productions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  nature                TEXT NOT NULL DEFAULT 'PRODUCTION',
  caracteristique       TEXT NOT NULL,
  type_impression_id    UUID REFERENCES types_impression(id),
  papier                TEXT,          -- ex: "couché 250g", "offset 80g", "autocollant"
  recto_verso           BOOLEAN NOT NULL DEFAULT false,
  nb_pages              INTEGER,
  finition              TEXT,          -- soft touch, vernis sélectif, sans pelliculage…
  format                TEXT,          -- ex: 21x29,7cm
  quantite              INTEGER NOT NULL DEFAULT 1,
  statut                TEXT NOT NULL DEFAULT 'En attente'
                        CHECK (statut IN ('En attente','En production','Terminé','Livré')),
  date_livraison_prevue DATE,
  client_id             UUID REFERENCES clients(id),
  devis_id              UUID REFERENCES devis(id),
  facture_id            UUID REFERENCES factures(id),
  assign_a              UUID REFERENCES profiles(id),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 13. FOURNISSEURS
-- ============================================================
CREATE TABLE fournisseurs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom              TEXT NOT NULL,
  contact          TEXT,
  telephone        TEXT,
  email            TEXT,
  adresse          TEXT,
  produits_fournis TEXT,          -- description libre
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 14. BONS DE COMMANDE FOURNISSEURS
-- ============================================================
CREATE TABLE bons_commande_fournisseurs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero         TEXT NOT NULL UNIQUE,
  fournisseur_id UUID NOT NULL REFERENCES fournisseurs(id),
  date           DATE NOT NULL DEFAULT CURRENT_DATE,
  statut         TEXT NOT NULL DEFAULT 'En cours'
                 CHECK (statut IN ('En cours','Reçu','Annulé')),
  notes          TEXT,
  created_by     UUID REFERENCES profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bons_commande_lignes (
  id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bon_commande_fournisseur_id UUID NOT NULL
                              REFERENCES bons_commande_fournisseurs(id) ON DELETE CASCADE,
  designation                TEXT NOT NULL,
  qte                        NUMERIC(10,2) NOT NULL DEFAULT 1,
  pu                         NUMERIC(12,0) NOT NULL DEFAULT 0,
  unite                      TEXT DEFAULT 'unité',
  ordre                      SMALLINT NOT NULL DEFAULT 0
);

-- ============================================================
-- 15. ACTIVITÉ LOG
-- ============================================================
CREATE TABLE activite_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES profiles(id),
  action       TEXT NOT NULL,   -- 'create' | 'update' | 'delete' | 'fne_transmit'
  table_cible  TEXT NOT NULL,
  record_id    UUID,
  details      JSONB,           -- diff avant/après
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TRIGGERS : updated_at automatique
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','entreprise','fne_config','clients','produits',
    'devis','factures','productions','fournisseurs',
    'bons_commande_fournisseurs'
  ] LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at
      BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE entreprise                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE fne_config                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE types_impression           ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE compteurs_numero           ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis_lignes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures_lignes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE fne_transmissions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE productions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE fournisseurs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE bons_commande_fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bons_commande_lignes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE activite_log               ENABLE ROW LEVEL SECURITY;

-- Politique de base : tout utilisateur authentifié accède à tout
-- (les restrictions par rôle se font côté application Next.js)
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','entreprise','fne_config','types_impression',
    'clients','produits','compteurs_numero','devis','devis_lignes',
    'factures','factures_lignes','paiements','fne_transmissions',
    'productions','fournisseurs','bons_commande_fournisseurs',
    'bons_commande_lignes','activite_log'
  ] LOOP
    EXECUTE format('CREATE POLICY "%s_auth" ON %s FOR ALL
      TO authenticated USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- Profil : chaque utilisateur voit et modifie son propre profil
-- (la politique auth ci-dessus couvre déjà ; l'Admin gère les autres côté app)

-- ============================================================
-- DONNÉES INITIALES
-- ============================================================
INSERT INTO entreprise (id) VALUES (uuid_generate_v4());
INSERT INTO fne_config (id) VALUES (uuid_generate_v4());
