/**
 * Change le mot de passe d'un compte directement dans la base (dépannage, ex. compte admin).
 *
 *   npx tsx scripts/changer-mot-de-passe.mts
 *
 * Demande l'adresse de la base (DATABASE_URL, ou le lien Supabase), l'e-mail du compte et le
 * nouveau mot de passe. Rien n'est enregistré sur le disque.
 */
import { createInterface } from "node:readline";
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

const url =
  process.env.DATABASE_URL ||
  (await ask("Lien de la base (Supabase → Connect → URI, commence par postgresql://) : ", true));
const email = ((await ask("E-mail du compte [lebeaudefaut@gmail.com] : ")) || "lebeaudefaut@gmail.com").toLowerCase();
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
