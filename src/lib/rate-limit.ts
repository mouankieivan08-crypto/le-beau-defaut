import { headers } from "next/headers";
import { prisma } from "./prisma";

/**
 * Freinage des essais répétés.
 *
 * Une place de marché où l'on peut essayer mille mots de passe à la suite n'est pas
 * une place de marché sérieuse. On garde une trace des tentatives, et au-delà d'un
 * seuil on refuse pendant quelques minutes — sans jamais dire si le compte existe.
 */

/** Adresse du visiteur telle que la transmet Vercel. */
export async function clientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip");
}

export type Limit = { blocked: boolean; retryInMinutes: number };

const ALLOWED = { CONNEXION: 8, INSCRIPTION: 5 } as const;
const WINDOW_MINUTES = { CONNEXION: 15, INSCRIPTION: 60 } as const;

/** Trop d'essais récents pour cet e-mail ou cette adresse ? */
export async function checkAuthLimit(kind: "CONNEXION" | "INSCRIPTION", email?: string): Promise<Limit> {
  const since = new Date(Date.now() - WINDOW_MINUTES[kind] * 60 * 1000);
  const ip = await clientIp();

  const or: { email?: string; ip?: string }[] = [];
  if (email) or.push({ email });
  if (ip) or.push({ ip });
  if (or.length === 0) return { blocked: false, retryInMinutes: 0 };

  const count = await prisma.authAttempt.count({
    where: { kind, success: false, createdAt: { gte: since }, OR: or },
  });

  return { blocked: count >= ALLOWED[kind], retryInMinutes: WINDOW_MINUTES[kind] };
}

/** Enregistre une tentative. Un échec compte, un succès efface l'ardoise. */
export async function recordAuthAttempt(
  kind: "CONNEXION" | "INSCRIPTION",
  success: boolean,
  email?: string
): Promise<void> {
  const ip = await clientIp();
  try {
    if (success) {
      if (email) await prisma.authAttempt.deleteMany({ where: { kind, email } });
      return;
    }
    await prisma.authAttempt.create({ data: { kind, email: email ?? null, ip, success: false } });

    // Ménage occasionnel : ces lignes n'ont aucune valeur passé 24 h.
    if (Math.random() < 0.05) {
      await prisma.authAttempt.deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      });
    }
  } catch {
    // Le freinage ne doit jamais empêcher quelqu'un de se connecter.
  }
}

/** Mots de passe trop courants pour protéger quoi que ce soit. */
const TROP_FAIBLES = [
  "12345678",
  "123456789",
  "1234567890",
  "azertyuiop",
  "qwertyuiop",
  "motdepasse",
  "password",
  "password1",
  "abcdefgh",
  "00000000",
  "11111111",
  "lebeaudefaut",
];

/** Renvoie un message si le mot de passe ne tient pas debout, sinon null. */
export function passwordProblem(password: string, personal: string[] = []): string | null {
  const p = password.trim();
  if (p.length < 8) return "Le mot de passe doit faire au moins 8 caractères.";
  if (/^\d+$/.test(p)) return "Un mot de passe uniquement composé de chiffres se devine trop vite.";
  if (TROP_FAIBLES.includes(p.toLowerCase())) return "Ce mot de passe est trop courant. Choisissez-en un autre.";
  const lower = p.toLowerCase();
  for (const mot of personal) {
    if (mot && mot.length >= 3 && lower.includes(mot.toLowerCase())) {
      return "Évitez votre nom ou votre e-mail dans le mot de passe.";
    }
  }
  return null;
}

/** Numéro congolais ramené à ses chiffres : 06 123 45 67 et +242 06 123 45 67 sont le même. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  const sansIndicatif = digits.startsWith("242") ? digits.slice(3) : digits;
  return sansIndicatif.startsWith("0") ? sansIndicatif : `0${sansIndicatif}`;
}
