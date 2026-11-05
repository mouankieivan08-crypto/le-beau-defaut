/**
 * Contenu de la publicité.
 *
 * C'est le seul fichier à modifier pour une nouvelle campagne : photos, prix,
 * défaut annoncé, adresse du site. Les photos vont dans public/img/.
 *
 * ⚠ Les articles ci-dessous viennent du catalogue de démonstration. Avant de
 *    diffuser une campagne payante, remplacez-les par de vrais articles en stock,
 *    photographiés avec leur vrai défaut : c'est la promesse même de la marque.
 */

export const HERO = {
  title: "Canapé 3 places cuir cognac",
  photo: "img/canape-cognac.jpg",
  defectPhoto: "img/canape-cognac-defaut.jpg",
  defect: "Rayure de 5 cm",
  defectZone: "accoudoir gauche",
  grade: "B" as const,
  priceOriginal: 1_250_000,
  price: 790_000,
  quartier: "Poto-Poto",
  /** Position du défaut dans la photo (0 → 1), pour la loupe. */
  defectAt: { x: 0.115, y: 0.6 },
};

export const CATALOGUE = [
  { title: "Canapé cuir cognac", photo: "img/canape-cognac.jpg", price: 790_000, was: 1_250_000, grade: "B" },
  { title: "Canapé d'angle lin", photo: "img/canape-angle.jpg", price: 890_000, was: 1_450_000, grade: "B" },
  { title: "Canapé jaune soleil", photo: "img/canape-jaune.jpg", price: 260_000, was: 520_000, grade: "C" },
  { title: "Fauteuils club", photo: "img/fauteuils.jpg", price: 235_000, was: 480_000, grade: "C" },
  { title: "Étagère chêne clair", photo: "img/etagere.jpg", price: 105_000, was: 210_000, grade: "C" },
  { title: "Chaises bistrot", photo: "img/chaises.jpg", price: 29_000, was: 65_000, grade: "C" },
  { title: "Cuisine d'exposition", photo: "img/cuisine.jpg", price: 2_900_000, was: 4_800_000, grade: "B" },
  { title: "Canapé gris chiné", photo: "img/canape-gris.jpg", price: 490_000, was: 980_000, grade: "C" },
] as const;

export const GRADES = [
  { key: "A", name: "Défaut discret", range: "−10 à 25 %", color: "#276B4E", bg: "#E6F2EC" },
  { key: "B", name: "Défaut visible", range: "−25 à 45 %", color: "#7D5E1F", bg: "#F7EFDD" },
  { key: "C", name: "Défaut marqué", range: "−45 à 70 %", color: "#A34E2D", bg: "#F8E9E2" },
] as const;

export const DEPOSIT = [
  { operator: "MTN MoMo", number: "06 501 81 83" },
  { operator: "Airtel Money", number: "05 541 12 48" },
];

export const SITE = "le-beau-defaut.vercel.app";
export const WHATSAPP = "06 501 81 83";
export const CITY = "Brazzaville";
