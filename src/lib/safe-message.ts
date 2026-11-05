/**
 * Protection des échanges : on masque les coordonnées avant d'enregistrer un message,
 * afin de garder les achats et échanges sur la plateforme seule.
 *
 * Le seuil de huit chiffres évite de masquer les prix : « 250 000 FCFA » passe,
 * « 06 123 45 67 » ne passe pas.
 */

const MASK = "[coordonnées masquées]";

const RULES: RegExp[] = [
  // Adresses e-mail
  /[\w.+-]+\s*(?:@|\(at\)|\[at\])\s*[\w-]+\s*(?:\.|\(dot\))\s*[\w.]{2,}/gi,
  // Liens
  /\b(?:https?:\/\/|www\.)\S+/gi,
  // Renvois explicites vers une messagerie extérieure
  /\b(?:wa\.me|whats?'?app|whatsapp|wtsp|telegram|t\.me|viber|signal|imo|messenger|snapchat|instagram|facebook|tiktok)\b[^\s,.;!?]*/gi,
  // Pseudos @quelquechose
  /(^|[^\w])@[a-z0-9._-]{3,}/gi,
  // Suites d'au moins huit chiffres, séparateurs compris (+242 06 123 45 67, 06-123-45-67…)
  /(?:\+?\d[\d\s.\-/()]{6,}\d)/g,
];

/** Nombre de chiffres réellement présents dans une suite. */
const digitCount = (s: string) => (s.match(/\d/g) ?? []).length;

export type SafeMessage = { body: string; filtered: boolean };

/** Masque les coordonnées d'un message. Renvoie le texte nettoyé et s'il a été modifié. */
export function sanitizeMessage(input: string): SafeMessage {
  let body = input;

  for (const rule of RULES) {
    body = body.replace(rule, (match, lead) => {
      // Les suites de chiffres courtes sont des prix, des quantités, des dimensions.
      if (/^\D*\d[\d\s.\-/()]*\d\D*$/.test(match) && digitCount(match) < 8) return match;
      return typeof lead === "string" ? `${lead}${MASK}` : MASK;
    });
  }

  // Un message qui n'est plus qu'un masque n'apporte rien : on le signale quand même.
  const filtered = body !== input;
  return { body: body.replace(/\s{3,}/g, "  ").trim(), filtered };
}

/** Message affiché à l'expéditeur quand ses coordonnées ont été retirées. */
export const FILTER_NOTICE =
  "Les numéros, adresses et liens sont masqués : les échanges restent sur Le Beau Défaut, c'est ce qui vous protège en cas de litige.";
