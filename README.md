# Le Beau Défaut

> *Les petits défauts font de grandes économies.*

Marketplace congolaise du **mobilier à petit défaut**, avec deux rayons voisins : les **sacs de luxe** (authentifiés) et le **fourre-tout**. Les entreprises de mobilier y écoulent leur stock abîmé ou en fin de série ; chaque défaut est photographié, situé, noté, et la remise en découle.

---

## Démarrer

Prérequis : **Node.js 20+** (testé avec Node 24).

```bash
npm install
npm run setup      # crée les tables + données de démonstration
npm run dev        # http://localhost:3000
```

Version de production locale :

```bash
npm run build
npm run start
```

Repartir d'une base propre à tout moment : `npm run db:reset`.

### Comptes de démonstration

Mot de passe commun : **`Demo2026!`** (boutons de connexion rapide sur la page `/connexion`).

| Rôle | E-mail | Ce qu'on y voit |
|---|---|---|
| Client | `client@lebeaudefaut.cg` | Commandes en cours et livrées, réclamation en cours, favoris, panier, messages |
| Vendeur mobilier | `vendeur@lebeaudefaut.cg` | Maison Mbemba Mobilier : ventes, annonces, une annonce rejetée à corriger |
| Vendeur luxe | `luxe@lebeaudefaut.cg` | Luxe & Seconde Main : sacs authentifiés |
| Livreur | `livreur@lebeaudefaut.cg` | Courses assignées, courses disponibles, historique |
| Administrateur | `admin@lebeaudefaut.cg` | Tableau de bord, modération, réclamations, commandes, livraisons, versements |

---

## Le concept, traduit en produit

### La grille du défaut
Chaque annonce porte un **grade** qui impose une **remise minimale**, vérifiée à la saisie *et* côté serveur :

| Grade | Nom | Remise | Exemples |
|---|---|---|---|
| **A** | Défaut discret | 10 à 25 % | fin de série, carton abîmé, micro-rayure |
| **B** | Défaut visible | 25 à 45 % | tache légère, décoloration, petite bosse |
| **C** | Défaut marqué | 45 à 70 % | accroc, pièce manquante, usure franche |

Chaque défaut est décrit en 4 points (type, zone, sévérité 1–5, photo). **Une photo du défaut est obligatoire** pour publier. L'acheteur confirme dans son avis si le défaut était conforme : ce taux est suivi par l'admin et affiché sur les boutiques.

### La garantie, rendue exécutable
Si l'article reçu présente un écart avec l'annonce, l'acheteur ouvre une **réclamation** depuis sa commande (type, description, photo) dans les 3 jours suivant la livraison. L'équipe tranche depuis `/admin/reclamations` : remboursement total ou partiel, reprise de l'article, geste commercial ou refus motivé. Le vendeur est informé, l'acheteur notifié, et le taux de réclamation suivi comme indicateur de qualité.

Les règles vivent dans `src/lib/constants.ts` (`GRADES`, `DEFECT_TYPES`).

### Les quatre profils

- **Client** — catalogue filtrable (univers, grade, budget, remise, ville), fiche avec *rapport du défaut*, favoris, panier, commande (Mobile Money MTN/Airtel, espèces à la livraison, virement), suivi étape par étape, annulation, avis, **réclamation**, messagerie et **WhatsApp** avec le vendeur, partage d'annonce (WhatsApp, Facebook, lien).
- **Vendeur** — tableau de bord (ventes nettes, à percevoir, vues), formulaire d'annonce guidé (le prix conseillé s'adapte au grade), gestion des annonces, ventes à préparer, versements, fiche boutique (RCCM, NIU, Mobile Money).
- **Livreur** — interface pensée pour le téléphone : courses du jour, appel direct, montant à encaisser, étapes « récupéré → en route → livré », photo de remise, signalement d'échec, prise de courses disponibles dans sa zone.
- **Administrateur** — indicateurs et graphiques, modération avec contrôle automatique de conformité, authentification des sacs, **réclamations**, commandes, assignation des livreurs, tarifs par quartier, vendeurs et commissions, utilisateurs et rôles (dont réinitialisation de mot de passe), versements, catégories, paramètres, journal d'activité, **exports Excel** (commandes, versements, annonces).

### Le circuit de l'argent
Commande → paiement (validé par l'admin pour Mobile Money, encaissé par le livreur pour les espèces) → livraison → **versement vendeur créé automatiquement** (commission déduite) → l'admin marque le versement comme envoyé.

---

## Architecture

| Couche | Choix |
|---|---|
| Framework | **Next.js 15** (App Router, Server Components, Server Actions) |
| Langage | TypeScript strict |
| Base de données | **Prisma** + PostgreSQL (Supabase) |
| Authentification | Session JWT signée (`jose`) en cookie httpOnly, mots de passe `bcrypt` |
| Style | Tailwind CSS v4 + jetons de marque dans `src/app/globals.css` |
| Graphiques | SVG maison, sans dépendance (`src/components/Charts.tsx`) |
| Mobile | Images redimensionnées à la volée, écrans d'attente, installation sur l'écran d'accueil (manifeste PWA) |
| Référencement | `sitemap.xml` et `robots.txt` générés, espaces privés exclus |

```
prisma/
  schema.prisma        modèle de données (utilisateurs, annonces, défauts, commandes, livraisons, versements…)
  seed.ts              données de démonstration
src/
  app/
    (public)/          boutique, fiche produit, panier, commande, espace client, messages, pages de marque
    (dashboard)/       espaces admin, vendeur et livreur (barre latérale)
  components/          Logo, cartes produit, rapport du défaut, formulaires, graphiques…
  lib/
    actions/           Server Actions par domaine (auth, shop, seller, courier, admin)
    constants.ts       grades, types de défaut, statuts, villes et quartiers
    auth.ts            session et contrôle des rôles
public/brand/          logo en SVG et PNG (monogramme, horizontal, complet)
public/icons/          icônes d'installation sur téléphone
scripts/export-brand.mjs  régénère les fichiers du logo à partir du composant
docs/DESIGN.md         identité visuelle et règles graphiques
```

Le logo, l'identité et la grille du défaut sont aussi visibles dans l'application, page **`/identite`**.

Chaque page et chaque action serveur vérifient le rôle de l'utilisateur (`requireRole`). Un vendeur ne peut agir que sur ses propres annonces et commandes.

---

## Mise en ligne

Hébergement : **Vercel** (le site) + **Supabase** (la base PostgreSQL et les photos).
Marche à suivre complète : **[docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md)**.

- Les photos téléversées partent vers Supabase Storage dès que `SUPABASE_URL` et `SUPABASE_SERVICE_KEY` sont définies ; sinon elles vont dans `public/uploads` (développement).
- Elles sont **allégées dans le navigateur** avant l'envoi (1600 px, JPEG) : une requête Vercel est plafonnée à 4,5 Mo.
- Les boutons de connexion rapide aux comptes de démonstration n'apparaissent que si `NEXT_PUBLIC_DEMO=1`.

## Avant d'ouvrir aux vrais clients

Ces points sont **volontairement simplifiés** dans cette version :

1. **Paiement Mobile Money simulé.** Aucune API MTN MoMo / Airtel Money n'est branchée : l'admin marque la commande « payée ». Il faudra intégrer l'API marchande de l'opérateur (ou un agrégateur local) et un webhook de confirmation.
4. **Secret de session et adresse du site.** Remplacer `AUTH_SECRET` dans `.env` par une valeur aléatoire longue, et `NEXT_PUBLIC_SITE_URL` par l'adresse réelle (utilisée par le plan du site et les partages).
5. **Notifications externes.** Les notifications sont internes à l'application ; SMS / WhatsApp restent à brancher.
6. **Images de démonstration** chargées depuis Unsplash (connexion Internet requise). En production, ce sont les photos des vendeurs.
7. **Partage et référencement.** Le plan du site et les aperçus de partage utilisent `NEXT_PUBLIC_SITE_URL` : sans domaine réel, les liens pointent vers `localhost`.

---

## Identité visuelle

Le logo a été reconstruit en vectoriel à partir du visuel fourni : monogramme **LBD** en cascade (L encre, B or, D encre), étoile à quatre branches, filet doré, signature manuscrite. Voir la page **`/identite`** de l'application et `docs/DESIGN.md`.
