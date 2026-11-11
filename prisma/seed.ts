/**
 * Le Beau Défaut — jeu de données de démonstration.
 * Lance : npm run db:seed   (ou npm run db:reset pour repartir de zéro)
 *
 * Tous les comptes de démo utilisent le mot de passe : Demo2026!
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "Demo2026!";

// ------------------------------------------------------------------ utilitaires

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (d: number, h = 10) => {
  const date = new Date(Date.now() - d * DAY);
  date.setHours(h, (d * 7) % 60, 0, 0);
  // Jamais dans le futur : une commande « d'aujourd'hui » est placée quelques heures plus tôt.
  if (date.getTime() > Date.now()) date.setTime(Date.now() - (1 + ((d * 13 + h) % 5)) * 60 * 60 * 1000);
  return date;
};
/** Une étape ne peut pas avoir lieu après « maintenant » : on la ramène à l'instant présent. */
const notFuture = (ms: number) => new Date(Math.min(ms, Date.now() - 60 * 1000));
const pct = (orig: number, price: number) => Math.round(((orig - price) / orig) * 100);
const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`;
const detail = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=900&h=700&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&fp-z=1.6&q=80`;
const zoom = (id: string, x = 0.5, y = 0.6, z = 2.8) =>
  `https://images.unsplash.com/photo-${id}?w=700&h=700&fit=crop&crop=focalpoint&fp-x=${x}&fp-y=${y}&fp-z=${z}&q=80`;

let seedRandom = 42;
const rand = () => {
  seedRandom = (seedRandom * 16807) % 2147483647;
  return (seedRandom - 1) / 2147483646;
};
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

// ------------------------------------------------------------------ catalogue

type DefectSeed = {
  type: string;
  zone: string;
  sev: number;
  desc: string;
  repairable?: boolean;
  note?: string;
};

type ProductSeed = {
  v: "MOBILIER" | "SACS" | "FOURRE_TOUT";
  cat: string;
  s: number; // index du vendeur
  title: string;
  desc: string;
  photo: string;
  focus?: [number, number, number];
  orig: number;
  price: number;
  grade: "A" | "B" | "C";
  summary: string;
  defects: DefectSeed[];
  brand?: string;
  material?: string;
  color?: string;
  dims?: string;
  weight?: number;
  qty?: number;
  city?: string;
  quartier?: string;
  featured?: boolean;
  flash?: boolean;
  auth?: string;
  status?: string;
  pickupOnly?: boolean;
  negotiable?: boolean;
  dustBag?: boolean;
  certif?: boolean;
  age?: number; // jours depuis la publication
};

const PRODUCTS: ProductSeed[] = [
  // =========================== MOBILIER ===========================
  {
    v: "MOBILIER", cat: "canapes", s: 0, featured: true, age: 3,
    title: "Canapé modulable 4 places, velours côtelé camel",
    desc: "Canapé modulable très profond, assise en mousse haute résilience et velours côtelé camel. Les modules se réarrangent en canapé droit ou en méridienne.\n\nReprise d'un stock de fin de série d'un importateur de Brazzaville : le fabricant a arrêté ce coloris.",
    photo: "1578500494198-246f612d3b3d", focus: [0.45, 0.62, 2.6],
    orig: 1350000, price: 1090000, grade: "A",
    summary: "Coloris arrêté par le fabricant et une couture de module légèrement irrégulière.",
    defects: [
      { type: "FIN_DE_SERIE", zone: "Ensemble", sev: 1, desc: "Le camel n'est plus produit : impossible de commander un module supplémentaire du même coloris." },
      { type: "AUTRE", zone: "Couture du module central", sev: 1, desc: "La surpiqûre fait une petite vague sur 6 cm, visible seulement de très près." },
    ],
    material: "Velours côtelé, structure pin massif", color: "Camel", dims: "L280 x P105 x H78 cm", weight: 92,
    quartier: "Poto-Poto",
  },
  {
    v: "MOBILIER", cat: "canapes", s: 0, featured: true, age: 5,
    title: "Canapé 3 places velours vert sapin",
    desc: "Canapé droit en velours vert sapin, pieds en noyer, coussins d'assise déhoussables. Assise ferme, idéale pour un salon de réception.",
    photo: "1555041469-a586c61ea9bc", focus: [0.5, 0.62, 3],
    orig: 890000, price: 590000, grade: "B",
    summary: "Tache claire de la taille d'une pièce sur l'assise centrale, visible sous certains angles.",
    defects: [
      { type: "TACHE", zone: "Coussin d'assise central", sev: 2, desc: "Auréole claire d'environ 3 cm, probablement de l'eau pendant le stockage.", repairable: true, note: "Le coussin est déhoussable : un nettoyage à sec l'atténue fortement." },
    ],
    material: "Velours polyester, pieds noyer", color: "Vert sapin", dims: "L210 x P88 x H82 cm", weight: 58,
    quartier: "Poto-Poto",
  },
  {
    v: "MOBILIER", cat: "canapes", s: 0, featured: true, age: 9,
    title: "Canapé 3 places cuir pleine fleur cognac",
    desc: "Grand canapé en cuir pleine fleur tanné végétal, capitonnage horizontal, pieds fuseau. Un cuir qui se patine avec le temps.",
    photo: "1540574163026-643ea20ade25", focus: [0.12, 0.55, 3],
    orig: 1250000, price: 790000, grade: "B",
    summary: "Rayure superficielle de 5 cm sur l'accoudoir gauche.",
    defects: [
      { type: "RAYURE", zone: "Accoudoir gauche", sev: 2, desc: "Rayure en surface du cuir, sans entaille. Elle s'éclaircit à la lumière.", repairable: true, note: "Un baume nourrissant pour cuir l'estompe nettement." },
    ],
    material: "Cuir pleine fleur", color: "Cognac", dims: "L220 x P92 x H80 cm", weight: 74,
    quartier: "Poto-Poto", negotiable: true,
  },
  {
    v: "MOBILIER", cat: "canapes", s: 1, flash: true, age: 2,
    title: "Canapé gris chiné 3 places et sa table basse",
    desc: "Ensemble de salon : canapé 3 places en tissu gris chiné avec coussins déco, et table basse en chêne. Vendu ensemble uniquement.",
    photo: "1493663284031-b7e3aefcae8e", focus: [0.3, 0.45, 2.6],
    orig: 980000, price: 490000, grade: "C",
    summary: "Accroc de 4 cm au dos du canapé et plateau de table basse rayé.",
    defects: [
      { type: "ACCROC", zone: "Dos du canapé, côté gauche", sev: 4, desc: "Accroc net dans le tissu, dos au mur il ne se voit pas.", repairable: true, note: "Un tapissier le reprend pour environ 15 000 FCFA à Brazzaville." },
      { type: "RAYURE", zone: "Plateau de la table basse", sev: 3, desc: "Plusieurs rayures fines dans le sens du bois." },
    ],
    material: "Tissu polyester, chêne", color: "Gris chiné", dims: "Canapé L200 x P85 cm · Table 110 x 55 cm", weight: 70,
    city: "Brazzaville", quartier: "Centre-ville",
  },
  {
    v: "MOBILIER", cat: "canapes", s: 1, age: 14,
    title: "Canapé d'angle réversible beige lin",
    desc: "Canapé d'angle 5 places, méridienne réversible gauche ou droite, tissu aspect lin. Livré avec 4 coussins.",
    photo: "1616486338812-3dadae4b4ace", focus: [0.35, 0.65, 2.6],
    orig: 1450000, price: 890000, grade: "B",
    summary: "Auréole claire sur la méridienne et un des coussins déco manquant.",
    defects: [
      { type: "TACHE", zone: "Méridienne", sev: 3, desc: "Auréole d'environ 8 cm, légèrement plus claire que le tissu." },
      { type: "PIECE_MANQUANTE", zone: "Coussins déco", sev: 1, desc: "3 coussins sur 4 fournis." },
    ],
    material: "Tissu aspect lin", color: "Beige", dims: "L270 x P170 x H80 cm", weight: 105,
    city: "Brazzaville", quartier: "Centre-ville", pickupOnly: true,
  },
  {
    v: "MOBILIER", cat: "canapes", s: 0, age: 20,
    title: "Canapé 2 places jaune soleil, housse déhoussable",
    desc: "Petit canapé 2 places avec housse intégrale lavable. Parfait pour un studio ou une chambre d'ado.",
    photo: "1558211583-d26f610c1eb1", focus: [0.8, 0.62, 2.6],
    orig: 520000, price: 260000, grade: "C",
    summary: "Housse décolorée par le soleil sur tout le flanc droit.",
    defects: [
      { type: "DECOLORATION", zone: "Accoudoir et flanc droit", sev: 4, desc: "Exposé en vitrine plusieurs mois : le jaune a nettement pâli côté fenêtre.", repairable: true, note: "Housse de remplacement disponible chez le fabricant (environ 45 000 FCFA)." },
    ],
    material: "Coton, structure bois", color: "Jaune", dims: "L180 x P88 x H70 cm", weight: 38,
    quartier: "Poto-Poto",
  },
  {
    v: "MOBILIER", cat: "canapes", s: 1, age: 11,
    title: "Canapé 3 places terracotta, pieds chêne",
    desc: "Canapé au dessin rétro, tissu bouclette terracotta, dossier haut et pieds compas en chêne.",
    photo: "1567016432779-094069958ea5", focus: [0.2, 0.8, 2.6],
    orig: 940000, price: 650000, grade: "B",
    summary: "Petite bosse sur le pied arrière gauche, invisible de face.",
    defects: [
      { type: "BOSSE", zone: "Pied arrière gauche", sev: 2, desc: "Enfoncement de 1 cm dans le bois, choc pendant le déchargement du conteneur." },
    ],
    material: "Tissu bouclette, chêne", color: "Terracotta", dims: "L215 x P90 x H85 cm", weight: 60,
    city: "Brazzaville", quartier: "Centre-ville",
  },
  {
    v: "MOBILIER", cat: "fauteuils", s: 0, featured: true, age: 4,
    title: "Fauteuil lounge jaune moutarde",
    desc: "Fauteuil enveloppant en tissu moutarde, pieds métal noir. Assise généreuse, dossier incliné pour la lecture.",
    photo: "1586023492125-27b2c045efd7", focus: [0.42, 0.65, 3],
    orig: 285000, price: 235000, grade: "A",
    summary: "Fin de série : le coloris moutarde n'est plus au catalogue du fabricant.",
    defects: [
      { type: "FIN_DE_SERIE", zone: "Ensemble", sev: 1, desc: "Aucun défaut physique, uniquement un coloris arrêté." },
    ],
    material: "Tissu, acier laqué", color: "Moutarde", dims: "L78 x P82 x H80 cm", weight: 17, qty: 3,
    quartier: "Poto-Poto",
  },
  {
    v: "MOBILIER", cat: "fauteuils", s: 1, age: 7,
    title: "Fauteuil crapaud capitonné ivoire",
    desc: "Fauteuil crapaud d'inspiration Napoléon III, capitonnage à boutons, pieds tournés laqués blancs.",
    photo: "1567538096630-e0c55bd6374c", focus: [0.35, 0.85, 2.6],
    orig: 245000, price: 159000, grade: "B",
    summary: "Légère décoloration d'un pied et un bouton de capiton à recoudre.",
    defects: [
      { type: "DECOLORATION", zone: "Pied avant droit", sev: 2, desc: "Laque légèrement jaunie sur le pied." },
      { type: "PIECE_MANQUANTE", zone: "Dossier, 3e rangée de capitons", sev: 1, desc: "Un bouton détaché.", repairable: true, note: "Le bouton est fourni dans un sachet." },
    ],
    material: "Tissu velours ras, hêtre", color: "Ivoire", dims: "L68 x P70 x H86 cm", weight: 12,
    city: "Brazzaville", quartier: "Centre-ville",
  },
  {
    v: "MOBILIER", cat: "fauteuils", s: 1, flash: true, age: 6,
    title: "Paire de fauteuils club d'exposition",
    desc: "Deux fauteuils club gris anthracite issus du showroom. Structure saine, assise ferme.",
    photo: "1538688525198-9b88f6f53126", focus: [0.8, 0.7, 2.8],
    orig: 480000, price: 235000, grade: "C",
    summary: "Modèles d'exposition : tissu marqué sur les accoudoirs par les manipulations en magasin.",
    defects: [
      { type: "USURE", zone: "Accoudoirs des deux fauteuils", sev: 4, desc: "Tissu lustré et bouloché là où les clients posaient les mains pendant deux ans d'exposition." },
    ],
    material: "Tissu chenille, hêtre", color: "Anthracite", dims: "L80 x P78 x H76 cm (l'unité)", weight: 30,
    city: "Brazzaville", quartier: "Centre-ville", negotiable: true,
  },
  {
    v: "MOBILIER", cat: "fauteuils", s: 0, age: 16,
    title: "Paire de fauteuils arrondis vieux rose",
    desc: "Deux fauteuils bouclette vieux rose aux formes arrondies. Très confortables, très photogéniques.",
    photo: "1556228453-efd6c1ff04f6", focus: [0.9, 0.7, 2.8],
    orig: 620000, price: 390000, grade: "B",
    summary: "Un des deux fauteuils a l'assise décolorée par la vitrine.",
    defects: [
      { type: "DECOLORATION", zone: "Assise du fauteuil de droite", sev: 3, desc: "Le rose est plus pâle sur l'assise, la différence se voit quand les deux fauteuils sont côte à côte." },
    ],
    material: "Tissu bouclette", color: "Vieux rose", dims: "L75 x P75 x H72 cm (l'unité)", weight: 28,
    quartier: "Poto-Poto",
  },
  {
    v: "MOBILIER", cat: "fauteuils", s: 1, age: 22,
    title: "Fauteuil pivotant gris chiné",
    desc: "Fauteuil coque pivotant sur piètement étoile chromé. Convient au salon comme au bureau.",
    photo: "1580480055273-228ff5388ef8", focus: [0.5, 0.9, 2.4],
    orig: 260000, price: 165000, grade: "B",
    summary: "Mécanisme de rotation un peu dur, tissu impeccable.",
    defects: [
      { type: "AUTRE", zone: "Pied pivotant", sev: 2, desc: "La rotation accroche légèrement sur un quart de tour.", repairable: true, note: "Un peu de graisse au silicone suffit en général." },
    ],
    material: "Tissu, acier chromé", color: "Gris chiné", dims: "L70 x P68 x H82 cm", weight: 14, qty: 2,
    city: "Brazzaville", quartier: "Centre-ville",
  },
  {
    v: "MOBILIER", cat: "chaises-tabourets", s: 0, age: 12,
    title: "Lot de 6 chaises coque noire, pieds hêtre",
    desc: "Chaises de salle à manger en polypropylène noir mat, assise rembourrée, pieds en hêtre massif. Lot de 6.",
    photo: "1592078615290-033ee584e267", focus: [0.55, 0.85, 2.6],
    orig: 390000, price: 295000, grade: "A",
    summary: "Modèle de l'an dernier ; deux chaises ont une micro-rayure sous l'assise.",
    defects: [
      { type: "FIN_DE_SERIE", zone: "Ensemble", sev: 1, desc: "Modèle de la collection précédente." },
      { type: "RAYURE", zone: "Dessous d'assise (2 chaises)", sev: 1, desc: "Invisible une fois la chaise sur ses pieds." },
    ],
    material: "Polypropylène, hêtre", color: "Noir", dims: "L47 x P53 x H82 cm", weight: 30, qty: 3,
    quartier: "Poto-Poto",
  },
  {
    v: "MOBILIER", cat: "chaises-tabourets", s: 0, age: 18,
    title: "Lot de 4 tabourets en bois blanchi",
    desc: "Tabourets hauts en pin massif blanchi, repose-pieds, poignée découpée dans l'assise. Hauteur plan de travail.",
    photo: "1503602642458-232111445657", focus: [0.5, 0.2, 2.2],
    orig: 180000, price: 149000, grade: "A",
    summary: "Cartons abîmés pendant le transport, tabourets intacts.",
    defects: [
      { type: "EMBALLAGE_ABIME", zone: "Cartons", sev: 1, desc: "Cartons déchirés et scotchés, aucune trace sur le bois." },
    ],
    material: "Pin massif", color: "Bois blanchi", dims: "Assise 35 x 35 cm · H65 cm", weight: 16, qty: 5,
    quartier: "Poto-Poto",
  },
  {
    v: "MOBILIER", cat: "chaises-tabourets", s: 0, age: 25,
    title: "Tabouret de bar coque noire, piètement bois",
    desc: "Tabouret de bar au design mid-century, coque noire brillante, piètement compas et repose-pieds métal.",
    photo: "1581539250439-c96689b516dd", focus: [0.5, 0.35, 2.4],
    orig: 95000, price: 79000, grade: "A",
    summary: "Fin de stock : le noir est remplacé par l'anthracite chez le fabricant.",
    defects: [
      { type: "FIN_DE_SERIE", zone: "Ensemble", sev: 1, desc: "Coloris retiré du catalogue, produit neuf." },
    ],
    material: "Polypropylène, hêtre, acier", color: "Noir", dims: "Assise H75 cm", weight: 6, qty: 8,
    quartier: "Poto-Poto",
  },
  {
    v: "MOBILIER", cat: "chaises-tabourets", s: 1, age: 30,
    title: "Chaises bistrot en bois massif, fin de série",
    desc: "Chaises bistrot neuves en bois massif, dernier lot d'une collection arrêtée chez un fournisseur hôtelier. Jamais utilisées, vendues à l'unité.",
    photo: "1549497538-303791108f95", focus: [0.4, 0.55, 2.4],
    orig: 65000, price: 29000, grade: "C",
    summary: "Vernis irrégulier et petites éraflures de manutention sur l'assise.",
    defects: [
      { type: "RAYURE", zone: "Assise et dossier", sev: 3, desc: "Vernis irrégulier par endroits et éraflures de manutention. Aucune chaise ne branle." },
    ],
    material: "Hêtre massif", color: "Noyer", dims: "L42 x P45 x H84 cm", weight: 5, qty: 6,
    city: "Brazzaville", quartier: "Centre-ville",
  },
  {
    v: "MOBILIER", cat: "chaises-tabourets", s: 1, age: 13,
    title: "Chaise coque blanche, pieds bois",
    desc: "Chaise coque blanche aux lignes souples, pieds hêtre et entretoises métal. Vendue à l'unité.",
    photo: "1519947486511-46149fa0a254", focus: [0.35, 0.8, 2.4],
    orig: 75000, price: 62000, grade: "A",
    summary: "Fin de série, coque très légèrement jaunie sur deux exemplaires.",
    defects: [
      { type: "FIN_DE_SERIE", zone: "Ensemble", sev: 1, desc: "Modèle remplacé par une nouvelle version." },
      { type: "DECOLORATION", zone: "Coque (2 exemplaires sur 10)", sev: 1, desc: "Blanc cassé plutôt que blanc pur." },
    ],
    material: "Polypropylène, hêtre", color: "Blanc", dims: "L46 x P54 x H81 cm", weight: 4, qty: 10,
    city: "Brazzaville", quartier: "Centre-ville",
  },
  {
    v: "MOBILIER", cat: "chaises-tabourets", s: 1, featured: true, age: 8,
    title: "Lot de 6 chaises velours vert bouteille",
    desc: "Six chaises de salle à manger en velours vert bouteille, pieds métal doré. Retour client non utilisé.",
    photo: "1617806118233-18e1de247200", focus: [0.35, 0.72, 2.8],
    orig: 720000, price: 590000, grade: "A",
    summary: "Retour client : cartons ouverts, chaises livrées démontées.",
    defects: [
      { type: "DEMONTE", zone: "Pieds à visser", sev: 1, desc: "Montage en 10 minutes par chaise, visserie complète." },
      { type: "EMBALLAGE_ABIME", zone: "Cartons", sev: 1, desc: "Cartons ouverts par le premier client." },
    ],
    material: "Velours, acier doré", color: "Vert bouteille", dims: "L50 x P56 x H80 cm", weight: 36,
    city: "Brazzaville", quartier: "Centre-ville",
  },
  {
    v: "MOBILIER", cat: "tables", s: 0, age: 10, pickupOnly: true,
    title: "Table à manger iroko massif, 8 couverts",
    desc: "Grande table en iroko massif, plateau de 4 cm, piètement traverse. Fabrication locale, bois séché.",
    photo: "1604578762246-41134e37f9cc", focus: [0.5, 0.75, 2.6],
    orig: 1100000, price: 760000, grade: "B",
    summary: "Deux traces de verre au centre du plateau et une rayure en bout de table.",
    defects: [
      { type: "TACHE", zone: "Plateau, centre", sev: 2, desc: "Deux cercles blancs laissés par des verres." },
      { type: "RAYURE", zone: "Bout de table", sev: 2, desc: "Rayure de 10 cm.", repairable: true, note: "Un ponçage léger et une huile dure la font disparaître." },
    ],
    material: "Iroko massif", color: "Bois naturel", dims: "L220 x l95 x H76 cm", weight: 85,
    quartier: "Poto-Poto", negotiable: true,
  },
  {
    v: "MOBILIER", cat: "tables", s: 1, age: 19,
    title: "Table bistrot ronde plateau marbre blanc",
    desc: "Table ronde 2 à 3 personnes, plateau en marbre blanc veiné, piètement tulipe laqué.",
    photo: "1519710164239-da123dc03ef4", focus: [0.32, 0.55, 3],
    orig: 320000, price: 210000, grade: "B",
    summary: "Petit éclat sur le rebord du plateau, invisible une fois la nappe posée.",
    defects: [
      { type: "ECLAT", zone: "Rebord du plateau", sev: 3, desc: "Éclat de 1,5 cm sur la tranche du marbre." },
    ],
    material: "Marbre, acier laqué", color: "Blanc", dims: "Ø80 x H75 cm", weight: 32,
    city: "Brazzaville", quartier: "Centre-ville",
  },
  {
    v: "MOBILIER", cat: "tables", s: 0, age: 27,
    title: "Table de chevet en bois brut",
    desc: "Chevet ouvert en bois recyclé, finition brute cirée. Chaque pièce est unique.",
    photo: "1532372320572-cda25653a26d", focus: [0.5, 0.55, 2.6],
    orig: 85000, price: 59000, grade: "B",
    summary: "Nœuds du bois plus marqués qu'au catalogue et fissure fine sur le dessus.",
    defects: [
      { type: "ECLAT", zone: "Dessus", sev: 2, desc: "Fissure naturelle de 7 cm dans le sens du fil, stabilisée." },
    ],
    material: "Bois recyclé", color: "Naturel", dims: "L50 x P35 x H45 cm", weight: 9, qty: 4,
    quartier: "Poto-Poto",
  },
  {
    v: "MOBILIER", cat: "lits-literie", s: 0, featured: true, age: 6,
    title: "Lit capitonné 160 x 200 avec banc assorti",
    desc: "Lit à tête de lit capitonnée en velours gris perle, sommier à lattes inclus, banc de pied de lit assorti.",
    photo: "1505693416388-ac5ce068fe85", focus: [0.4, 0.35, 2.6],
    orig: 1150000, price: 720000, grade: "B",
    summary: "Tête de lit marquée par le film de protection et structure livrée démontée.",
    defects: [
      { type: "TACHE", zone: "Tête de lit, partie haute", sev: 2, desc: "Traces de colle laissées par le film plastique sur une bande de 20 cm." },
      { type: "DEMONTE", zone: "Structure", sev: 1, desc: "Livré en pièces, montage prévu par le livreur." },
    ],
    material: "Velours, pin massif", color: "Gris perle", dims: "Couchage 160 x 200 cm · Tête H130 cm", weight: 78,
    quartier: "Poto-Poto",
  },
  {
    v: "MOBILIER", cat: "lits-literie", s: 1, age: 15,
    title: "Lit 160 tête de lit noire mate",
    desc: "Lit plateforme avec grande tête de lit rembourrée noire. Sommier inclus, matelas non fourni.",
    photo: "1586105251261-72a756497a11", focus: [0.35, 0.55, 2.6],
    orig: 690000, price: 540000, grade: "A",
    summary: "Légère rayure au dos de la tête de lit, côté mur.",
    defects: [
      { type: "RAYURE", zone: "Dos de la tête de lit", sev: 1, desc: "Invisible une fois le lit contre le mur." },
    ],
    material: "Tissu, MDF, pin", color: "Noir", dims: "Couchage 160 x 200 cm", weight: 64,
    city: "Brazzaville", quartier: "Centre-ville",
  },
  {
    v: "MOBILIER", cat: "lits-literie", s: 1, age: 21,
    title: "Lit 160 en chêne et parure terracotta",
    desc: "Lit en chêne massif avec parure de lit en lin lavé terracotta offerte. Retour client.",
    photo: "1616627561839-074385245ff6", focus: [0.5, 0.8, 2.4],
    orig: 580000, price: 495000, grade: "A",
    summary: "Retour client : cadre monté puis démonté une fois.",
    defects: [
      { type: "DEMONTE", zone: "Cadre", sev: 1, desc: "Aucune marque, visserie complète." },
    ],
    material: "Chêne massif, lin", color: "Chêne naturel", dims: "Couchage 160 x 200 cm", weight: 55,
    city: "Brazzaville", quartier: "Centre-ville",
  },
  {
    v: "MOBILIER", cat: "rangements", s: 0, age: 17,
    title: "Buffet rotin et bois moutarde",
    desc: "Buffet 3 portes en bois laqué moutarde avec façades cannées en rotin naturel.",
    photo: "1618220179428-22790b461013", focus: [0.4, 0.72, 2.6],
    orig: 540000, price: 345000, grade: "B",
    summary: "Cannage en rotin légèrement fendu sur la porte gauche.",
    defects: [
      { type: "ECLAT", zone: "Porte gauche, cannage", sev: 2, desc: "Deux brins de rotin cassés sur 3 cm.", repairable: true, note: "Réparable par un vannier du marché Total." },
    ],
    material: "Bois laqué, rotin", color: "Moutarde", dims: "L150 x P45 x H80 cm", weight: 48,
    quartier: "Poto-Poto",
  },
  {
    v: "MOBILIER", cat: "rangements", s: 0, age: 29,
    title: "Étagère colonne chêne clair, 10 cases",
    desc: "Colonne de rangement ouverte en décor chêne clair, 10 cases. Idéale salle de bain ou bibliothèque étroite.",
    photo: "1595428774223-ef52624120d2", focus: [0.5, 0.5, 2.4],
    orig: 210000, price: 105000, grade: "C",
    summary: "Une tablette manquante et un montant écrasé à l'arrière.",
    defects: [
      { type: "PIECE_MANQUANTE", zone: "Tablette n°7", sev: 3, desc: "Une tablette sur dix absente." },
      { type: "BOSSE", zone: "Montant arrière gauche", sev: 3, desc: "Angle écrasé sur 4 cm, côté mur." },
    ],
    material: "Panneau décor chêne", color: "Chêne clair", dims: "L40 x P30 x H180 cm", weight: 26,
    quartier: "Poto-Poto",
  },
  {
    v: "MOBILIER", cat: "rangements", s: 0, age: 1,
    title: "Meuble TV et 3 étagères murales chêne et blanc",
    desc: "Ensemble meuble TV suspendu et trois étagères murales assorties, décor chêne et blanc mat.",
    photo: "1594026112284-02bb6f3352fe", focus: [0.35, 0.72, 2.4],
    orig: 430000, price: 365000, grade: "A",
    summary: "Carton éventré à la livraison et notice de montage manquante.",
    defects: [
      { type: "EMBALLAGE_ABIME", zone: "Carton", sev: 1, desc: "Carton déchiré, meuble intact." },
      { type: "PIECE_MANQUANTE", zone: "Notice de montage", sev: 1, desc: "Nous envoyons la notice en PDF par WhatsApp." },
    ],
    material: "Panneau mélaminé", color: "Chêne / blanc", dims: "Meuble TV L160 x P35 x H30 cm", weight: 42,
    quartier: "Poto-Poto",
  },
  {
    v: "MOBILIER", cat: "rangements", s: 0, age: 23,
    title: "Buffet bas laqué blanc 4 portes",
    desc: "Buffet bas laqué blanc brillant, 4 portes push-open, étagères réglables.",
    photo: "1618220048045-10a6dbdf83e0", focus: [0.85, 0.8, 2.6],
    orig: 450000, price: 310000, grade: "B",
    summary: "Laque éraflée sur le coin avant droit.",
    defects: [
      { type: "RAYURE", zone: "Coin avant droit", sev: 3, desc: "Éraflure de 3 cm qui laisse voir le fond gris du panneau." },
    ],
    material: "MDF laqué", color: "Blanc", dims: "L180 x P40 x H75 cm", weight: 55,
    quartier: "Poto-Poto",
  },
  {
    v: "MOBILIER", cat: "cuisine-salle-de-bain", s: 1, age: 9, pickupOnly: true, negotiable: true,
    title: "Cuisine d'exposition complète avec îlot",
    desc: "Cuisine de showroom : 4,2 m de meubles bas et hauts laqués blanc, îlot central, électroménager non inclus. Démontage fait par nos soins.",
    photo: "1602028915047-37269d1a73f7", focus: [0.5, 0.8, 2.4],
    orig: 4800000, price: 2900000, grade: "B",
    summary: "Façades basses rayées au démontage, plan de travail à recouper.",
    defects: [
      { type: "RAYURE", zone: "Façades basses", sev: 3, desc: "Rayures sur 3 façades, sur la partie basse." },
      { type: "AUTRE", zone: "Plan de travail", sev: 2, desc: "Découpé pour le showroom, à adapter à votre pièce." },
    ],
    material: "Laqué, quartz reconstitué", color: "Blanc / gris", dims: "Linéaire 420 cm · Îlot 240 x 100 cm", weight: 380,
    city: "Brazzaville", quartier: "Centre-ville",
  },
  {
    v: "MOBILIER", cat: "cuisine-salle-de-bain", s: 1, age: 1, status: "EN_ATTENTE",
    title: "Meuble double vasque avec miroir",
    desc: "Meuble de salle de bain double vasque en céramique, tiroirs en chêne, grand miroir rectangulaire.",
    photo: "1584622650111-993a426fbf0a", focus: [0.75, 0.75, 2.6],
    orig: 780000, price: 390000, grade: "C",
    summary: "Éclat sur le plan vasque et miroir rayé.",
    defects: [
      { type: "ECLAT", zone: "Plan vasque, côté gauche", sev: 4, desc: "Éclat de 2 cm dans la céramique." },
      { type: "RAYURE", zone: "Miroir", sev: 2, desc: "Rayure de 8 cm en bas à droite." },
    ],
    material: "Céramique, chêne", color: "Blanc / chêne", dims: "L140 x P50 x H85 cm", weight: 70,
    city: "Brazzaville", quartier: "Centre-ville",
  },
  {
    v: "MOBILIER", cat: "chaises-tabourets", s: 0, age: 0, status: "EN_ATTENTE",
    title: "Chaise tapissée grise, pieds chêne",
    desc: "Chaise de salle à manger à dossier enveloppant, tissu gris souris, pieds chêne massif.",
    photo: "1598300042247-d088f8ab3a91", focus: [0.5, 0.75, 2.4],
    orig: 120000, price: 99000, grade: "A",
    summary: "Fin de série, légère différence de teinte du tissu entre les lots.",
    defects: [
      { type: "FIN_DE_SERIE", zone: "Ensemble", sev: 1, desc: "Deux bains de teinture différents selon les chaises." },
    ],
    material: "Tissu, chêne", color: "Gris", dims: "L52 x P56 x H88 cm", weight: 7, qty: 6,
    quartier: "Poto-Poto",
  },

  // =========================== SACS DE LUXE ===========================
  {
    v: "SACS", cat: "sacs-bandouliere", s: 2, featured: true, age: 4,
    title: "Gucci GG Marmont petit sac matelassé noir",
    desc: "Sac bandoulière en cuir matelassé chevron, double G doré, chaîne coulissante. Pièce passée par notre contrôle d'authenticité (coutures, numéro, ferrures).",
    photo: "1548036328-c9fa89d128fa", focus: [0.35, 0.8, 2.8],
    orig: 1650000, price: 1190000, grade: "B",
    summary: "Coins inférieurs légèrement frottés et petite marque sur la doublure.",
    defects: [
      { type: "USURE", zone: "Coins inférieurs", sev: 2, desc: "Cuir légèrement lustré sur les deux coins du bas." },
      { type: "TACHE", zone: "Doublure intérieure", sev: 1, desc: "Petite marque de maquillage sur la doublure." },
    ],
    brand: "Gucci", material: "Cuir de veau matelassé", color: "Noir", dims: "L24 x H13 x P6 cm", weight: 0.6,
    auth: "AUTHENTIFIE_LBD", dustBag: true, certif: true, quartier: "Centre-ville",
  },
  {
    v: "SACS", cat: "sacs-a-main", s: 2, featured: true, age: 10,
    title: "Prada Cahier en cuir noir",
    desc: "Sac inspiré des reliures anciennes, cuir saffiano noir, ferrures métalliques d'angle. Bandoulière chaîne et cuir.",
    photo: "1575844264771-892081089af5", focus: [0.35, 0.55, 2.8],
    orig: 2100000, price: 1350000, grade: "B",
    summary: "Rayures fines sur les ferrures et coin arrière frotté.",
    defects: [
      { type: "RAYURE", zone: "Ferrures d'angle", sev: 2, desc: "Micro-rayures visibles à la lumière rasante." },
      { type: "USURE", zone: "Coin arrière droit", sev: 2, desc: "Cuir frotté sur 1 cm." },
    ],
    brand: "Prada", material: "Cuir saffiano", color: "Noir", dims: "L20 x H14 x P9 cm", weight: 0.8,
    auth: "AUTHENTIFIE_LBD", dustBag: true, certif: false, quartier: "Centre-ville", negotiable: true,
  },
  {
    v: "SACS", cat: "sacs-a-main", s: 2, flash: true, age: 5,
    title: "Sac rigide cuir façon croco bordeaux, fermoir doré",
    desc: "Sac à main structuré en cuir embossé croco bordeaux, fermoir bijou doré, poignée courte.",
    photo: "1575032617751-6ddec2089882", focus: [0.52, 0.72, 3],
    orig: 950000, price: 520000, grade: "C",
    summary: "Fermoir doré rayé et bandoulière longue d'origine manquante.",
    defects: [
      { type: "RAYURE", zone: "Fermoir", sev: 3, desc: "Rayures visibles sur le métal doré." },
      { type: "PIECE_MANQUANTE", zone: "Bandoulière longue", sev: 3, desc: "Seule la poignée courte est fournie." },
    ],
    brand: "Maison italienne", material: "Cuir embossé", color: "Bordeaux", dims: "L22 x H18 x P8 cm", weight: 0.7,
    auth: "AUTHENTIFIE_LBD", dustBag: false, quartier: "Centre-ville",
  },
  {
    v: "SACS", cat: "sacs-bandouliere", s: 2, age: 12,
    title: "Pochette rose poudré à chaîne argentée",
    desc: "Pochette du soir en cuir lisse rose poudré avec bande jaune pâle, chaîne argentée amovible.",
    photo: "1566150905458-1bf1fc113f0d", focus: [0.75, 0.45, 2.6],
    orig: 310000, price: 255000, grade: "A",
    summary: "Chaîne légèrement ternie, cuir impeccable.",
    defects: [
      { type: "USURE", zone: "Chaîne", sev: 1, desc: "Métal un peu terne, se ravive avec un chiffon doux." },
    ],
    brand: "Créatrice parisienne", material: "Cuir lisse", color: "Rose poudré", dims: "L25 x H15 x P5 cm", weight: 0.4,
    auth: "AUTHENTIFIE_LBD", dustBag: true, quartier: "Centre-ville",
  },
  {
    v: "SACS", cat: "cabas", s: 2, age: 8,
    title: "Cabas cuir noir structuré",
    desc: "Grand cabas en cuir grainé noir, deux anses, compartiment ordinateur 13 pouces.",
    photo: "1614179689702-355944cd0918", focus: [0.5, 0.5, 2.4],
    orig: 780000, price: 640000, grade: "A",
    summary: "Petite marque de stylo dans la poche intérieure.",
    defects: [
      { type: "TACHE", zone: "Poche intérieure", sev: 1, desc: "Trait de stylo bille de 2 cm." },
    ],
    brand: "Maison française", material: "Cuir grainé", color: "Noir", dims: "L38 x H30 x P14 cm", weight: 1.1,
    auth: "EN_COURS", dustBag: true, quartier: "Centre-ville",
  },
  {
    v: "SACS", cat: "cabas", s: 2, age: 15,
    title: "Panier cuir camel et osier tressé",
    desc: "Sac panier en osier tressé main, rabat et anse en cuir camel, fermoir métal. Fabrication artisanale.",
    photo: "1590874103328-eac38a683ce7", focus: [0.5, 0.85, 2.6],
    orig: 420000, price: 290000, grade: "B",
    summary: "Un brin d'osier cassé sur la base, cuir sans défaut.",
    defects: [
      { type: "ECLAT", zone: "Base en osier", sev: 2, desc: "Brin cassé qui dépasse de 1 cm sous le sac." },
    ],
    material: "Osier, cuir", color: "Camel", dims: "L30 x H22 x P16 cm", weight: 0.9,
    auth: "NON_VERIFIE", quartier: "Centre-ville",
  },
  {
    v: "SACS", cat: "sacs-a-dos", s: 2, age: 20,
    title: "Sac à dos cuir vieilli vieux rose",
    desc: "Sac à dos en cuir pleine fleur à l'aspect vieilli, poche avant zippée, bretelles réglables.",
    photo: "1622560480605-d83c853bc5c3", focus: [0.5, 0.25, 2.8],
    orig: 360000, price: 230000, grade: "B",
    summary: "Patine sur la poignée et zip avant un peu dur.",
    defects: [
      { type: "USURE", zone: "Poignée", sev: 2, desc: "Cuir foncé par l'usage." },
      { type: "AUTRE", zone: "Zip de la poche avant", sev: 2, desc: "Le curseur force légèrement au milieu." },
    ],
    material: "Cuir pleine fleur", color: "Vieux rose", dims: "L28 x H36 x P12 cm", weight: 0.9,
    auth: "NON_VERIFIE", quartier: "Centre-ville",
  },
  {
    v: "SACS", cat: "sacs-a-main", s: 2, age: 2,
    title: "Sac à main cuir bleu canard, fermoir laiton",
    desc: "Sac à main à rabat en cuir bleu canard, poignée ronde, fermoir laiton poli.",
    photo: "1594223274512-ad4803739b7c", focus: [0.55, 0.62, 2.8],
    orig: 480000, price: 310000, grade: "B",
    summary: "Bord du rabat légèrement écaillé sur 2 cm.",
    defects: [
      { type: "USURE", zone: "Bord du rabat", sev: 2, desc: "La teinture de tranche s'écaille légèrement.", repairable: true, note: "Un cordonnier la reprend en 24 h." },
    ],
    material: "Cuir de vachette", color: "Bleu canard", dims: "L28 x H20 x P10 cm", weight: 0.8,
    auth: "NON_VERIFIE", quartier: "Centre-ville",
  },
  {
    v: "SACS", cat: "sacs-a-main", s: 2, age: 0, status: "EN_ATTENTE",
    title: "Sac rigide imprimé floral, anse bambou",
    desc: "Sac trapèze rigide à imprimé floral pastel, anse supérieure, fermoir tourniquet argenté.",
    photo: "1591561954557-26941169b49e", focus: [0.5, 0.75, 2.6],
    orig: 1450000, price: 1150000, grade: "A",
    summary: "Très légère décoloration de l'imprimé au dos.",
    defects: [
      { type: "DECOLORATION", zone: "Face arrière", sev: 1, desc: "Le rose de l'imprimé est un peu plus pâle au dos." },
    ],
    brand: "Maison italienne", material: "Cuir imprimé", color: "Multicolore", dims: "L30 x H24 x P13 cm", weight: 1,
    auth: "EN_COURS", dustBag: true, certif: true, quartier: "Centre-ville",
  },

  // =========================== FOURRE-TOUT ===========================
  {
    v: "FOURRE_TOUT", cat: "electromenager", s: 3, flash: true, featured: true, age: 3,
    title: "Réfrigérateur rétro vert menthe 250 L",
    desc: "Réfrigérateur au style années 50, 250 litres, compartiment congélation, classe A++. Testé 72 h en boutique.",
    photo: "1571175443880-49e1d25b2bc5", focus: [0.4, 0.45, 2.6],
    orig: 890000, price: 520000, grade: "B",
    summary: "Bosse de 3 cm sur le flanc gauche ; froid parfait, testé 72 heures.",
    defects: [
      { type: "BOSSE", zone: "Flanc gauche", sev: 3, desc: "Enfoncement de la tôle au transport, sans éclat de peinture." },
    ],
    brand: "Marque italienne", material: "Acier émaillé", color: "Vert menthe", dims: "L60 x P72 x H150 cm", weight: 68,
    quartier: "Moungali",
  },
  {
    v: "FOURRE_TOUT", cat: "electronique", s: 3, age: 7,
    title: "Smart TV 55 pouces 4K",
    desc: "Téléviseur 4K HDR, applications de streaming intégrées, 3 HDMI. Garantie boutique 6 mois.",
    photo: "1593359677879-a4bb92f829d1", focus: [0.5, 0.85, 2.6],
    orig: 480000, price: 335000, grade: "B",
    summary: "Rayure de 2 cm sur le cadre inférieur, dalle intacte.",
    defects: [
      { type: "RAYURE", zone: "Cadre inférieur", sev: 2, desc: "Rayure dans le plastique noir, aucun pixel mort." },
    ],
    material: "Plastique, aluminium", color: "Noir", dims: "55 pouces", weight: 17, qty: 3,
    quartier: "Moungali",
  },
  {
    v: "FOURRE_TOUT", cat: "electromenager", s: 3, age: 14,
    title: "Micro-ondes 25 L, façade crème",
    desc: "Micro-ondes 900 W, grill, 25 litres, 8 programmes automatiques.",
    photo: "1585659722983-3a675dabf23d", focus: [0.85, 0.35, 2.6],
    orig: 89000, price: 42000, grade: "C",
    summary: "Façade jaunie et bouton de minuterie fendu ; fonctionne parfaitement.",
    defects: [
      { type: "DECOLORATION", zone: "Façade", sev: 3, desc: "Blanc devenu crème." },
      { type: "ECLAT", zone: "Bouton de minuterie", sev: 3, desc: "Fente sur le bouton, il tourne normalement." },
    ],
    material: "Acier, plastique", color: "Crème", dims: "L48 x P38 x H28 cm", weight: 12, qty: 5,
    quartier: "Moungali",
  },
  {
    v: "FOURRE_TOUT", cat: "electromenager", s: 3, age: 21,
    title: "Mini-four à convection 35 L",
    desc: "Four posable à chaleur tournante, 35 litres, tournebroche. Idéal pour les studios sans cuisinière.",
    photo: "1574269909862-7e1d70bb8078", focus: [0.5, 0.6, 2.4],
    orig: 125000, price: 99000, grade: "A",
    summary: "Carton abîmé et micro-rayure sur la grille.",
    defects: [
      { type: "EMBALLAGE_ABIME", zone: "Carton", sev: 1, desc: "Carton enfoncé sur un angle." },
      { type: "RAYURE", zone: "Grille", sev: 1, desc: "Rayure superficielle sur la grille chromée." },
    ],
    material: "Inox", color: "Inox / noir", dims: "L52 x P40 x H32 cm", weight: 11, qty: 4,
    quartier: "Moungali",
  },
  {
    v: "FOURRE_TOUT", cat: "electronique", s: 3, age: 5,
    title: "Casque audio sans fil, finition bois et cuivre",
    desc: "Casque Bluetooth à réduction de bruit, 30 h d'autonomie, oreillettes en similicuir.",
    photo: "1585771724684-38269d6639fd", focus: [0.45, 0.6, 2.4],
    orig: 145000, price: 115000, grade: "A",
    summary: "Coffret ouvert et housse de transport absente.",
    defects: [
      { type: "EMBALLAGE_ABIME", zone: "Coffret", sev: 1, desc: "Coffret ouvert, sceau cassé." },
      { type: "PIECE_MANQUANTE", zone: "Housse de transport", sev: 1, desc: "Câble et adaptateur présents." },
    ],
    material: "Aluminium, bois, similicuir", color: "Cuivre", weight: 0.3, qty: 7,
    quartier: "Moungali",
  },
  {
    v: "FOURRE_TOUT", cat: "electronique", s: 3, age: 26,
    title: "Montre connectée, bracelet sport blanc",
    desc: "Montre connectée avec suivi cardiaque, GPS et notifications. Modèle d'exposition.",
    photo: "1523275335684-37898b6baf30", focus: [0.35, 0.55, 2.6],
    orig: 175000, price: 139000, grade: "A",
    summary: "Modèle d'exposition, bracelet légèrement marqué.",
    defects: [
      { type: "USURE", zone: "Bracelet", sev: 1, desc: "Légères traces grises sur le silicone blanc." },
    ],
    color: "Blanc", weight: 0.05, qty: 2,
    quartier: "Moungali",
  },
  {
    v: "FOURRE_TOUT", cat: "luminaires", s: 1, age: 11,
    title: "Lampe de bureau articulée métal anthracite",
    desc: "Lampe d'architecte en métal anthracite, bras articulé, douille E27.",
    photo: "1507473885765-e6ed057f782c", focus: [0.25, 0.8, 2.6],
    orig: 68000, price: 45000, grade: "B",
    summary: "Peinture écaillée sur le pied.",
    defects: [
      { type: "ECLAT", zone: "Pied", sev: 2, desc: "Éclat de peinture de 1 cm." },
    ],
    material: "Acier peint", color: "Anthracite", dims: "H55 cm", weight: 2.2, qty: 5,
    city: "Brazzaville", quartier: "Centre-ville",
  },
  {
    v: "FOURRE_TOUT", cat: "luminaires", s: 0, age: 19,
    title: "Suspension scandinave blanche Ø40 cm",
    desc: "Suspension en métal laqué blanc, intérieur blanc mat, câble textile 1,5 m.",
    photo: "1513506003901-1e6a229e2d15", focus: [0.5, 0.55, 2.4],
    orig: 55000, price: 46000, grade: "A",
    summary: "Fin de série, légère trace à l'intérieur de l'abat-jour.",
    defects: [
      { type: "FIN_DE_SERIE", zone: "Ensemble", sev: 1, desc: "Modèle remplacé." },
    ],
    material: "Métal laqué", color: "Blanc", dims: "Ø40 x H26 cm", weight: 1.4, qty: 12,
    quartier: "Poto-Poto",
  },
  {
    v: "FOURRE_TOUT", cat: "decoration", s: 1, age: 16,
    title: "Lot de 14 cadres photo assortis",
    desc: "Lot de cadres de tailles et finitions variées (bois, noir, blanc) pour composer un mur de cadres.",
    photo: "1513519245088-0e12902e5a38", focus: [0.4, 0.5, 2.2],
    orig: 140000, price: 89000, grade: "B",
    summary: "Deux verres fêlés sur les quatorze cadres du lot.",
    defects: [
      { type: "ECLAT", zone: "2 cadres sur 14", sev: 3, desc: "Verres fêlés dans l'angle ; les baguettes sont intactes." },
    ],
    material: "Bois, verre", color: "Assortis", weight: 6,
    city: "Brazzaville", quartier: "Centre-ville",
  },
  {
    v: "FOURRE_TOUT", cat: "decoration", s: 0, age: 24,
    title: "Horloge murale silencieuse Ø40 cm",
    desc: "Horloge murale à mécanisme silencieux, cadre métal noir, cadran blanc épuré.",
    photo: "1563861826100-9cb868fdbe1c", focus: [0.35, 0.3, 2.6],
    orig: 45000, price: 32000, grade: "B",
    summary: "Rayure sur la vitre en haut à gauche.",
    defects: [
      { type: "RAYURE", zone: "Vitre", sev: 2, desc: "Rayure de 3 cm entre 10 h et 11 h." },
    ],
    material: "Métal, verre", color: "Noir / blanc", dims: "Ø40 cm", weight: 1.1, qty: 6,
    quartier: "Poto-Poto",
  },
  {
    v: "FOURRE_TOUT", cat: "tapis-textiles", s: 1, age: 13,
    title: "Tapis laine motif oriental 200 x 290 cm",
    desc: "Grand tapis en laine à motif oriental dans les tons crème et gris, franges nouées.",
    photo: "1600166898405-da9535204843", focus: [0.4, 0.75, 2.6],
    orig: 380000, price: 250000, grade: "B",
    summary: "Tache légère sur une frange et franges irrégulières.",
    defects: [
      { type: "TACHE", zone: "Frange côté court", sev: 2, desc: "Frange grisée sur 15 cm." },
    ],
    material: "Laine", color: "Crème / gris", dims: "200 x 290 cm", weight: 14,
    city: "Brazzaville", quartier: "Centre-ville",
  },
  {
    v: "FOURRE_TOUT", cat: "decoration", s: 0, age: 6,
    title: "Lot de 12 bougies parfumées en verre",
    desc: "Bougies à la cire de soja, parfum vanille-bois de santal, 40 h de combustion chacune.",
    photo: "1603006905003-be475563bc59", focus: [0.6, 0.5, 2.4],
    orig: 60000, price: 39000, grade: "B",
    summary: "Couvercles manquants sur 4 bougies du lot.",
    defects: [
      { type: "PIECE_MANQUANTE", zone: "Couvercles", sev: 2, desc: "4 couvercles sur 12 absents." },
    ],
    material: "Cire de soja, verre", color: "Ambre", weight: 3, qty: 8,
    quartier: "Poto-Poto",
  },
  {
    v: "FOURRE_TOUT", cat: "decoration", s: 0, age: 18,
    title: "Grand vase en céramique écrue",
    desc: "Vase boule en céramique mate écrue, parfait avec des herbes de pampa séchées.",
    photo: "1612196808214-b8e1d6145a8c", focus: [0.45, 0.9, 2.6],
    orig: 75000, price: 52000, grade: "B",
    summary: "Petit éclat sur la base, invisible une fois posé.",
    defects: [
      { type: "ECLAT", zone: "Base", sev: 2, desc: "Éclat de 8 mm sur le pourtour du pied." },
    ],
    material: "Céramique", color: "Écru", dims: "Ø35 x H40 cm", weight: 3.5, qty: 3,
    quartier: "Poto-Poto",
  },
  {
    v: "FOURRE_TOUT", cat: "decoration", s: 0, age: 28,
    title: "Vase en verre soufflé bouche",
    desc: "Vase soliflore en verre soufflé à la bouche. Chaque pièce a sa forme.",
    photo: "1487700160041-babef9c3cb55", focus: [0.2, 0.75, 2.6],
    orig: 28000, price: 19000, grade: "B",
    summary: "Bulle d'air dans le verre et léger défaut de symétrie.",
    defects: [
      { type: "AUTRE", zone: "Paroi", sev: 2, desc: "Bulle d'air visible et col légèrement penché." },
    ],
    material: "Verre soufflé", color: "Transparent", dims: "H25 cm", weight: 0.6, qty: 9,
    quartier: "Poto-Poto",
  },
  {
    v: "FOURRE_TOUT", cat: "tapis-textiles", s: 3, age: 9,
    title: "Lot de 4 oreillers qualité hôtel 50 x 70",
    desc: "Oreillers moelleux garnissage microfibre, housse coton percale. Stock d'un hôtel de Brazzaville jamais utilisé.",
    photo: "1584100936595-c0654b55a2e2", focus: [0.5, 0.8, 2.4],
    orig: 60000, price: 45000, grade: "A",
    summary: "Housses plastiques déchirées ; oreillers neufs, jamais utilisés.",
    defects: [
      { type: "EMBALLAGE_ABIME", zone: "Housses plastiques", sev: 1, desc: "Emballages ouverts lors de l'inventaire." },
    ],
    material: "Coton, microfibre", color: "Blanc", dims: "50 x 70 cm", weight: 3, qty: 12,
    quartier: "Moungali",
  },
  {
    v: "FOURRE_TOUT", cat: "mode-accessoires", s: 3, age: 4,
    title: "Baskets cuir rouge, pointure 42",
    desc: "Baskets basses en cuir rouge et semelle blanche. Neuves, jamais portées.",
    photo: "1542291026-7eec264c27ff", focus: [0.5, 0.8, 2.6],
    orig: 95000, price: 69000, grade: "B",
    summary: "Boîte d'origine manquante et trace de colle sur la semelle.",
    defects: [
      { type: "EMBALLAGE_ABIME", zone: "Boîte", sev: 1, desc: "Livrées sans boîte." },
      { type: "TACHE", zone: "Semelle, côté intérieur", sev: 2, desc: "Trace de colle jaunie de 1 cm." },
    ],
    brand: "Nike", material: "Cuir", color: "Rouge", dims: "Pointure 42", weight: 0.9,
    quartier: "Moungali",
  },
];

// Articles déjà vendus (historique des commandes)
const SOLD: ProductSeed[] = [
  {
    v: "MOBILIER", cat: "canapes", s: 1, age: 58, status: "VENDU", qty: 0,
    title: "Salon complet deux canapés beige",
    desc: "Deux canapés 3 places et 2 places en tissu beige, coussins bleu canard.",
    photo: "1560448204-e02f11c3d0e2", focus: [0.3, 0.7, 2.4],
    orig: 1600000, price: 990000, grade: "B",
    summary: "Accroc sur un coussin et légère décoloration côté fenêtre.",
    defects: [{ type: "DECOLORATION", zone: "Accoudoir droit", sev: 3, desc: "Tissu pâli par le soleil." }],
    city: "Brazzaville", quartier: "Centre-ville",
  },
  {
    v: "MOBILIER", cat: "bureau", s: 0, age: 52, status: "VENDU", qty: 0,
    title: "Bureau chêne et fauteuil de travail",
    desc: "Bureau droit en chêne avec fauteuil de travail assorti.",
    photo: "1600494603989-9650cf6ddd3d", focus: [0.75, 0.7, 2.4],
    orig: 420000, price: 290000, grade: "B",
    summary: "Plateau taché par un pot de fleur et accoudoir griffé.",
    defects: [{ type: "TACHE", zone: "Plateau", sev: 3, desc: "Cercle d'eau de 12 cm." }],
    quartier: "Poto-Poto",
  },
  {
    v: "MOBILIER", cat: "cuisine-salle-de-bain", s: 0, age: 45, status: "VENDU", qty: 0,
    title: "Îlot de cuisine avec 3 tabourets",
    desc: "Îlot central plateau quartz blanc et trois tabourets assortis.",
    photo: "1565183928294-7063f23ce0f8", focus: [0.2, 0.8, 2.4],
    orig: 1250000, price: 890000, grade: "B",
    summary: "Plateau éclaté sur un angle.",
    defects: [{ type: "ECLAT", zone: "Angle du plateau", sev: 3, desc: "Éclat de 2 cm." }],
    quartier: "Poto-Poto",
  },
  {
    v: "MOBILIER", cat: "lits-literie", s: 1, age: 40, status: "VENDU", qty: 0,
    title: "Lit 180 bois clair et tête de lit tissu",
    desc: "Lit king size bois clair avec tête de lit en tissu gris.",
    photo: "1540518614846-7eded433c457", focus: [0.5, 0.6, 2.4],
    orig: 860000, price: 560000, grade: "B",
    summary: "Latte fendue remplacée et tête de lit tachée.",
    defects: [{ type: "TACHE", zone: "Tête de lit", sev: 2, desc: "Tache claire de 5 cm." }],
    city: "Brazzaville", quartier: "Centre-ville",
  },
];

const CATEGORIES = [
  { vertical: "MOBILIER", name: "Canapés", slug: "canapes", icon: "armchair" },
  { vertical: "MOBILIER", name: "Fauteuils", slug: "fauteuils", icon: "armchair" },
  { vertical: "MOBILIER", name: "Chaises & tabourets", slug: "chaises-tabourets", icon: "armchair" },
  { vertical: "MOBILIER", name: "Tables", slug: "tables", icon: "grid" },
  { vertical: "MOBILIER", name: "Lits & literie", slug: "lits-literie", icon: "home" },
  { vertical: "MOBILIER", name: "Rangements & buffets", slug: "rangements", icon: "box" },
  { vertical: "MOBILIER", name: "Cuisine & salle de bain", slug: "cuisine-salle-de-bain", icon: "home" },
  { vertical: "MOBILIER", name: "Bureau", slug: "bureau", icon: "grid" },
  { vertical: "SACS", name: "Sacs à main", slug: "sacs-a-main", icon: "bag" },
  { vertical: "SACS", name: "Bandoulières & pochettes", slug: "sacs-bandouliere", icon: "bag" },
  { vertical: "SACS", name: "Cabas & paniers", slug: "cabas", icon: "bag" },
  { vertical: "SACS", name: "Sacs à dos", slug: "sacs-a-dos", icon: "bag" },
  { vertical: "FOURRE_TOUT", name: "Électroménager", slug: "electromenager", icon: "box" },
  { vertical: "FOURRE_TOUT", name: "Électronique & audio", slug: "electronique", icon: "box" },
  { vertical: "FOURRE_TOUT", name: "Luminaires", slug: "luminaires", icon: "lamp" },
  { vertical: "FOURRE_TOUT", name: "Décoration", slug: "decoration", icon: "sparkle" },
  { vertical: "FOURRE_TOUT", name: "Tapis & textiles", slug: "tapis-textiles", icon: "grid" },
  { vertical: "FOURRE_TOUT", name: "Mode & accessoires", slug: "mode-accessoires", icon: "tag" },
];

const ZONES: [string, string, number, number][] = [
  ["Brazzaville", "Centre-ville", 2000, 24],
  ["Brazzaville", "Poto-Poto", 2000, 24],
  ["Brazzaville", "Moungali", 2500, 24],
  ["Brazzaville", "Bacongo", 2500, 24],
  ["Brazzaville", "Ouenzé", 3000, 36],
  ["Brazzaville", "Plateau des 15 ans", 3000, 36],
  ["Brazzaville", "Makélékélé", 3500, 48],
  ["Brazzaville", "Talangaï", 3500, 48],
  ["Brazzaville", "Mfilou", 4000, 48],
  ["Brazzaville", "Djiri", 5000, 72],
  ["Dolisie", "Centre", 5000, 96],
];

// ------------------------------------------------------------------ exécution

async function main() {
  console.log("→ Nettoyage…");
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.message.deleteMany(),
    prisma.threadMember.deleteMany(),
    prisma.thread.deleteMany(),
    prisma.review.deleteMany(),
    prisma.payout.deleteMany(),
    prisma.delivery.deleteMany(),
    prisma.orderEvent.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.defect.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.address.deleteMany(),
    prisma.courierProfile.deleteMany(),
    prisma.sellerProfile.deleteMany(),
    prisma.user.deleteMany(),
    prisma.deliveryZone.deleteMany(),
    prisma.setting.deleteMany(),
  ]);

  const hash = await bcrypt.hash(PASSWORD, 10);

  // ---------------- Réglages
  console.log("→ Réglages & zones de livraison…");
  const settings: [string, string, string][] = [
    ["site.name", "Le Beau Défaut", "Nom de la plateforme"],
    ["site.tagline", "Les petits défauts font de grandes économies", "Signature"],
    ["contact.phone", "065018183", "Téléphone du service client"],
    ["contact.whatsapp", "065018183", "WhatsApp"],
    ["contact.email", "lebeaudefaut@gmail.com", "E-mail de contact"],
    ["commission.default", "15", "Commission par défaut (%)"],
    ["commission.sacs", "20", "Commission sacs de luxe (%)"],
    ["delivery.defaultFee", "3000", "Frais de livraison hors zone (FCFA)"],
    ["returns.days", "3", "Délai de réclamation après livraison (jours)"],
    ["moderation.required", "true", "Validation obligatoire des annonces"],
    ["payment.mtn.merchant", "LBD-MTN-0001", "Code marchand MTN MoMo"],
    ["payment.airtel.merchant", "LBD-AIRTEL-0001", "Code marchand Airtel Money"],
  ];
  for (const [key, value, label] of settings) {
    await prisma.setting.create({ data: { key, value, label } });
  }
  for (const [city, name, fee, etaHours] of ZONES) {
    await prisma.deliveryZone.create({ data: { city, name, fee, etaHours } });
  }

  // ---------------- Catégories
  console.log("→ Catégories…");
  const catBySlug: Record<string, string> = {};
  for (const [i, c] of CATEGORIES.entries()) {
    const created = await prisma.category.create({ data: { ...c, position: i } });
    catBySlug[c.slug] = created.id;
  }

  // ---------------- Utilisateurs
  console.log("→ Comptes…");
  const admin = await prisma.user.create({
    data: {
      email: "lebeaudefaut@gmail.com", phone: "060000001", passwordHash: hash,
      firstName: "Ivan", lastName: "Mouanki", role: "ADMIN", city: "Brazzaville",
      isVerified: true, createdAt: daysAgo(120),
    },
  });
  const moderator = await prisma.user.create({
    data: {
      email: "moderation@lebeaudefaut.cg", phone: "060000002", passwordHash: hash,
      firstName: "Sandrine", lastName: "Malonga", role: "ADMIN", city: "Brazzaville",
      isVerified: true, createdAt: daysAgo(110),
    },
  });

  // Le fournisseur d'origine des articles maison : ce sont des entreprises qui nous
  // vendent leur stock à petit défaut, pas des comptes de la plateforme.
  const SUPPLIERS = ["Maison Mbemba Mobilier", "Showroom Kintélé", "Luxe & Seconde Main"];

  const sellerDefs = [
    {
      email: "vendeur@lebeaudefaut.cg", phone: "066100001", first: "Gaston", last: "Mbemba",
      shop: "Mbemba Déco & Électro", type: "ENTREPRISE", city: "Brazzaville", address: "Avenue de la Paix, Poto-Poto",
      desc: "Nous vendons dans le fourre-tout ce que nos clients nous rapportent : électroménager cabossé au transport, luminaires dépareillés, déco de fin de série.",
      commission: 15, status: "ACTIF", rccm: "CG-BZV-01-2009-B12-00417", niu: "M2009110004172A", momo: "066100001", op: "MTN",
    },
    {
      email: "cotesauvage@lebeaudefaut.cg", phone: "055200002", first: "Nadège", last: "Loubaki",
      shop: "Loubaki Seconde Main", type: "ENTREPRISE", city: "Brazzaville", address: "Avenue de la Tsiémé, Talangaï",
      desc: "Reprises de chantiers hôteliers et de bureaux à Brazzaville. Tout est vendu en l'état, le défaut expliqué.",
      commission: 15, status: "ACTIF", rccm: "CG-PNR-01-2015-B14-00892", niu: "M2015090008921P", momo: "055200002", op: "AIRTEL",
    },
    {
      // La boutique maison : c'est Le Beau Défaut qui vend son propre stock.
      email: "maison@lebeaudefaut.cg", phone: "066300003", first: "Christelle", last: "Okemba",
      shop: "Le Beau Défaut", type: "ENTREPRISE", city: "Brazzaville", address: "Rue Mbaka, Centre-ville",
      desc: "Notre propre stock : mobilier et sacs de luxe rachetés aux entreprises, inspectés pièce par pièce, photographiés sous leur mauvais angle et revendus à leur juste prix.",
      commission: 0, status: "ACTIF", rccm: "CG-BZV-01-2024-B12-02001", niu: "M2024010020015L", momo: "066300003", op: "MTN",
      isHouse: true,
    },
    {
      email: "electroplus@lebeaudefaut.cg", phone: "064400004", first: "Arsène", last: "Ngoma",
      shop: "Électro Plus Congo", type: "ENTREPRISE", city: "Brazzaville", address: "Avenue des Trois Martyrs, Moungali",
      desc: "Électroménager et électronique : produits cabossés au transport, modèles d'exposition, cartons abîmés.",
      commission: 12, status: "ACTIF", rccm: "CG-BZV-01-2012-B12-00733", niu: "M2012070007336E", momo: "064400004", op: "MTN",
    },
    {
      email: "deco.nkouka@lebeaudefaut.cg", phone: "065500005", first: "Prisca", last: "Nkouka",
      shop: "Déco Nkouka", type: "PARTICULIER", city: "Brazzaville", address: "Bacongo",
      desc: "Décoration d'intérieur et objets chinés.",
      commission: 15, status: "EN_ATTENTE", rccm: "", niu: "", momo: "065500005", op: "AIRTEL",
    },
  ];

  const sellers: { userId: string; profileId: string; commission: number; isHouse: boolean }[] = [];
  for (const [i, s] of sellerDefs.entries()) {
    const user = await prisma.user.create({
      data: {
        email: s.email, phone: s.phone, passwordHash: hash, firstName: s.first, lastName: s.last,
        role: "VENDEUR", city: s.city, isVerified: s.status === "ACTIF", createdAt: daysAgo(100 - i * 12),
        seller: {
          create: {
            shopName: s.shop, shopSlug: slugify(s.shop), type: s.type, description: s.desc,
            rccm: s.rccm || null, niu: s.niu || null, contactPhone: s.phone, address: s.address,
            city: s.city, commissionPct: s.commission, status: s.status, isHouse: s.isHouse ?? false,
            mobileMoney: s.momo, mobileMoneyOp: s.op, createdAt: daysAgo(100 - i * 12),
          },
        },
      },
      include: { seller: true },
    });
    sellers.push({ userId: user.id, profileId: user.seller!.id, commission: s.commission, isHouse: s.isHouse ?? false });
  }
  const house = sellers.find((x) => x.isHouse)!;

  const courierDefs = [
    { email: "livreur@lebeaudefaut.cg", phone: "066700007", first: "Rodrigue", last: "Mabiala", vehicle: "CAMIONNETTE", plate: "BZ 4521 CG", zones: "Brazzaville", cap: 800, status: "DISPONIBLE" },
    { email: "fiacre.ibara@lebeaudefaut.cg", phone: "055800008", first: "Fiacre", last: "Ibara", vehicle: "MOTO", plate: "BZ 1187 MT", zones: "Brazzaville", cap: 25, status: "EN_COURSE" },
    { email: "junior.tchicaya@lebeaudefaut.cg", phone: "066900009", first: "Junior", last: "Tchicaya", vehicle: "CAMIONNETTE", plate: "BZ 7730 CG", zones: "Brazzaville", cap: 800, status: "DISPONIBLE" },
  ];
  const couriers: { userId: string; profileId: string; city: string }[] = [];
  for (const [i, c] of courierDefs.entries()) {
    const user = await prisma.user.create({
      data: {
        email: c.email, phone: c.phone, passwordHash: hash, firstName: c.first, lastName: c.last,
        role: "LIVREUR", city: c.zones, isVerified: true, createdAt: daysAgo(90 - i * 5),
        courier: {
          create: { vehicle: c.vehicle, plateNumber: c.plate, zones: c.zones, capacityKg: c.cap, status: c.status },
        },
      },
      include: { courier: true },
    });
    couriers.push({ userId: user.id, profileId: user.courier!.id, city: c.zones });
  }

  const clientDefs = [
    { email: "client@lebeaudefaut.cg", phone: "061010101", first: "Grâce", last: "Moukoko", city: "Brazzaville", q: "Bacongo", landmark: "Derrière la paroisse Saint-Pierre Claver" },
    { email: "herve.samba@exemple.cg", phone: "061020202", first: "Hervé", last: "Samba", city: "Brazzaville", q: "Talangaï", landmark: "Arrêt Mazala, portail bleu" },
    { email: "merveille.ondongo@exemple.cg", phone: "055030303", first: "Merveille", last: "Ondongo", city: "Brazzaville", q: "Mfilou", landmark: "Près du marché Liberté" },
    { email: "dieudonne.kimbembe@exemple.cg", phone: "061040404", first: "Dieudonné", last: "Kimbembe", city: "Brazzaville", q: "Ouenzé", landmark: "Face à la pharmacie Mikalou" },
    { email: "stella.bouanga@exemple.cg", phone: "064050505", first: "Stella", last: "Bouanga", city: "Brazzaville", q: "Moungali", landmark: "Immeuble à côté de la boulangerie" },
    { email: "patrick.makaya@exemple.cg", phone: "055060606", first: "Patrick", last: "Makaya", city: "Brazzaville", q: "Ouenzé", landmark: "Rond-point Kassaï" },
    { email: "ornella.miakassissa@exemple.cg", phone: "066070707", first: "Ornella", last: "Miakassissa", city: "Brazzaville", q: "Centre-ville", landmark: "Résidence du Plateau, 3e étage" },
  ];
  const clients: { id: string; first: string; last: string; phone: string; city: string; q: string; landmark: string }[] = [];
  for (const [i, c] of clientDefs.entries()) {
    const user = await prisma.user.create({
      data: {
        email: c.email, phone: c.phone, passwordHash: hash, firstName: c.first, lastName: c.last,
        role: "CLIENT", city: c.city, quartier: c.q, isVerified: true, createdAt: daysAgo(85 - i * 9),
        lastLoginAt: daysAgo(i),
        addresses: {
          create: { label: "Domicile", fullName: `${c.first} ${c.last}`, phone: c.phone, city: c.city, quartier: c.q, landmark: c.landmark, isDefault: true },
        },
      },
    });
    clients.push({ id: user.id, first: c.first, last: c.last, phone: c.phone, city: c.city, q: c.q, landmark: c.landmark });
  }

  // ---------------- Produits
  console.log("→ Catalogue…");
  const counters: Record<string, number> = { MOBILIER: 0, SACS: 0, FOURRE_TOUT: 0 };
  const prefix: Record<string, string> = { MOBILIER: "M", SACS: "S", FOURRE_TOUT: "F" };
  const created: { id: string; seed: ProductSeed; sellerUserId: string; title: string; cover: string }[] = [];

  for (const p of [...PRODUCTS, ...SOLD]) {
    counters[p.v]++;
    const reference = `LBD-${prefix[p.v]}-${String(counters[p.v]).padStart(5, "0")}`;
    const [fx, fy, fz] = p.focus ?? [0.5, 0.6, 2.6];
    // Mobilier et sacs de luxe : l'article nous appartient, la boutique maison le porte,
    // et l'entreprise qui nous l'a vendu reste mentionnée comme fournisseur.
    const houseItem = p.v !== "FOURRE_TOUT";
    const seller = houseItem ? house : sellers[p.s];
    const status = p.status ?? "PUBLIE";
    const publishedAt = status === "PUBLIE" || status === "VENDU" ? daysAgo(p.age ?? 10, 9) : null;
    const cover = img(p.photo);

    const product = await prisma.product.create({
      data: {
        reference,
        slug: slugify(p.title),
        title: p.title,
        description: p.desc,
        vertical: p.v,
        saleMode: houseItem ? "MAISON" : "PARTICULIER",
        supplierName: houseItem ? SUPPLIERS[p.s] ?? null : null,
        categoryId: catBySlug[p.cat],
        sellerId: seller.userId,
        priceOriginal: p.orig,
        price: p.price,
        discountPct: pct(p.orig, p.price),
        defectGrade: p.grade,
        defectSummary: p.summary,
        brand: p.brand ?? null,
        material: p.material ?? null,
        color: p.color ?? null,
        dimensions: p.dims ?? null,
        weightKg: p.weight ?? null,
        quantity: p.qty ?? 1,
        authenticity: p.v === "SACS" ? p.auth ?? "NON_VERIFIE" : "NON_APPLICABLE",
        hasDustBag: p.dustBag ?? false,
        hasCertif: p.certif ?? false,
        city: p.city ?? "Brazzaville",
        quartier: p.quartier ?? null,
        pickupOnly: p.pickupOnly ?? false,
        negotiable: p.negotiable ?? false,
        status,
        isFeatured: p.featured ?? false,
        isFlashDeal: p.flash ?? false,
        publishedAt,
        moderatorId: publishedAt ? (rand() > 0.5 ? admin.id : moderator.id) : null,
        moderatedAt: publishedAt,
        views: status === "EN_ATTENTE" ? 0 : Math.round(40 + rand() * 420 + (p.featured ? 300 : 0)),
        createdAt: publishedAt ? new Date(publishedAt.getTime() - DAY / 2) : daysAgo(p.age ?? 0, 8),
        images: {
          create: [
            { url: cover, isCover: true, position: 0, alt: p.title },
            { url: detail(p.photo), position: 1, alt: `${p.title} — détail` },
            { url: zoom(p.photo, fx, fy, fz), position: 100, isDefect: true, alt: `Défaut — ${p.summary}` },
          ],
        },
        defects: {
          create: p.defects.map((d) => ({
            type: d.type,
            zone: d.zone,
            severity: d.sev,
            description: d.desc,
            repairable: d.repairable ?? false,
            repairNote: d.note ?? null,
            photoUrl: zoom(p.photo, fx, fy, fz),
          })),
        },
      },
    });
    created.push({ id: product.id, seed: p, sellerUserId: seller.userId, title: p.title, cover });
  }

  const productRejected = created.find((c) => c.seed.status === "EN_ATTENTE" && c.seed.v === "MOBILIER");
  if (productRejected) {
    // Une annonce rejetée pour montrer le flux de correction côté vendeur
    counters.MOBILIER++;
    await prisma.product.create({
      data: {
        reference: `LBD-M-${String(counters.MOBILIER).padStart(5, "0")}`,
        slug: "commode-3-tiroirs-noyer",
        title: "Commode 3 tiroirs noyer",
        description: "Commode en noyer, trois tiroirs, poignées laiton.",
        vertical: "MOBILIER",
        categoryId: catBySlug["rangements"],
        sellerId: sellers[0].userId,
        priceOriginal: 260000,
        price: 235000,
        discountPct: pct(260000, 235000),
        defectGrade: "C",
        defectSummary: "Tiroir du bas cassé et plateau fendu.",
        status: "REJETE",
        rejectionReason:
          "Grade C déclaré mais remise de 10 % seulement : la grille impose au moins 45 %. Ajoutez aussi une photo du tiroir cassé.",
        moderatorId: moderator.id,
        moderatedAt: daysAgo(2),
        createdAt: daysAgo(3),
        images: { create: [{ url: img("1532372320572-cda25653a26d"), isCover: true, alt: "Commode" }] },
        defects: {
          create: [{ type: "PIECE_MANQUANTE", zone: "Tiroir du bas", severity: 4, description: "Fond du tiroir cassé." }],
        },
      },
    });
  }

  // ---------------- Commandes
  console.log("→ Commandes, livraisons, versements…");
  const sellerByUser = new Map(sellers.map((x) => [x.userId, x]));
  const buyable = created.filter((c) => c.seed.status !== "EN_ATTENTE");
  const sold = created.filter((c) => c.seed.status === "VENDU");
  const multi = created.filter((c) => !c.seed.status && (c.seed.qty ?? 1) > 1);
  const singles = created.filter((c) => !c.seed.status && (c.seed.qty ?? 1) === 1);

  type Plan = { day: number; status: string; client: number; items: typeof created; method: string };
  const statuses: string[] = [
    ...Array(19).fill("LIVREE"),
    "EN_LIVRAISON", "EN_LIVRAISON",
    "EN_PREPARATION", "EN_PREPARATION",
    "CONFIRMEE", "CONFIRMEE", "CONFIRMEE",
    "PAYEE",
    "EN_ATTENTE_PAIEMENT", "EN_ATTENTE_PAIEMENT",
    "ANNULEE", "ANNULEE",
  ];
  const methods = ["DEPOT_MOBILE_MONEY"];

  const plans: Plan[] = [];
  let soldIdx = 0;
  statuses.forEach((status, i) => {
    // Les plus anciennes commandes sont livrées, les récentes sont en cours
    const day =
      status === "LIVREE" ? 70 - i * 3.3 : status === "ANNULEE" ? 20 + i : Math.max(0, 6 - (i % 7));
    const items: typeof created = [];
    if (status === "LIVREE" && soldIdx < sold.length) items.push(sold[soldIdx++]);
    else items.push(pick(multi));
    if (rand() > 0.62) {
      const extra = pick(multi);
      if (!items.includes(extra)) items.push(extra);
    }
    if (status === "LIVREE" && rand() > 0.8) {
      const s = pick(singles);
      if (!items.includes(s)) items.push(s);
    }
    plans.push({
      day: Math.round(day),
      status,
      client: i === 0 || i % 5 === 0 ? 0 : 1 + (i % (clients.length - 1)),
      items,
      method: status === "EN_ATTENTE_PAIEMENT" ? "DEPOT_MOBILE_MONEY" : pick(methods),
    });
  });
  // La cliente de démo a toujours au moins une commande en cours
  plans[plans.length - 5].client = 0;
  plans[19].client = 0;
  // …et une commande livrée dont l argent attend sa confirmation (bouton « J ai bien reçu »).
  plans[18].client = 0;

  const flow = ["EN_ATTENTE_PAIEMENT", "PAYEE", "CONFIRMEE", "EN_PREPARATION", "EN_LIVRAISON", "LIVREE"];
  const flowLabels: Record<string, string> = {
    EN_ATTENTE_PAIEMENT: "Commande enregistrée",
    PAYEE: "Paiement reçu",
    CONFIRMEE: "Commande confirmée par le vendeur",
    EN_PREPARATION: "Colis récupéré chez le vendeur",
    EN_LIVRAISON: "En route vers vous",
    LIVREE: "Livrée",
  };

  let orderCount = 0;
  const deliveredOrders: { orderId: string; buyerId: string; productIds: string[]; day: number }[] = [];

  for (const plan of plans) {
    orderCount++;
    const client = clients[plan.client];
    const zone = ZONES.find((z) => z[0] === client.city && z[1] === client.q);
    const createdAt = daysAgo(plan.day, 8 + (orderCount % 10));
    const lines = plan.items.map((it) => {
      const qty = (it.seed.qty ?? 1) > 1 && rand() > 0.7 ? 2 : 1;
      const commission = sellerByUser.get(it.sellerUserId)?.commission ?? 15;
      const lineTotal = it.seed.price * qty;
      return {
        it, qty, commission, lineTotal,
        sellerAmount: Math.round(lineTotal * (1 - commission / 100)),
      };
    });
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const deliveryFee = plan.items.every((i) => i.seed.pickupOnly) ? 0 : zone?.[2] ?? 3000;

    // Étapes franchies
    const cash = plan.method === "ESPECES_LIVRAISON" || plan.method === "ESPECES_SUR_PLACE";
    let steps: string[];
    if (plan.status === "ANNULEE") steps = ["EN_ATTENTE_PAIEMENT", "ANNULEE"];
    else {
      const upto = flow.indexOf(plan.status);
      steps = flow.slice(0, upto + 1).filter((s) => !(cash && s === "PAYEE" && plan.status !== "LIVREE"));
      if (cash) steps = steps.filter((s) => s !== "PAYEE");
    }

    const paid =
      plan.status === "LIVREE" || (!cash && ["PAYEE", "CONFIRMEE", "EN_PREPARATION", "EN_LIVRAISON"].includes(plan.status));

    const courier =
      ["EN_PREPARATION", "EN_LIVRAISON", "LIVREE"].includes(plan.status)
        ? couriers.find((c) => c.city === client.city) ?? couriers[0]
        : plan.status === "CONFIRMEE" && rand() > 0.5
          ? couriers.find((c) => c.city === client.city) ?? null
          : null;

    const deliveryStatus: Record<string, string> = {
      EN_ATTENTE_PAIEMENT: "A_ASSIGNER",
      PAYEE: "A_ASSIGNER",
      CONFIRMEE: courier ? "ASSIGNEE" : "A_ASSIGNER",
      EN_PREPARATION: "RECUPEREE",
      EN_LIVRAISON: "EN_ROUTE",
      LIVREE: "LIVREE",
      ANNULEE: "ECHEC",
    };

    const reference = `LBD-${createdAt.getFullYear()}-${String(orderCount).padStart(6, "0")}`;

    // Ce qui vient d'un vendeur extérieur passe par le séquestre ; notre propre stock, non.
    const escrowAmount = lines
      .filter((l) => !sellerByUser.get(l.it.sellerUserId)?.isHouse)
      .reduce((sum, l) => sum + l.lineTotal, 0);
    const delivered = plan.status === "LIVREE";
    const escrowReleased = delivered && plan.day > 12;
    const escrowStatus =
      escrowAmount === 0 || plan.status === "ANNULEE" || !paid
        ? "AUCUN"
        : escrowReleased
          ? "LIBERE"
          : "SOUS_SEQUESTRE";
    const order = await prisma.order.create({
      data: {
        reference,
        buyerId: client.id,
        status: plan.status,
        paymentMethod: plan.method,
        paymentStatus: paid ? "PAYE" : plan.status === "ANNULEE" ? "ECHOUE" : "EN_ATTENTE",
        paymentRef: paid && !cash ? `MP${createdAt.getTime().toString().slice(-9)}` : null,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        escrowAmount: escrowStatus === "AUCUN" ? 0 : escrowAmount,
        escrowStatus,
        buyerConfirmedAt: escrowReleased && orderCount % 3 === 0 ? daysAgo(plan.day - 3) : null,
        releasedAt: escrowReleased ? daysAgo(plan.day - 2) : null,
        recipientName: `${client.first} ${client.last}`,
        recipientPhone: client.phone,
        city: client.city,
        quartier: client.q,
        landmark: client.landmark,
        notes: orderCount % 4 === 0 ? "Appeler 30 minutes avant d'arriver, s'il vous plaît." : null,
        cancelReason: plan.status === "ANNULEE" ? "Paiement Mobile Money non finalisé sous 48 h" : null,
        paidAt: paid ? notFuture(createdAt.getTime() + 20 * 60 * 1000) : null,
        deliveredAt: plan.status === "LIVREE" ? notFuture(createdAt.getTime() + 2 * DAY) : null,
        createdAt,
        updatedAt: notFuture(createdAt.getTime() + (plan.status === "LIVREE" ? 2 : 0.3) * DAY),
        items: {
          create: lines.map((l) => ({
            productId: l.it.id,
            sellerId: l.it.sellerUserId,
            titleSnapshot: l.it.title,
            imageSnapshot: l.it.cover,
            defectSnapshot: l.it.seed.summary,
            gradeSnapshot: l.it.seed.grade,
            unitPrice: l.it.seed.price,
            quantity: l.qty,
            lineTotal: l.lineTotal,
            commissionPct: l.commission,
            sellerAmount: l.sellerAmount,
          })),
        },
        events: {
          create: steps.map((s, idx) => ({
            status: s,
            label: s === "ANNULEE" ? "Commande annulée" : flowLabels[s],
            note:
              s === "EN_ATTENTE_PAIEMENT"
                ? `Paiement : ${plan.method.replace(/_/g, " ").toLowerCase()}`
                : s === "ANNULEE"
                  ? "Paiement non finalisé"
                  : null,
            createdAt: notFuture(createdAt.getTime() + idx * 0.45 * DAY - (steps.length - 1 - idx) * 60 * 1000),
            actorId: idx === 0 ? client.id : admin.id,
          })),
        },
        delivery: {
          create: {
            status: deliveryStatus[plan.status],
            trackingCode: `LBD${(createdAt.getTime() + orderCount).toString(36).toUpperCase()}`,
            courierId: courier?.profileId ?? null,
            fee: deliveryFee,
            scheduledFor: plan.status === "CONFIRMEE" ? daysAgo(-1, 14) : null,
            pickedUpAt: ["EN_PREPARATION", "EN_LIVRAISON", "LIVREE"].includes(plan.status)
              ? notFuture(createdAt.getTime() + DAY)
              : null,
            deliveredAt: plan.status === "LIVREE" ? notFuture(createdAt.getTime() + 2 * DAY) : null,
            failureNote: plan.status === "ANNULEE" ? "Commande annulée avant expédition" : null,
            createdAt,
          },
        },
      },
    });

    for (const l of lines) {
      if (plan.status !== "ANNULEE") {
        await prisma.product.update({ where: { id: l.it.id }, data: { soldCount: { increment: l.qty } } });
      }
    }

    if (plan.status === "LIVREE") {
      deliveredOrders.push({ orderId: order.id, buyerId: client.id, productIds: lines.map((l) => l.it.id), day: plan.day });

      // Versements : la boutique maison n'en reçoit pas (l'argent est déjà à nous),
      // les vendeurs du fourre-tout sont payés à la sortie du séquestre.
      const bySeller = new Map<string, { amount: number; gross: number }>();
      for (const l of lines) {
        const cur = bySeller.get(l.it.sellerUserId) ?? { amount: 0, gross: 0 };
        cur.amount += l.sellerAmount;
        cur.gross += l.lineTotal;
        bySeller.set(l.it.sellerUserId, cur);
      }
      for (const [sellerUserId, v] of bySeller) {
        const profile = sellerByUser.get(sellerUserId);
        if (!profile) continue;
        await prisma.sellerProfile.update({
          where: { id: profile.profileId },
          data: { totalSales: { increment: v.gross } },
        });
        if (profile.isHouse) continue;

        const isPaid = escrowReleased && plan.day > 20;
        await prisma.payout.create({
          data: {
            sellerId: profile.profileId,
            orderId: order.id,
            amount: v.amount,
            commission: v.gross - v.amount,
            status: isPaid ? "PAYE" : escrowReleased ? "EN_ATTENTE" : "SEQUESTRE",
            method: "MOBILE_MONEY",
            reference: isPaid ? `VRS-${reference.slice(-6)}` : null,
            paidAt: isPaid ? daysAgo(plan.day - 4) : null,
            createdAt: daysAgo(plan.day - 2),
          },
        });
      }
      if (courier) {
        await prisma.courierProfile.update({ where: { id: courier.profileId }, data: { totalRuns: { increment: 1 } } });
      }
    }
  }

  // ---------------- Avis
  console.log("→ Avis…");
  const comments = [
    "Exactement comme sur les photos. La rayure est encore plus discrète en vrai.",
    "Très bon rapport qualité-prix, livraison rapide à Bacongo.",
    "Le défaut était bien décrit, aucune mauvaise surprise. Je recommande.",
    "Le livreur a monté le meuble, super service.",
    "Conforme à l'annonce. La tache est partie avec un peu de savon de Marseille !",
    "Bonne affaire, j'ai économisé presque la moitié du prix en magasin.",
    "Produit conforme mais la livraison a pris un jour de plus que prévu.",
    "Rien à redire, je reviendrai.",
  ];
  const reviewed = new Set<string>();
  for (const [i, d] of deliveredOrders.entries()) {
    if (i % 3 === 2) continue;
    for (const productId of d.productIds) {
      const key = `${productId}-${d.buyerId}`;
      if (reviewed.has(key)) continue;
      reviewed.add(key);
      const unhappy = i === 7;
      await prisma.review.create({
        data: {
          productId,
          userId: d.buyerId,
          rating: unhappy ? 3 : i % 4 === 0 ? 4 : 5,
          comment: unhappy
            ? "Le défaut principal était bien annoncé, mais il y avait aussi une petite rayure non mentionnée. Le vendeur a fait un geste."
            : comments[i % comments.length],
          defectAsDescribed: !unhappy,
          createdAt: daysAgo(Math.max(0, d.day - 3)),
        },
      });
    }
  }
  // Notes des vendeurs
  for (const s of sellers) {
    const agg = await prisma.review.aggregate({
      where: { product: { sellerId: s.userId } },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.sellerProfile.update({
      where: { id: s.profileId },
      data: { rating: agg._avg.rating ?? 0, ratingCount: agg._count },
    });
  }

  // ---------------- Réclamations (la garantie « défaut conforme »)
  console.log("→ Réclamations…");
  const claimable = deliveredOrders.slice(0, 6);
  if (claimable.length >= 2) {
    const first = await prisma.order.findUnique({
      where: { id: claimable[0].orderId },
      include: { items: { take: 1 } },
    });
    const second = await prisma.order.findUnique({
      where: { id: claimable[3]?.orderId ?? claimable[1].orderId },
      include: { items: { take: 1 } },
    });

    if (first?.items[0]) {
      await prisma.claim.create({
        data: {
          reference: "REC-2026-00001",
          orderId: first.id,
          orderItemId: first.items[0].id,
          buyerId: first.buyerId,
          type: "DEFAUT_NON_ANNONCE",
          description:
            "Le défaut annoncé est bien là, mais il y a aussi une entaille de 6 cm derrière le pied droit qui n'apparaît sur aucune photo.",
          photoUrl: zoom("1503602642458-232111445657", 0.4, 0.75, 3.2),
          status: "OUVERTE",
          createdAt: daysAgo(1, 16),
        },
      });
    }

    if (second?.items[0]) {
      const refund = Math.round(second.total * 0.3);
      await prisma.claim.create({
        data: {
          reference: "REC-2026-00002",
          orderId: second.id,
          orderItemId: second.items[0].id,
          buyerId: second.buyerId,
          type: "PIECE_MANQUANTE",
          description: "Il manque la visserie annoncée dans la description, impossible de monter le meuble.",
          status: "ACCEPTEE",
          resolution: "GESTE_COMMERCIAL",
          refundAmount: refund,
          adminNote: "Visserie envoyée par le vendeur et remise de 30 % accordée pour le dérangement.",
          handledById: admin.id,
          handledAt: daysAgo(9, 11),
          createdAt: daysAgo(10, 9),
        },
      });
    }
  }

  // ---------------- Favoris & panier de la cliente de démo
  console.log("→ Favoris, panier, messages, notifications…");
  const demo = clients[0];
  const favPicks = created.filter((c) => c.seed.featured && !c.seed.status).slice(0, 5);
  for (const f of favPicks) {
    await prisma.favorite.create({ data: { userId: demo.id, productId: f.id } });
  }
  for (const [i, c] of clients.slice(1).entries()) {
    const f = created.filter((x) => !x.seed.status)[(i * 7) % 40];
    await prisma.favorite.create({ data: { userId: c.id, productId: f.id } }).catch(() => {});
  }
  const cartPicks = created.filter((c) => !c.seed.status && c.seed.v === "FOURRE_TOUT").slice(1, 3);
  for (const c of cartPicks) {
    await prisma.cartItem.create({ data: { userId: demo.id, productId: c.id, quantity: 1 } });
  }

  // ---------------- Messagerie
  const convos: { client: number; productTitle: string; lines: [number, string][] }[] = [
    {
      client: 0,
      productTitle: "Canapé 3 places cuir pleine fleur cognac",
      lines: [
        [0, "Bonjour, la rayure sur l'accoudoir se sent-elle au toucher ?"],
        [1, "Bonjour Madame Moukoko. Non, elle est uniquement en surface. Je peux vous envoyer une vidéo sur WhatsApp si vous voulez."],
        [0, "Oui avec plaisir. Et la livraison à Bacongo est possible samedi ?"],
        [1, "Oui, samedi matin c'est possible. Le livreur vous appellera la veille."],
      ],
    },
    {
      client: 2,
      productTitle: "Réfrigérateur rétro vert menthe 250 L",
      lines: [
        [0, "La bosse gêne-t-elle l'ouverture de la porte ?"],
        [1, "Pas du tout, elle est sur le flanc. La porte ferme parfaitement, on l'a testé 72 h."],
      ],
    },
    {
      client: 4,
      productTitle: "Gucci GG Marmont petit sac matelassé noir",
      lines: [
        [0, "Le sac est-il vendu avec sa facture d'origine ?"],
        [1, "Oui, facture et dust bag. Il a aussi passé le contrôle d'authenticité Le Beau Défaut."],
        [0, "Parfait, je passe commande ce soir."],
      ],
    },
  ];
  for (const [ci, conv] of convos.entries()) {
    const product = created.find((c) => c.title === conv.productTitle);
    if (!product) continue;
    const client = clients[conv.client];
    const thread = await prisma.thread.create({
      data: {
        productId: product.id,
        subject: product.title,
        createdAt: daysAgo(4 - ci),
        members: {
          create: [
            { userId: client.id, lastReadAt: daysAgo(0) },
            { userId: product.sellerUserId, lastReadAt: ci === 0 ? daysAgo(2) : daysAgo(0) },
          ],
        },
      },
    });
    for (const [li, [who, body]] of conv.lines.entries()) {
      await prisma.message.create({
        data: {
          threadId: thread.id,
          senderId: who === 0 ? client.id : product.sellerUserId,
          body,
          createdAt: new Date(daysAgo(4 - ci).getTime() + li * 45 * 60 * 1000),
        },
      });
    }
  }

  // ---------------- Notifications
  const pendingCount = await prisma.product.count({ where: { status: "EN_ATTENTE" } });
  const notifs = [
    { userId: admin.id, type: "ANNONCE", title: "Annonces à valider", body: `${pendingCount} annonces attendent votre validation.`, link: "/admin/annonces?statut=EN_ATTENTE", isRead: false },
    { userId: admin.id, type: "SYSTEME", title: "Nouvelle boutique", body: "Déco Nkouka demande l'ouverture de sa boutique.", link: "/admin/vendeurs", isRead: false },
    { userId: sellers[0].userId, type: "COMMANDE", title: "Nouvelle vente", body: "Un lot de tabourets vient d'être commandé.", link: "/vendeur/ventes", isRead: false },
    { userId: sellers[0].userId, type: "ANNONCE", title: "Annonce à corriger", body: "« Commode 3 tiroirs noyer » : la remise ne correspond pas au grade C.", link: "/vendeur/annonces", isRead: false },
    { userId: sellers[0].userId, type: "PAIEMENT", title: "Versement effectué", body: "Votre versement de la semaine a été envoyé sur MTN MoMo.", link: "/vendeur/paiements", isRead: true },
    { userId: couriers[0].userId, type: "COMMANDE", title: "Nouvelle course", body: "Une livraison vous a été assignée à Bacongo.", link: "/livreur", isRead: false },
    { userId: demo.id, type: "COMMANDE", title: "Votre commande est en route", body: "Le livreur arrive dans la journée.", link: "/compte/commandes", isRead: false },
    { userId: demo.id, type: "MESSAGE", title: "Message de Gaston", body: "Oui, samedi matin c'est possible.", link: "/messages", isRead: false },
  ];
  for (const [i, n] of notifs.entries()) {
    await prisma.notification.create({ data: { ...n, createdAt: daysAgo(i * 0.3) } });
  }

  // ---------------- Journal d'audit
  const logs = [
    [admin.id, "APPROUVER_ANNONCE", "Product", "LBD-S-00001"],
    [moderator.id, "REJETER_ANNONCE", "Product", "Commode 3 tiroirs noyer"],
    [admin.id, "STATUT_VENDEUR", "SellerProfile", "Électro Plus Congo → ACTIF"],
    [admin.id, "AUTHENTICITE", "Product", "Prada Cahier → AUTHENTIFIE_LBD"],
    [moderator.id, "ASSIGNER_LIVREUR", "Delivery", "Rodrigue Mabiala"],
    [admin.id, "VERSEMENT_PAYE", "Payout", "Maison Mbemba Mobilier"],
  ];
  for (const [i, [actorId, action, entity, details]] of logs.entries()) {
    await prisma.auditLog.create({ data: { actorId, action, entity, details, createdAt: daysAgo(i + 0.5) } });
  }

  const totals = {
    utilisateurs: await prisma.user.count(),
    articles: await prisma.product.count(),
    commandes: await prisma.order.count(),
    avis: await prisma.review.count(),
  };
  console.log("✔ Terminé :", totals);
  console.log(`\nComptes de démo (mot de passe : ${PASSWORD})`);
  console.log("  Acheteur         : client@lebeaudefaut.cg");
  console.log("  Vendeur fourre-tout : vendeur@lebeaudefaut.cg");
  console.log("  Boutique maison  : maison@lebeaudefaut.cg   (equipe)");
  console.log("  Livreur          : livreur@lebeaudefaut.cg  (equipe)");
  console.log("  Administration   : lebeaudefaut@gmail.com (equipe, /acces-equipe)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
