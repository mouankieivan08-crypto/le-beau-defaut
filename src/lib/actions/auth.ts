"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
  getCurrentUser,
  requireAdmin,
} from "@/lib/auth";
import { homeForRole, DEFAULT_COMMISSION_PCT } from "@/lib/constants";
import { slugify } from "@/lib/format";
import { checkAuthLimit, recordAuthAttempt, passwordProblem, normalizePhone } from "@/lib/rate-limit";

export type FormState = { error?: string; success?: string } | undefined;

const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") || "").trim().toLowerCase(),
    password: String(formData.get("password") || ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const limite = await checkAuthLimit("CONNEXION", parsed.data.email);
  if (limite.blocked) {
    return {
      error: `Trop de tentatives. Réessayez dans ${limite.retryInMinutes} minutes, ou faites réinitialiser votre mot de passe par l'équipe.`,
    };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Sur un e-mail inconnu, on compare quand même contre une empreinte factice :
  // sans cela, la rapidité de la réponse dirait à un curieux quels comptes existent.
  const hash = user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidiu";
  const motDePasseOk = await verifyPassword(parsed.data.password, hash);

  if (!user || !motDePasseOk) {
    await recordAuthAttempt("CONNEXION", false, parsed.data.email);
    return { error: "E-mail ou mot de passe incorrect." };
  }
  if (!user.isActive) return { error: "Ce compte a été désactivé. Contactez l'assistance." };

  await recordAuthAttempt("CONNEXION", true, parsed.data.email);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  });

  const next = String(formData.get("next") || "");
  redirect(next && next.startsWith("/") ? next : homeForRole(user.role));
}

const registerSchema = z
  .object({
    firstName: z.string().min(2, "Prénom trop court"),
    lastName: z.string().min(2, "Nom trop court"),
    email: z.string().email("Adresse e-mail invalide"),
    phone: z.string().min(9, "Numéro de téléphone invalide").max(20),
    password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères"),
    confirm: z.string(),
    accountType: z.enum(["CLIENT"]),
    city: z.string().min(2),
    shopName: z.string().optional(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  })
  .refine((d) => d.accountType === "CLIENT", {
    message: "Seuls les comptes clients sont autorisés pour l'inscription publique.",
    path: ["accountType"],
  });

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    firstName: String(formData.get("firstName") || "").trim(),
    lastName: String(formData.get("lastName") || "").trim(),
    email: String(formData.get("email") || "").trim().toLowerCase(),
    phone: String(formData.get("phone") || "").trim(),
    password: String(formData.get("password") || ""),
    confirm: String(formData.get("confirm") || ""),
    accountType: "CLIENT" as const,
    city: String(formData.get("city") || "Brazzaville"),
    shopName: String(formData.get("shopName") || "").trim(),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = { ...parsed.data, phone: normalizePhone(parsed.data.phone) };

  const limite = await checkAuthLimit("INSCRIPTION");
  if (limite.blocked) {
    return { error: "Trop de comptes créés depuis cet appareil. Réessayez dans une heure." };
  }

  const faiblesse = passwordProblem(d.password, [d.firstName, d.lastName, d.email.split("@")[0]]);
  if (faiblesse) return { error: faiblesse };

  if (await prisma.user.findUnique({ where: { email: d.email } })) {
    return { error: "Un compte existe déjà avec cette adresse e-mail." };
  }
  if (await prisma.user.findFirst({ where: { phone: d.phone } })) {
    return { error: "Ce numéro de téléphone est déjà utilisé." };
  }
  await recordAuthAttempt("INSCRIPTION", false);

  const user = await prisma.user.create({
    data: {
      email: d.email,
      phone: d.phone,
      passwordHash: await hashPassword(d.password),
      firstName: d.firstName,
      lastName: d.lastName,
      role: d.accountType,
      city: d.city,
    },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "SYSTEME",
      title: "Bienvenue chez Le Beau Défaut",
      body: "Découvrez le mobilier à petit défaut, sélectionné et présenté avec transparence.",
      link: "/catalogue",
    },
  });

  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  });

  redirect(homeForRole(user.role));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

const profileSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(9),
  city: z.string().min(2),
  quartier: z.string().optional(),
});

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expirée." };

  const parsed = profileSchema.safeParse({
    firstName: String(formData.get("firstName") || "").trim(),
    lastName: String(formData.get("lastName") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    city: String(formData.get("city") || ""),
    quartier: String(formData.get("quartier") || ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const dup = await prisma.user.findFirst({
    where: { phone: parsed.data.phone, NOT: { id: user.id } },
  });
  if (dup) return { error: "Ce numéro est déjà utilisé par un autre compte." };

  // Changement d'adresse e-mail (= identifiant de connexion) : mot de passe exigé.
  const email = String(formData.get("email") || user.email).trim().toLowerCase();
  const emailChanged = email !== user.email.trim().toLowerCase();
  if (emailChanged) {
    if (!z.string().email().safeParse(email).success) return { error: "Adresse e-mail invalide." };
    const current = String(formData.get("currentPassword") || "");
    if (!current || !(await verifyPassword(current, user.passwordHash))) {
      return {
        error: current
          ? `Mot de passe incorrect pour le compte ${user.email}. Vous êtes connecté avec ce compte : tapez son mot de passe, ou déconnectez-vous et connectez-vous avec l'autre adresse.`
          : `Vous êtes connecté avec ${user.email}. Pour remplacer cette adresse, tapez votre mot de passe actuel dans la case prévue.`,
      };
    }
    if (await prisma.user.findFirst({ where: { email, NOT: { id: user.id } } })) {
      return { error: "Cette adresse e-mail est déjà utilisée par un autre compte." };
    }
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data: { ...parsed.data, email } });
  if (emailChanged) {
    await createSession({
      userId: updated.id,
      email: updated.email,
      role: updated.role,
      firstName: updated.firstName,
      lastName: updated.lastName,
    });
  }
  revalidatePath("/", "layout");
  return { success: emailChanged ? `Profil mis à jour. Connectez-vous désormais avec ${email}.` : "Profil mis à jour." };
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expirée." };

  const current = String(formData.get("current") || "");
  const next = String(formData.get("next") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!(await verifyPassword(current, user.passwordHash))) return { error: "Mot de passe actuel incorrect." };
  if (next.length < 8) return { error: "Le nouveau mot de passe doit faire au moins 8 caractères." };
  if (next !== confirm) return { error: "Les mots de passe ne correspondent pas." };

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } });
  return { success: "Mot de passe modifié." };
}

/* ---------------------------- Mot de passe oublié ---------------------------- */

/**
 * Demande de réinitialisation.
 *
 * Aucun e-mail ne part du site pour l'instant : on enregistre la demande, on prévient
 * l'équipe, et le lien est transmis à son propriétaire après vérification — jamais
 * affiché à celui qui remplit le formulaire, sinon n'importe qui prendrait n'importe
 * quel compte. La réponse est volontairement identique que le compte existe ou non.
 */
export async function requestPasswordResetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return { error: "Indiquez l'adresse e-mail de votre compte." };

  const limite = await checkAuthLimit("CONNEXION", email);
  if (limite.blocked) {
    return { error: `Trop de demandes. Réessayez dans ${limite.retryInMinutes} minutes.` };
  }

  const confirmation =
    "Demande enregistrée. Notre équipe vérifie qu'il s'agit bien de vous, puis vous envoie un lien de réinitialisation sur WhatsApp.";

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, firstName: true, lastName: true } });
  if (!user) {
    await recordAuthAttempt("CONNEXION", false, email);
    return { success: confirmation };
  }

  // Une demande à la fois : les anciennes sont invalidées.
  await prisma.passwordReset.deleteMany({ where: { userId: user.id, usedAt: null } });

  const token = randomBytes(32).toString("base64url");
  await prisma.passwordReset.create({
    data: { userId: user.id, token, expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) },
  });

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      type: "SYSTEME",
      title: "Mot de passe oublié",
      body: `${user.firstName} ${user.lastName} (${email}) demande un nouveau mot de passe.`,
      link: "/admin/reinitialisations",
    })),
  });

  revalidatePath("/", "layout");
  return { success: confirmation };
}

/** Application du nouveau mot de passe depuis le lien reçu. */
export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (password !== confirm) return { error: "Les deux mots de passe ne correspondent pas." };

  const demande = await prisma.passwordReset.findUnique({
    where: { token },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
  });
  if (!demande || demande.usedAt || demande.expiresAt < new Date()) {
    return { error: "Ce lien n'est plus valable. Demandez-en un nouveau." };
  }

  const faiblesse = passwordProblem(password, [
    demande.user.firstName,
    demande.user.lastName,
    demande.user.email.split("@")[0],
  ]);
  if (faiblesse) return { error: faiblesse };

  await prisma.$transaction([
    prisma.user.update({ where: { id: demande.userId }, data: { passwordHash: await hashPassword(password) } }),
    prisma.passwordReset.update({ where: { id: demande.id }, data: { usedAt: new Date() } }),
    prisma.authAttempt.deleteMany({ where: { email: demande.user.email } }),
    prisma.auditLog.create({
      data: {
        actorId: demande.userId,
        action: "MOT_DE_PASSE_REINITIALISE",
        entity: "User",
        entityId: demande.userId,
        details: "Réinitialisation par lien",
      },
    }),
    prisma.notification.create({
      data: {
        userId: demande.userId,
        type: "SYSTEME",
        title: "Mot de passe modifié",
        body: "Votre mot de passe vient d'être changé. Si ce n'est pas vous, écrivez-nous immédiatement.",
        link: "/compte/profil",
      },
    }),
  ]);

  return { success: "Mot de passe enregistré. Vous pouvez vous connecter." };
}

/** Côté équipe : marquer qu'un lien a bien été transmis à son propriétaire. */
export async function markResetSentAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("resetId") || "");
  if (!id) return;
  await prisma.passwordReset.update({ where: { id }, data: { sentAt: new Date() } });
  revalidatePath("/admin/reinitialisations");
}
