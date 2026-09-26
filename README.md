# Le Beau Défaut

> *Les petits défauts font de grandes économies.*

Marketplace de **Brazzaville** (Congo) du **mobilier à petit défaut**, avec deux rayons voisins : les **sacs de luxe** (authentifiés) et le **fourre-tout**. Les entreprises de mobilier y écoulent leur stock abîmé ou en fin de série ; chaque défaut est photographié, situé, noté, et la remise en découle.

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

Mot de passe commun : **`Demo2026!`**.

Sur **`/connexion`** (public) :

| Profil | E-mail | Ce qu'on y voit |
|---|---|---|
| Acheteur | `client@lebeaudefaut.cg` | Commandes (dont une sous séquestre à confirmer), réclamation, favoris, messages |
| Vendeur fourre-tout | `vendeur@lebeaudefaut.cg` | Mbemba Déco & Électro : annonces, ventes, argent sous séquestre puis versé |

Sur **`/acces-equipe`** (adresse discrète, non liée sur le site, non indexée) :

| Profil | E-mail | Ce qu'on y voit |
|---|---|---|
| Administration | `admin@lebeaudefaut.cg` | Tableau de bord, modération, séquestre, réclamations, commandes, livraisons, versements |
| Boutique maison | `maison@lebeaudefaut.cg` | Le stock de Le Beau Défaut : mobilier et sacs de luxe, avec leur fournisseur d'origine |
| Livreur | `livreur@lebeaudefaut.cg` | Courses assignées, courses disponibles, historique |

---|---|---|
| Client | `client@lebeaudefaut.cg` | Commandes en cours et livrées, réclamation en cours, favoris, panier, messages |
| Vendeur mobilier | `vendeur@lebeaudefaut.cg` | Maison Mbemba Mobilier : ventes, annonces, une annonce rejetée à corriger |
| Vendeur luxe | `luxe@lebeaudefaut.cg` | Luxe & Seconde Main : sacs authentifiés |
| Livreur | `livreur@lebeaudefaut.cg` | Courses assignées, courses disponibles, historique |
| Administrateur | `admin@lebeaudefaut.cg` | Tableau de bord, modération, réclamations, commandes, livraisons, versements |

---

## Le concept, traduit en produit

### Deux circuits de vente
| | Mobilier · Sacs de luxe | Fourre-tout |
|---|---|---|
| **À qui appartient l'article** | À Le Beau Défaut, qui l'a racheté à une entreprise | À un vendeur de la plateforme |
| **Qui vend** | La boutique maison (`isHouse`), fournisseur d'origine indiqué | Le vendeur, via sa boutique |
| **Contact** | Direct avec l'équipe, WhatsApp compris | Messagerie du site uniquement : numéros, e-mails et liens masqués |
| **Argent** | Encaissé par Le Beau Défaut | **Séquestre** : conservé jusqu'à la réception confirmée, ou 3 jours après la livraison |
| **Qui peut publier** | L'équipe | Tout compte ayant ouvert une boutique |

Un compte n'est pas « acheteur » ou « vendeur » : il achète toujours, et vend dès qu'il ouvre une boutique (`/devenir-vendeur`). Le menu du profil passe d'un espace à l'autre.

Le séquestre vit dans `src/lib/escrow.ts`, le filtre des coordonnées dans `src/lib/safe-message.ts`. Une tâche Vercel quotidienne (`/api/cron/sequestre`, voir `vercel.json`) libère ce qui a dépassé le délai sans réclamation ; l'administration peut aussi libérer à la main depuis `/admin/sequestre`.

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
Le paiement **n'est pas automatisé**, et l'application ne le laisse jamais croire.

1. L'acheteur choisit **dépôt Mobile Money**, **espèces à la livraison** ou **paiement sur place**.
2. Pour un dépôt, la commande affiche les deux numéros de Le Beau Défaut — **06 501 81 83** (MTN MoMo) et
   **05 541 12 48** (Airtel Money) — avec un bouton pour copier le numéro sans risque d'erreur.
3. L'acheteur dépose, puis clique sur **« J'ai payé — envoyer la preuve »** : WhatsApp s'ouvre avec un
   message prérempli (référence et montant) auquel il joint la capture du dépôt.
4. L'équipe vérifie le dépôt et marque la commande payée depuis l'administration.
5. Livraison → **versement vendeur créé** (commission déduite), sous séquestre pour le fourre-tout.

Les numéros vivent dans `DEPOSIT_NUMBERS` (`src/lib/constants.ts`).

## Chercher un article

Le catalogue se filtre sur dix critères, chacun affichant le nombre d'articles concernés :

| Critère | Détail |
|---|---|
| Recherche | titre, description, défaut, marque, référence — insensible à la casse |
| Univers | mobilier, sacs de luxe, fourre-tout |
| Qui vend | notre stock, ou un vendeur du fourre-tout |
| Le défaut | grade A, B ou C |
| Catégorie | les 18 catégories |
| Budget | bornes libres, plus cinq tranches d'un clic |
| Remise | au moins 20, 30, 40, 50 ou 60 % |
| Marque | les marques réellement présentes |
| Quartier | les quartiers de Brazzaville où se trouve l'article |
| Options | livrable à domicile, prix négociable, sac authentifié |

Un critère ne se compte jamais lui-même : choisir le grade B laisse voir combien d'articles
existent en A et en C. Sur téléphone, le panneau se replie derrière un bouton qui annonce
le nombre de filtres actifs.

## Sécurité des comptes

- Mots de passe : 8 caractères minimum, refus des suites de chiffres, des mots de passe trop
  courants et de ceux qui contiennent le nom ou l'e-mail. Empreintes `bcrypt`.
- Essais répétés freinés : 8 échecs de connexion par e-mail ou par adresse IP sur 15 minutes,
  5 inscriptions par heure et par adresse (`AuthAttempt`, purge automatique après 24 h).
- Réponse à temps constant sur un e-mail inconnu : impossible de deviner quels comptes existent.
- Session signée (`jose`) dans un cookie `httpOnly`, `secure`, `sameSite=lax`, valable 30 jours.
- Chaque page et chaque action serveur revérifient le rôle ; un vendeur n'agit que sur ses annonces.
- En-têtes HTTP : `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`,
  `Permissions-Policy`, `Strict-Transport-Security`.

## Architecture

| Couche | Choix |
|---|---|
| Framework | **Next.js 15** (App Router, Server Components, Server Actions) |
| Langage | TypeScript strict |
| Base de données | **Prisma** + PostgreSQL hébergé chez **Supabase** (projet `sjlcofycsfzcrlljzjwn`) |
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

## Comptes et pages légales

**Mot de passe oublié** — aucun e-mail ne part encore du site, le parcours est donc semi-automatique,
comme le paiement : `/mot-de-passe-oublie` enregistre la demande et prévient l'équipe ; celle-ci vérifie
l'identité, puis envoie depuis `/admin/reinitialisations` un lien **à usage unique valable deux heures**
(bouton « copier » ou envoi WhatsApp direct). Le jour où un service d'envoi est branché, seul le mode de
transmission change.

**Pages légales** — `/mentions-legales`, `/confidentialite` (données et cookies) et `/conditions`
(conditions d'utilisation et de vente). Un bandeau explique qu'un seul cookie est déposé, celui de
connexion : ni traceur, ni mesure d'audience, rien à accepter. Les informations d'immatriculation
(RCCM, NIU, siège) restent à compléter dans `src/app/(public)/mentions-legales/page.tsx`.

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

Monogramme **LBD** en capitales brunes (#6B5647) dans un cercle laissé ouvert, traversé par un
coup de pinceau doré, filet et signature « Le Beau Défaut » en petites capitales.

Tout le dessin tient dans un seul fichier — `src/lib/logo-geometry.ts` — lu à la fois par le
composant React (`src/components/Logo.tsx`) et par le script d'export :

```bash
npx tsx scripts/export-brand.mts
```

Cette commande régénère, à partir de la même géométrie :

| Fichier | Usage |
|---|---|
| `public/brand/*.svg` et `*.png` | monogramme, logo horizontal, logo complet (fond clair et sombre) |
| `src/app/icon.svg` | favicon de l'onglet |
| `public/favicon.ico` | favicon 16/32/48 px pour les navigateurs et les aperçus de lien |
| `src/app/apple-icon.png` | icône de l'écran d'accueil iPhone (180 px) |
| `public/icons/icon-192.png`, `icon-512.png`, `maskable-512.png` | installation Android / PWA |

Charte complète et téléchargements sur la page **`/identite`** de l'application.
