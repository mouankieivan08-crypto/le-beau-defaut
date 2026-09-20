/**
 * Le Beau Défaut — vocabulaire métier partagé.
 * Tout ce qui est stocké en base sous forme de chaîne est décrit ici.
 */

// ---------------------- VERTICALES ----------------------

export const VERTICALS = {
  MOBILIER: {
    key: "MOBILIER",
    label: "Mobilier",
    slug: "mobilier",
    tagline: "Canapés, tables, rangements — le petit défaut en moins cher.",
    icon: "armchair",
  },
  SACS: {
    key: "SACS",
    label: "Sacs de luxe",
    slug: "sacs-de-luxe",
    tagline: "Pièces authentifiées, prix raisonnable.",
    icon: "bag",
  },
  FOURRE_TOUT: {
    key: "FOURRE_TOUT",
    label: "Fourre-tout",
    slug: "fourre-tout",
    tagline: "Déco, électroménager, luminaires, bonnes affaires.",
    icon: "box",
  },
} as const;

export type VerticalKey = keyof typeof VERTICALS;
export const VERTICAL_LIST = Object.values(VERTICALS);

export function verticalFromSlug(slug: string) {
  return VERTICAL_LIST.find((v) => v.slug === slug);
}

// ---------------------- GRADES DE DÉFAUT ----------------------

/**
 * La grille du défaut : c'est la promesse de la marque.
 * Chaque annonce est classée et la remise attendue en découle.
 */
export const GRADES = {
  A: {
    key: "A",
    label: "Grade A",
    name: "Défaut discret",
    short: "Presque invisible",
    description:
      "Le défaut ne se voit qu'en regardant de près : micro-rayure, fin de série, emballage abîmé. L'article est fonctionnel à 100 %.",
    minDiscount: 10,
    maxDiscount: 25,
    color: "var(--color-grade-a)",
    bg: "var(--color-grade-a-bg)",
  },
  B: {
    key: "B",
    label: "Grade B",
    name: "Défaut visible",
    short: "Visible, sans gêne",
    description:
      "Le défaut se remarque mais n'affecte ni l'usage ni la solidité : tache légère, décoloration, petite bosse.",
    minDiscount: 25,
    maxDiscount: 45,
    color: "var(--color-grade-b)",
    bg: "var(--color-grade-b-bg)",
  },
  C: {
    key: "C",
    label: "Grade C",
    name: "Défaut marqué",
    short: "Marqué, prix cassé",
    description:
      "Défaut franc : accroc, pièce manquante, usure nette. On le montre en photo, on le décrit, et le prix le reflète.",
    minDiscount: 45,
    maxDiscount: 70,
    color: "var(--color-grade-c)",
    bg: "var(--color-grade-c-bg)",
  },
} as const;

export type GradeKey = keyof typeof GRADES;
export const GRADE_LIST = Object.values(GRADES);

export function gradeOf(key: string) {
  return GRADES[key as GradeKey] ?? GRADES.A;
}

// ---------------------- TYPES DE DÉFAUT ----------------------

export const DEFECT_TYPES = [
  { key: "RAYURE", label: "Rayure", verticals: ["MOBILIER", "SACS", "FOURRE_TOUT"] },
  { key: "TACHE", label: "Tache", verticals: ["MOBILIER", "SACS", "FOURRE_TOUT"] },
  { key: "ACCROC", label: "Accroc / déchirure", verticals: ["MOBILIER", "SACS", "FOURRE_TOUT"] },
  { key: "DECOLORATION", label: "Décoloration", verticals: ["MOBILIER", "SACS", "FOURRE_TOUT"] },
  { key: "BOSSE", label: "Bosse / enfoncement", verticals: ["MOBILIER", "FOURRE_TOUT"] },
  { key: "ECLAT", label: "Éclat / fissure", verticals: ["MOBILIER", "FOURRE_TOUT"] },
  { key: "PIECE_MANQUANTE", label: "Pièce manquante", verticals: ["MOBILIER", "SACS", "FOURRE_TOUT"] },
  { key: "FIN_DE_SERIE", label: "Fin de série / démodé", verticals: ["MOBILIER", "SACS", "FOURRE_TOUT"] },
  { key: "EMBALLAGE_ABIME", label: "Emballage abîmé", verticals: ["MOBILIER", "SACS", "FOURRE_TOUT"] },
  { key: "DEMONTE", label: "Livré démonté", verticals: ["MOBILIER"] },
  { key: "ODEUR", label: "Odeur / stockage", verticals: ["MOBILIER", "SACS", "FOURRE_TOUT"] },
  { key: "USURE", label: "Usure d'usage", verticals: ["MOBILIER", "SACS", "FOURRE_TOUT"] },
  { key: "AUTRE", label: "Autre", verticals: ["MOBILIER", "SACS", "FOURRE_TOUT"] },
] as const;

export function defectTypeLabel(key: string) {
  return DEFECT_TYPES.find((d) => d.key === key)?.label ?? key;
}

export function defectTypesFor(vertical: string) {
  return DEFECT_TYPES.filter((d) => (d.verticals as readonly string[]).includes(vertical));
}

export const SEVERITY_LABELS: Record<number, string> = {
  1: "Très léger",
  2: "Léger",
  3: "Modéré",
  4: "Prononcé",
  5: "Marqué",
};

// ---------------------- RÔLES ----------------------

export const ROLES = {
  CLIENT: { key: "CLIENT", label: "Client", home: "/compte" },
  VENDEUR: { key: "VENDEUR", label: "Vendeur", home: "/vendeur" },
  LIVREUR: { key: "LIVREUR", label: "Livreur", home: "/livreur" },
  ADMIN: { key: "ADMIN", label: "Administrateur", home: "/admin" },
} as const;

export type RoleKey = keyof typeof ROLES;

export function homeForRole(role: string) {
  return ROLES[role as RoleKey]?.home ?? "/compte";
}

// ---------------------- STATUTS ----------------------

export const PRODUCT_STATUS: Record<string, { label: string; tone: string }> = {
  BROUILLON: { label: "Brouillon", tone: "neutral" },
  EN_ATTENTE: { label: "En attente de validation", tone: "warning" },
  PUBLIE: { label: "Publiée", tone: "success" },
  REJETE: { label: "Rejetée", tone: "danger" },
  VENDU: { label: "Vendue", tone: "info" },
  ARCHIVE: { label: "Archivée", tone: "neutral" },
};

export const ORDER_STATUS_FLOW = [
  "EN_ATTENTE_PAIEMENT",
  "PAYEE",
  "CONFIRMEE",
  "EN_PREPARATION",
  "EN_LIVRAISON",
  "LIVREE",
] as const;

export const ORDER_STATUS: Record<string, { label: string; tone: string; step: number }> = {
  EN_ATTENTE_PAIEMENT: { label: "En attente de paiement", tone: "warning", step: 0 },
  PAYEE: { label: "Payée", tone: "info", step: 1 },
  CONFIRMEE: { label: "Confirmée", tone: "info", step: 2 },
  EN_PREPARATION: { label: "En préparation", tone: "info", step: 3 },
  EN_LIVRAISON: { label: "En livraison", tone: "info", step: 4 },
  LIVREE: { label: "Livrée", tone: "success", step: 5 },
  ANNULEE: { label: "Annulée", tone: "danger", step: -1 },
  REMBOURSEE: { label: "Remboursée", tone: "neutral", step: -1 },
};

export const DELIVERY_STATUS: Record<string, { label: string; tone: string }> = {
  A_ASSIGNER: { label: "À assigner", tone: "warning" },
  ASSIGNEE: { label: "Assignée", tone: "info" },
  RECUPEREE: { label: "Colis récupéré", tone: "info" },
  EN_ROUTE: { label: "En route", tone: "info" },
  LIVREE: { label: "Livrée", tone: "success" },
  ECHEC: { label: "Échec de livraison", tone: "danger" },
};

export const PAYMENT_METHODS = [
  { key: "MOBILE_MONEY_MTN", label: "MTN Mobile Money", hint: "Paiement à la validation" },
  { key: "MOBILE_MONEY_AIRTEL", label: "Airtel Money", hint: "Paiement à la validation" },
  { key: "ESPECES_LIVRAISON", label: "Espèces à la livraison", hint: "Vous payez le livreur" },
  { key: "VIREMENT", label: "Virement bancaire", hint: "Pour les entreprises" },
] as const;

export function paymentMethodLabel(key: string) {
  return PAYMENT_METHODS.find((p) => p.key === key)?.label ?? key;
}

export const PAYMENT_STATUS: Record<string, { label: string; tone: string }> = {
  EN_ATTENTE: { label: "En attente", tone: "warning" },
  PAYE: { label: "Payé", tone: "success" },
  ECHOUE: { label: "Échoué", tone: "danger" },
  REMBOURSE: { label: "Remboursé", tone: "neutral" },
};

// ---------------------- RÉCLAMATIONS ----------------------

/** La garantie de la maison : ce qui est annoncé est ce que vous recevez. */
export const CLAIM_TYPES = [
  { key: "DEFAUT_NON_ANNONCE", label: "Un défaut n'était pas annoncé", hint: "Une rayure, une tache ou une casse absente de la fiche." },
  { key: "ARTICLE_DIFFERENT", label: "L'article ne correspond pas", hint: "Couleur, matière, dimensions ou modèle différents." },
  { key: "CASSE_TRANSPORT", label: "Article cassé au transport", hint: "Il est arrivé endommagé entre le vendeur et vous." },
  { key: "PIECE_MANQUANTE", label: "Il manque une pièce", hint: "Visserie, tablette, bandoulière, accessoire annoncé." },
  { key: "NON_LIVRE", label: "Je n'ai jamais reçu la commande", hint: "La commande est marquée livrée mais rien n'est arrivé." },
  { key: "AUTRE", label: "Autre problème", hint: "Décrivez-le en quelques lignes." },
] as const;

export function claimTypeLabel(key: string) {
  return CLAIM_TYPES.find((t) => t.key === key)?.label ?? key;
}

export const CLAIM_STATUS: Record<string, { label: string; tone: string }> = {
  OUVERTE: { label: "Nouvelle", tone: "danger" },
  EN_EXAMEN: { label: "En cours d'examen", tone: "warning" },
  ACCEPTEE: { label: "Acceptée", tone: "success" },
  REFUSEE: { label: "Refusée", tone: "neutral" },
  CLOTUREE: { label: "Clôturée", tone: "neutral" },
};

export const CLAIM_RESOLUTIONS = [
  { key: "REMBOURSEMENT", label: "Remboursement", hint: "Tout ou partie de la commande est remboursé." },
  { key: "REPRISE", label: "Reprise de l'article", hint: "Le livreur récupère l'article et le client est remboursé." },
  { key: "GESTE_COMMERCIAL", label: "Geste commercial", hint: "Remise partielle, le client garde l'article." },
  { key: "AUCUNE", label: "Sans suite", hint: "La réclamation n'est pas fondée." },
] as const;

export function claimResolutionLabel(key: string | null) {
  return CLAIM_RESOLUTIONS.find((r) => r.key === key)?.label ?? "—";
}

/** Délai pendant lequel une commande livrée peut être contestée (jours). */
export const CLAIM_WINDOW_DAYS = 3;

export const SELLER_STATUS: Record<string, { label: string; tone: string }> = {
  EN_ATTENTE: { label: "En attente", tone: "warning" },
  ACTIF: { label: "Actif", tone: "success" },
  SUSPENDU: { label: "Suspendu", tone: "danger" },
};

export const AUTHENTICITY: Record<string, { label: string; tone: string }> = {
  NON_APPLICABLE: { label: "—", tone: "neutral" },
  NON_VERIFIE: { label: "Non vérifié", tone: "neutral" },
  EN_COURS: { label: "Vérification en cours", tone: "warning" },
  AUTHENTIFIE_LBD: { label: "Authentifié LBD", tone: "success" },
  REFUSE: { label: "Authenticité refusée", tone: "danger" },
};

// ---------------------- GÉOGRAPHIE ----------------------

export const CITIES = ["Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi", "Ouesso", "Owando"] as const;

export const QUARTIERS: Record<string, string[]> = {
  Brazzaville: [
    "Bacongo",
    "Poto-Poto",
    "Moungali",
    "Ouenzé",
    "Talangaï",
    "Mfilou",
    "Makélékélé",
    "Djiri",
    "Centre-ville",
    "Plateau des 15 ans",
  ],
  "Pointe-Noire": [
    "Loandjili",
    "Tié-Tié",
    "Mvou-Mvou",
    "Lumumba",
    "Ngoyo",
    "Mongo-Mpoukou",
    "Centre-ville",
  ],
  Dolisie: ["Centre", "Mbounda", "Nkouikou"],
  Nkayi: ["Centre", "Quartier 1", "Quartier 2"],
  Ouesso: ["Centre", "Mbindjo"],
  Owando: ["Centre", "Mananga"],
};

export const VEHICLES: Record<string, { label: string; capacity: number }> = {
  MOTO: { label: "Moto", capacity: 25 },
  TRICYCLE: { label: "Tricycle", capacity: 120 },
  CAMIONNETTE: { label: "Camionnette", capacity: 800 },
  CAMION: { label: "Camion", capacity: 3000 },
};

// ---------------------- DIVERS ----------------------

export const CURRENCY = "FCFA";
export const DEFAULT_COMMISSION_PCT = 15;
export const BRAND = {
  name: "Le Beau Défaut",
  short: "LBD",
  tagline: "Les petits défauts font de grandes économies",
  pillars: ["Mobilier", "Décoration", "Qualité", "Prix raisonnable"],
};

export const TONE_CLASSES: Record<string, string> = {
  neutral: "bg-[var(--color-cream-deep)] text-[var(--color-ink-muted)]",
  success: "bg-[var(--color-grade-a-bg)] text-[var(--color-grade-a)]",
  warning: "bg-[var(--color-grade-b-bg)] text-[var(--color-gold-deep)]",
  danger: "bg-[var(--color-grade-c-bg)] text-[var(--color-danger)]",
  info: "bg-[#e7eef3] text-[var(--color-info)]",
};

// ---------------------- LES DEUX CIRCUITS DE VENTE ----------------------

/**
 * Le Beau Défaut fonctionne sur deux circuits bien distincts :
 *
 *  · MAISON       — le mobilier et les sacs de luxe nous appartiennent. Nous les
 *                   achetons aux entreprises, nous les remettons en lumière, nous
 *                   les vendons. L'acheteur parle directement à notre équipe.
 *  · PARTICULIER  — le fourre-tout est une place de marché : nous mettons en
 *                   relation un vendeur et un acheteur. L'argent est conservé par
 *                   Le Beau Défaut jusqu'à la livraison (séquestre) et les échanges
 *                   restent sur la plateforme.
 */
export const SALE_MODES = {
  MAISON: {
    key: "MAISON",
    label: "Vendu par Le Beau Défaut",
    short: "Notre stock",
    description: "Cet article nous appartient. Nous l'avons inspecté, photographié et nous l'expédions nous-mêmes.",
    tone: "gold",
  },
  PARTICULIER: {
    key: "PARTICULIER",
    label: "Mise en relation sécurisée",
    short: "Entre particuliers",
    description:
      "Le Beau Défaut met en relation le vendeur et l'acheteur. Votre paiement est conservé par nos soins et n'est versé au vendeur qu'une fois l'article reçu.",
    tone: "info",
  },
} as const;

export type SaleModeKey = keyof typeof SALE_MODES;

/** Les univers que Le Beau Défaut vend en son nom propre. */
export const HOUSE_VERTICALS = ["MOBILIER", "SACS"] as const;

/** Le circuit découle de l'univers : mobilier et sacs sont à nous, le fourre-tout est ouvert. */
export function saleModeForVertical(vertical: string): SaleModeKey {
  return (HOUSE_VERTICALS as readonly string[]).includes(vertical) ? "MAISON" : "PARTICULIER";
}

export function saleModeOf(key: string) {
  return SALE_MODES[key as SaleModeKey] ?? SALE_MODES.PARTICULIER;
}

/** Univers qu'un vendeur extérieur peut proposer. */
export const OPEN_VERTICALS = ["FOURRE_TOUT"] as const;

// ---------------------- SÉQUESTRE ----------------------

export const ESCROW_STATUS: Record<string, { label: string; tone: string; description: string }> = {
  AUCUN: {
    label: "Sans séquestre",
    tone: "neutral",
    description: "Article vendu par Le Beau Défaut : pas d'intermédiaire à protéger.",
  },
  SOUS_SEQUESTRE: {
    label: "Argent conservé",
    tone: "info",
    description: "Le Beau Défaut conserve le paiement. Le vendeur ne touche rien tant que vous n'avez pas reçu l'article.",
  },
  LIBERE: {
    label: "Versé au vendeur",
    tone: "success",
    description: "Réception confirmée : la somme a été versée au vendeur, commission déduite.",
  },
  REMBOURSE: {
    label: "Remboursé à l'acheteur",
    tone: "danger",
    description: "La somme a été rendue à l'acheteur.",
  },
};

/** Délai au bout duquel l'argent part au vendeur sans confirmation de l'acheteur. */
export const ESCROW_RELEASE_DAYS = 3;

/** Adresse discrète de connexion de l'équipe (jamais affichée au public). */
export const TEAM_ACCESS_PATH = "/acces-equipe";

/** Identifiant de la boutique maison. */
export const HOUSE_SHOP_SLUG = "le-beau-defaut";
