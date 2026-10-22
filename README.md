# Carnaval Imprim — CRM

Application de gestion sur mesure pour Carnaval Imprim, Abidjan CI.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Supabase** (PostgreSQL + Auth + RLS)
- **Tailwind CSS 4**
- **Vercel** (déploiement)
- **FNE / DGI CI** (Facture Normalisée Électronique)

## Démarrage rapide

```bash
npm install
cp .env.example .env.local
# Remplir .env.local avec vos clés Supabase
npm run dev
```

## Base de données

Exécuter **dans l'ordre** dans Supabase SQL Editor :
```
supabase/migrations/00001_init_schema.sql
supabase/migrations/00002_module_imprimerie.sql
supabase/migrations/00003_audit_correctifs.sql
```

`00003` ajoute les tables et colonnes qui manquaient au schéma (charges fixes, dépenses,
tarifs, caisse, colonnes de production et de profil), durcit la sécurité par ligne (RLS),
ajoute les garde-fous (factures certifiées FNE figées, caisse fermée figée) et la conversion
atomique devis → facture. Elle peut être rejouée sans risque.

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Connexion Supabase (publiques) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secrète.** Gestion des comptes (API admin) et configuration FNE côté serveur. Ne jamais la préfixer par `NEXT_PUBLIC_`. |
| `FNE_API_KEY`, `FNE_URL_TEST`, `FNE_URL_PROD` | Secours si la configuration FNE n'est pas saisie dans Paramètres |

## Sécurité et droits

- Les droits sont imposés en base (RLS) : un compte désactivé ne lit ni n'écrit rien.
- Les rôles et permissions par module sont contrôlés côté serveur (pages, API, barre latérale).
- La clé API FNE n'est jamais renvoyée au navigateur.
- Un administrateur ne peut pas retirer ses propres droits ni désactiver le dernier administrateur actif.

## Déploiement

Push sur `main` → Vercel redéploie automatiquement.

---
Développé par **MonWe Infinity LLC** · FA-2026-002
