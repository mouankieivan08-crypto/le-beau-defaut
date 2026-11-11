/**
 * Change le mot de passe d'un compte directement dans la base (dépannage, ex. compte admin).
 *
 *   npx tsx scripts/changer-mot-de-passe.mts
 *
 * Récupère seul l'adresse de la base sur Vercel, puis demande le nouveau mot de passe
 * (compte lebeaudefaut@gmail.com, ou l'e-mail donné après la commande). Rien n'est enregistré sur le disque.
 */
import { createInterface } from "node:readline";
import { execSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // Masque la saisie : on n'affiche que des étoiles.
      const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
      out._writeToOutput = (s: string) => {
        if (s.includes(question)) process.stdout.write(s);
        else if (s === "\r\n" || s === "\n") process.stdout.write(s);
        else process.stdout.write("*");
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

const isPg = (u: string) => /^postgres(ql)?:\/\//.test(u);

/** Lit l'adresse de la base de production depuis Vercel (fichier temporaire, effacé aussitôt). */
function urlFromVercel(): string {
  const file = join(tmpdir(), `lbd-env-${process.pid}`);
  try {
    execSync(`vercel env pull "${file}" --environment=production --yes`, { stdio: "ignore" });
    const vars: Record<string, string> = {};
    for (const raw of readFileSync(file, "utf8").split("\n")) {
      const i = raw.indexOf("=");
      if (i < 1) continue;
      vars[raw.slice(0, i).trim()] = raw
        .slice(i + 1)
        .trim()
        .replace(/^["']|["']$/g, "")
        .replace(/\\n$/, "")
        .trim();
    }
    const keys = ["DIRECT_URL", "DATABASE_URL", "POSTGRES_URL_NON_POOLING", "POSTGRES_PRISMA_URL", "POSTGRES_URL"];
    for (const k of keys) if (vars[k] && isPg(vars[k])) return vars[k];
    // Rien d'utilisable : on dit seulement ce qu'on a trouvé, sans jamais afficher le secret.
    const seen = keys.filter((k) => k in vars).map((k) => `${k}=${vars[k] ? `${vars[k].split(":")[0]}:… (${vars[k].length} car.)` : "(vide)"}`);
    console.log(`Adresse de la base introuvable sur Vercel. Trouvé : ${seen.join(", ") || "aucune variable de base"}`);
    return "";
  } catch {
    console.log("Impossible de lire les réglages Vercel.");
    return "";
  } finally {
    rmSync(file, { force: true });
  }
}

const fromEnv = process.env.DATABASE_URL && isPg(process.env.DATABASE_URL) ? process.env.DATABASE_URL : "";
const url =
  fromEnv || urlFromVercel() || (await ask("Lien de la base (Supabase → Connect → URI, commence par postgresql://) : ", true));
if (!isPg(url)) throw new Error("Ce lien ne commence pas par postgresql:// — copiez l'URI depuis Supabase → Connect.");

// L'e-mail du compte : celui de l'admin, sauf s'il est donné en argument.
const email = (process.argv[2] || "lebeaudefaut@gmail.com").trim().toLowerCase();
console.log(`Compte : ${email}`);
const password = await ask("Nouveau mot de passe (8 caractères minimum) : ", true);
const confirm = await ask("Retapez le mot de passe : ", true);

if (password.length < 8) throw new Error("Mot de passe trop court (8 caractères minimum).");
if (password !== confirm) throw new Error("Les deux mots de passe ne correspondent pas.");

const prisma = new PrismaClient({ datasources: { db: { url } } });
try {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });
    console.error(`Aucun compte avec l'e-mail ${email}.`);
    console.error(`Comptes administrateurs existants : ${admins.map((a) => a.email).join(", ") || "aucun"}`);
    process.exit(1);
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 10), isActive: true },
  });
  console.log(`✓ Mot de passe changé pour ${email} (${user.role}). Vous pouvez vous connecter.`);
} finally {
  await prisma.$disconnect();
}
