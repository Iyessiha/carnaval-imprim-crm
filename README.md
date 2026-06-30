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

Exécuter dans Supabase SQL Editor :
```
supabase/migrations/00001_init_schema.sql
```

Générer les types TypeScript :
```bash
npm run db:types
```

## Déploiement

Push sur `main` → Vercel redéploie automatiquement.

---
Développé par **MonWe Infinity LLC** · FA-2026-002
