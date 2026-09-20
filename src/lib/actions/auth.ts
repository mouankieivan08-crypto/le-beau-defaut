"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, verifyPassword, getCurrentUser } from "@/lib/auth";
import { homeForRole, DEFAULT_COMMISSION_PCT } from "@/lib/constants";
import { slugify } from "@/lib/format";

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

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "E-mail ou mot de passe incorrect." };
  }
  if (!user.isActive) return { error: "Ce compte a été désactivé. Contactez l'assistance." };

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
    accountType: z.enum(["CLIENT", "VENDEUR"]),
    city: z.string().min(2),
    shopName: z.string().optional(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  })
  .refine((d) => d.accountType !== "VENDEUR" || (d.shopName && d.shopName.length >= 2), {
    message: "Le nom de la boutique est requis pour un compte vendeur",
    path: ["shopName"],
  });

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    firstName: String(formData.get("firstName") || "").trim(),
    lastName: String(formData.get("lastName") || "").trim(),
    email: String(formData.get("email") || "").trim().toLowerCase(),
    phone: String(formData.get("phone") || "").trim(),
    password: String(formData.get("password") || ""),
    confirm: String(formData.get("confirm") || ""),
    accountType: String(formData.get("accountType") || "CLIENT") as "CLIENT" | "VENDEUR",
    city: String(formData.get("city") || "Brazzaville"),
    shopName: String(formData.get("shopName") || "").trim(),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (await prisma.user.findUnique({ where: { email: d.email } })) {
    return { error: "Un compte existe déjà avec cette adresse e-mail." };
  }
  if (await prisma.user.findFirst({ where: { phone: d.phone } })) {
    return { error: "Ce numéro de téléphone est déjà utilisé." };
  }

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

  if (d.accountType === "VENDEUR") {
    let slug = slugify(d.shopName!);
    if (await prisma.sellerProfile.findUnique({ where: { shopSlug: slug } })) {
      slug = `${slug}-${user.id.slice(-5)}`;
    }
    await prisma.sellerProfile.create({
      data: {
        userId: user.id,
        shopName: d.shopName!,
        shopSlug: slug,
        contactPhone: d.phone,
        city: d.city,
        commissionPct: DEFAULT_COMMISSION_PCT,
        status: "EN_ATTENTE",
      },
    });
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEME",
        title: "Bienvenue chez Le Beau Défaut",
        body: "Votre boutique est en cours de validation. Vous pourrez publier dès qu'un administrateur l'aura activée.",
        link: "/vendeur",
      },
    });
  } else {
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEME",
        title: "Bienvenue chez Le Beau Défaut",
        body: "Découvrez le mobilier à petit défaut, les sacs de luxe et le fourre-tout.",
        link: "/catalogue",
      },
    });
  }

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

  await prisma.user.update({ where: { id: user.id }, data: parsed.data });
  revalidatePath("/", "layout");
  return { success: "Profil mis à jour." };
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
