-- ============================================================
-- CARNAVAL IMPRIM — Module Imprimerie Complet
-- Migration 00002 : Bons de travail + Étapes + Machines
-- ============================================================

-- ── 1. MACHINES ─────────────────────────────────────────────
CREATE TABLE machines (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom         TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('Numérique','Offset','Textile','Grand format','Finition')),
  marque      TEXT,
  modele      TEXT,
  statut      TEXT NOT NULL DEFAULT 'Disponible'
              CHECK (statut IN ('Disponible','En service','En panne','Maintenance')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO machines (nom, type, marque, statut) VALUES
  ('Imprimante numérique A3',    'Numérique',   'Ricoh',   'Disponible'),
  ('Imprimante numérique grand format', 'Grand format', 'Roland', 'Disponible'),
  ('Presse offset',              'Offset',      'Heidelberg', 'Disponible'),
  ('Machine textile DTG',        'Textile',     'Epson',   'Disponible'),
  ('Plastifieuse / Pelliculeuse','Finition',    '',        'Disponible'),
  ('Massicot / Rogneuse',        'Finition',    '',        'Disponible'),
  ('Plieuse',                    'Finition',    '',        'Disponible'),
  ('Relieuse spirale',           'Finition',    '',        'Disponible');

-- ── 2. BONS DE TRAVAIL ──────────────────────────────────────
CREATE TABLE bons_travail (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero                TEXT NOT NULL UNIQUE,  -- BT-2026-001
  -- Liens commerciaux
  client_id             UUID REFERENCES clients(id),
  facture_id            UUID REFERENCES factures(id),
  devis_id              UUID REFERENCES devis(id),
  -- Identification du travail
  titre                 TEXT NOT NULL,
  type_impression       TEXT NOT NULL CHECK (type_impression IN ('Numérique','Offset','Textile','Grand format','Conception graphique')),
  -- Fichier client
  nom_fichier           TEXT,
  format_fichier        TEXT,    -- PDF, AI, PSD, CDR…
  fichier_conforme      BOOLEAN DEFAULT false,
  remarques_fichier     TEXT,
  -- Spécifications techniques
  support               TEXT,    -- papier couché, offset, autocollant, textile…
  grammage              TEXT,    -- 250g, 80g, 350g…
  format_brut           TEXT,    -- format avant coupe
  format_fini           TEXT,    -- format après coupe
  recto_verso           BOOLEAN DEFAULT false,
  nb_couleurs           TEXT,    -- Quadri, Bichromie, N&B…
  nb_pages              INTEGER,
  -- Finitions
  pelliculage           TEXT,    -- Sans, Brillant, Mat, Soft touch
  vernis                TEXT,    -- Sans, Vernis sélectif, UV total
  decoupe               TEXT,    -- Sans, Découpe spéciale…
  pliage                TEXT,    -- Sans, 2 plis, 3 plis, accordéon…
  reliure               TEXT,    -- Sans, Piqûre cheval, Dos carré, Spirale…
  autres_finitions      TEXT,
  -- Quantité et planning
  quantite              INTEGER NOT NULL DEFAULT 1,
  date_reception        DATE NOT NULL DEFAULT CURRENT_DATE,
  date_livraison_souhaitee DATE,
  date_livraison_prevue DATE,
  urgence               BOOLEAN DEFAULT false,
  -- Assignation
  machine_id            UUID REFERENCES machines(id),
  operateur_id          UUID REFERENCES profiles(id),
  responsable_id        UUID REFERENCES profiles(id),
  -- Statut global
  statut                TEXT NOT NULL DEFAULT 'Nouveau'
                        CHECK (statut IN ('Nouveau','Pré-presse','Impression','Finition','Contrôle qualité','Prêt','Livré','Annulé')),
  -- Notes
  instructions_speciales TEXT,
  notes_internes        TEXT,
  -- Timestamps
  created_by            UUID REFERENCES profiles(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at
CREATE TRIGGER trg_bons_travail_updated_at
  BEFORE UPDATE ON bons_travail
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Compteur numérotation BT
INSERT INTO compteurs_numero (type, annee, dernier_numero) VALUES ('BT', EXTRACT(YEAR FROM now())::int, 0) ON CONFLICT DO NOTHING;

-- ── 3. ÉTAPES DE FABRICATION ────────────────────────────────
CREATE TABLE etapes_fabrication (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bon_travail_id  UUID NOT NULL REFERENCES bons_travail(id) ON DELETE CASCADE,
  etape           TEXT NOT NULL CHECK (etape IN (
    'Réception fichier','Contrôle pré-presse','Validation BAT',
    'Impression','Pelliculage','Vernis','Découpe','Pliage',
    'Reliure','Contrôle qualité','Conditionnement','Livraison'
  )),
  statut          TEXT NOT NULL DEFAULT 'En attente'
                  CHECK (statut IN ('En attente','En cours','Terminé','Bloqué')),
  operateur_id    UUID REFERENCES profiles(id),
  machine_id      UUID REFERENCES machines(id),
  debut_prevu     TIMESTAMPTZ,
  fin_prevue      TIMESTAMPTZ,
  debut_reel      TIMESTAMPTZ,
  fin_reelle      TIMESTAMPTZ,
  duree_minutes   INTEGER,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_etapes_fabrication_updated_at
  BEFORE UPDATE ON etapes_fabrication
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 4. CONTRÔLE QUALITÉ ─────────────────────────────────────
CREATE TABLE controles_qualite (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bon_travail_id  UUID NOT NULL REFERENCES bons_travail(id) ON DELETE CASCADE,
  controleur_id   UUID REFERENCES profiles(id),
  date_controle   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Points de contrôle
  couleurs_ok     BOOLEAN,
  coupe_ok        BOOLEAN,
  finitions_ok    BOOLEAN,
  quantite_ok     BOOLEAN,
  conformite_ok   BOOLEAN,
  -- Résultat
  resultat        TEXT NOT NULL DEFAULT 'En attente'
                  CHECK (resultat IN ('En attente','Conforme','Non conforme','Retouche')),
  observations    TEXT,
  actions_correctives TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 5. RLS ──────────────────────────────────────────────────
ALTER TABLE machines              ENABLE ROW LEVEL SECURITY;
ALTER TABLE bons_travail          ENABLE ROW LEVEL SECURITY;
ALTER TABLE etapes_fabrication    ENABLE ROW LEVEL SECURITY;
ALTER TABLE controles_qualite     ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['machines','bons_travail','etapes_fabrication','controles_qualite'] LOOP
    EXECUTE format('CREATE POLICY "%s_auth" ON %s FOR ALL TO authenticated USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;
