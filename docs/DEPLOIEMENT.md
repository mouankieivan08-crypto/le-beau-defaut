# Mise en ligne — Vercel + Supabase

L'application tourne sur **Vercel** (le site) et **Supabase** (la base PostgreSQL et les photos).
Projet Supabase utilisé : `sjlcofycsfzcrlljzjwn`.

---

## 1. Récupérer la chaîne de connexion

Sur Supabase : bouton **Connect** en haut de l'écran → onglet **ORMs** → **Prisma**.
On y trouve deux lignes, la seconde avec le port 5432 :

```
DATABASE_URL="postgresql://postgres.sjlcofycsfzcrlljzjwn:[MOT-DE-PASSE]@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.sjlcofycsfzcrlljzjwn:[MOT-DE-PASSE]@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

`[MOT-DE-PASSE]` est le mot de passe de la base choisi à la création du projet.
Oublié ? **Settings → Database → Reset database password**.

> La connexion directe `db.<projet>.supabase.co` est en IPv6 uniquement : Vercel ne peut pas
> l'utiliser. On passe donc toujours par le *pooler* (`...pooler.supabase.com`).

## 2. Créer le stockage des photos

Supabase → **Storage** → **New bucket** → nom `photos`, case **Public bucket** cochée.
Puis **Settings → API keys** → copier la clé **secrète** (`service_role` / `sb_secret_…`).
Sans ces deux éléments, les photos téléversées ne survivent pas sur Vercel.

## 3. Préparer la base

En local, avec un fichier `.env` rempli (voir `.env.example`) :

```bash
npm run db:deploy   # crée les tables dans Supabase
npm run db:seed     # données de démonstration (facultatif)
```

## 4. Variables à définir sur Vercel

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | chaîne pooler, port 6543, `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | chaîne pooler, port 5432 |
| `AUTH_SECRET` | chaîne aléatoire de 48 caractères ou plus |
| `NEXT_PUBLIC_SITE_URL` | adresse finale du site |
| `NEXT_PUBLIC_APP_NAME` | `Le Beau Défaut` |
| `SUPABASE_URL` | `https://sjlcofycsfzcrlljzjwn.supabase.co` |
| `SUPABASE_SERVICE_KEY` | clé secrète du projet Supabase |
| `SUPABASE_BUCKET` | `photos` |
| `NEXT_PUBLIC_DEMO` | `1` en vitrine, `0` dès l'ouverture au public |
| `CRON_SECRET` | chaîne aléatoire : protège la libération automatique du séquestre (`/api/cron/sequestre`) |

## 5. Déployer

```bash
npx vercel login
npx vercel link
npx vercel --prod
```

Après le premier déploiement, remettre `NEXT_PUBLIC_SITE_URL` à l'adresse réelle
puis relancer `npx vercel --prod` pour que les partages et le plan du site pointent au bon endroit.

---

## Tâche quotidienne

`vercel.json` programme chaque jour à 6 h (UTC) l'appel de `/api/cron/sequestre`, qui verse aux vendeurs l'argent des commandes livrées depuis plus de 3 jours sans réclamation. Vercel envoie `CRON_SECRET` dans l'en-tête ; sans lui, l'appel est refusé.

## Accès de l'équipe

L'administration, la boutique maison et les livreurs se connectent par `/acces-equipe`. Cette adresse n'apparaît nulle part sur le site et n'est pas indexée : à communiquer en interne uniquement.

## Points de vigilance

- **Comptes de démonstration.** Tant que `NEXT_PUBLIC_DEMO=1`, la page de connexion affiche les
  identifiants de démonstration, **dont le compte administrateur**. À passer à `0` avant d'ouvrir
  le site à de vrais clients, et à ce moment-là changer les mots de passe.
- **Paiement Mobile Money** toujours simulé : l'administrateur marque la commande comme payée.
- **Recherche.** Les filtres texte utilisent `mode: "insensitive"`, propre à PostgreSQL.
