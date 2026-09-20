import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { homeForRole } from "./constants";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "lbd-dev-secret-a-changer-absolument-en-production"
);
const COOKIE = "lbd_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

export type Session = {
  userId: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
};

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function createSession(session: Session) {
  const token = await new SignJWT(session as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(SECRET);

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Session courante, ou null. Ne redirige jamais. */
export async function getSession(): Promise<Session | null> {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

/** Utilisateur complet depuis la base (null si session invalide ou compte désactivé). */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { seller: true, courier: true },
  });
  if (!user || !user.isActive) return null;
  return user;
}

/** Exige une session ; sinon redirige vers la connexion. */
export async function requireUser(nextPath?: string) {
  const user = await getCurrentUser();
  if (!user) {
    const qs = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/connexion${qs}`);
  }
  return user;
}

/** Exige un des rôles listés ; sinon renvoie vers l'espace correspondant au rôle réel. */
export async function requireRole(roles: string[], nextPath?: string) {
  const user = await requireUser(nextPath);
  if (!roles.includes(user.role)) redirect(homeForRole(user.role));
  return user;
}

export async function requireAdmin(nextPath?: string) {
  return requireRole(["ADMIN"], nextPath);
}
