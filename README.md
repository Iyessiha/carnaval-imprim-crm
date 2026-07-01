# Carnaval Imprim — CRM

Application de gestion sur mesure pour **Carnaval Imprim**, Cocody-Blockhauss, Abidjan CI.

## Stack technique

- **Next.js 15** (App Router) + **TypeScript**
- **Supabase** (PostgreSQL + Auth + RLS)
- **Tailwind CSS 4**
- **Vercel** (déploiement CI/CD)
- **FNE / DGI CI** (Facture Normalisée Électronique)

## Modules

| Module | Description |
|--------|-------------|
| 📊 Tableau de bord | KPIs, graphiques, alertes |
| 👥 Clients | Base clients avec NCC et template FNE |
| 📄 Devis | Création, envoi, conversion en facture |
| 🧾 Factures | Facturation + paiements + certification FNE/DGI |
| 🖨️ Production | Bons de travail imprimerie complets |
| 📦 Catalogue | 35 articles par catégorie |
| 🚚 Fournisseurs | Base fournisseurs |
| ⚙️ Paramètres | Entreprise + FNE + utilisateurs |

## Démarrage

```bash
npm install
cp .env.example .env.local
# Remplir .env.local avec vos clés Supabase
npm run dev
```

## Base de données Supabase

Exécuter dans l'ordre dans Supabase SQL Editor :

1. `supabase/migrations/00001_init_schema.sql`
2. `supabase/migrations/00002_module_imprimerie.sql`

Générer les types TypeScript :
```bash
npx supabase gen types typescript --project-id VOTRE_PROJECT_ID --schema public > src/types/database.types.ts
```

## Variables d'environnement Vercel

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service (serveur uniquement) |
| `FNE_API_KEY` | Clé API DGI FNE |
| `FNE_URL_TEST` | URL test FNE |
| `FNE_URL_PROD` | URL production FNE |

## Anti-pause Supabase Free

Configurer un cron sur [cron-job.org](https://cron-job.org) :
- URL : `https://carnaval-imprim-crm.vercel.app/api/ping`
- Fréquence : toutes les 5 jours

---
Développé par **MonWe Infinity LLC** · FA-2026-002
SARL Carnaval Imprim · NCC 240220333S · Cocody-Blockhauss, Abidjan
