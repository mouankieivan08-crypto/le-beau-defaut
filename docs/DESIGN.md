# Le Beau Défaut — Identité visuelle et règles graphiques

Source : le visuel de marque fourni (monogramme LBD, fauteuil dans un arc doré, signature « Les petits défauts font de grandes économies », piliers Mobilier · Décoration · Qualité · Prix raisonnable).

La version interactive de cette charte est la page **`/identite`** de l'application.

## 1. Logo

- **Monogramme** : L (encre) → B (or) → D (encre), en cascade descendante, lettres Didone à fort contraste. Chaque lettre est détachée de la précédente par un liseré couleur fond de 1,6 unité. Étoile à quatre branches dorée en haut à droite.
- **Déclinaisons** : monogramme seul, horizontal (monogramme + « LE BEAU DÉFAUT »), complet vertical (monogramme, nom, filet doré avec étoile, signature sur deux lignes).
- **Source unique** : `src/components/Logo.tsx` (tracés dans `MONOGRAM`, décalages dans `T`). Les fichiers de `public/brand/` et l'icône `src/app/icon.svg` sont générés par `node scripts/export-brand.mjs`.
- **Règles** : zone de protection = hauteur du B ; taille minimale 24 px à l'écran ; ne pas recolorer, étirer, ombrer ni poser sur une photo chargée.

## 2. Couleurs

| Rôle | Jeton | Hex | Usage |
|---|---|---|---|
| Encre | `--color-ink` | `#14110E` | textes, boutons principaux, fonds sombres |
| Ivoire | `--color-cream` | `#FAF5EC` | fond de page |
| Lin | `--color-linen` | `#FFFDF8` | cartes et surfaces |
| Sable | `--color-sand` | `#E9DCC6` | filets, bordures |
| Or | `--color-gold` | `#B8913C` | décor : filets, étoile, icônes — **pas pour du texte** |
| Or profond | `--color-gold-deep` | `#7D5E1F` | or lisible en texte et fond de bouton doré |
| Dégradé or | — | `#8C6A24 → #C9A227 → #F0DCA0` | logo et titres signature uniquement |

### Contraste (WCAG)
L'or du logo `#B8913C` ne fait que 2,9:1 sur le fond : il est réservé au décor. Tout texte doré utilise l'or profond (≥ 4,4:1). Les couleurs de grade ont été foncées pour dépasser 4,8:1 sur leur fond teinté, et ≥ 5,7:1 en texte blanc sur fond plein.

## 3. Grades de défaut

| Grade | Texte / trait | Fond | Contraste texte/fond |
|---|---|---|---|
| A · Défaut discret | `#276B4E` | `#E6F2EC` | 5,5:1 |
| B · Défaut visible | `#7D5E1F` | `#F7EFDD` | 5,3:1 |
| C · Défaut marqué | `#A34E2D` | `#F8E9E2` | 4,8:1 |

La lettre (A, B, C) accompagne toujours la couleur : le grade reste lisible pour les personnes daltoniennes et en noir et blanc.

## 4. Typographies

- **Playfair Display** — titres, noms d'articles, prix (cousine Didone du monogramme).
- **Inter** — interface, formulaires, tableaux, chiffres des tableaux de bord.
- **Parisienne** — uniquement la signature et quelques mots doux, jamais une information.

## 5. Données et graphiques

Palette catégorielle des trois univers, **validée par script** (simulation daltonisme protan/deutan, écart OKLab ×100) sur la surface `#FFFDF8`, toutes paires comprises :

| Univers | Jeton | Hex |
|---|---|---|
| Mobilier | `--color-viz-mobilier` | `#B8861C` |
| Fourre-tout | `--color-viz-fourre-tout` | `#2A6FC0` |
| Sacs de luxe | `--color-viz-sacs` | `#9B2F5C` |

Résultat : écart daltonisme minimal 16,3 (cible ≥ 8), écart vision normale 23,8 (plancher 15), contraste de chaque teinte ≥ 3:1. Les combinaisons issues directement de la marque (or + encre + blush) échouaient au test : trop proches ou trop grises.

Règles appliquées dans `src/components/Charts.tsx` :
- une seule échelle par graphique, grille en filet plein discret ;
- colonnes ≤ 24 px, extrémité arrondie, base carrée ; une série = une seule couleur ;
- étiquettes directes sélectives (valeur maximale et dernière valeur) ;
- infobulle au survol **et** au focus clavier, zone de survol plus large que la marque ;
- légende toujours présente pour plusieurs séries, texte jamais coloré comme la série ;
- chaque graphique propose une **vue tableau** ;
- chiffres des indicateurs en Inter (pas de serif), variations signées avec flèche.

## 6. Ton de voix

On parle du défaut comme d'un détail, jamais comme d'une excuse.

- **Oui** : « Rayure de 5 cm sur l'accoudoir gauche, invisible de face. » · « Vous économisez 460 000 FCFA grâce au défaut. »
- **Non** : « Petit défaut sans importance » (vague) · « Comme neuf !!! » (invérifiable) · « Dépêchez-vous » (pression).
