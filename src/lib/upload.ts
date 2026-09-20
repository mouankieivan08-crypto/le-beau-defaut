import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_BYTES = 4 * 1024 * 1024; // 4 Mo (plafond d une requete Vercel)
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

// Stockage distant (Supabase Storage). Si ces variables sont absentes,
// on retombe sur le disque local : pratique en développement.
const REMOTE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const REMOTE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || "photos";

export const remoteStorageEnabled = Boolean(REMOTE_URL && REMOTE_KEY);

/** Envoie le fichier vers Supabase Storage et renvoie son URL publique. */
async function uploadToSupabase(name: string, buffer: Buffer, type: string): Promise<string | null> {
  const res = await fetch(`${REMOTE_URL}/storage/v1/object/${BUCKET}/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REMOTE_KEY}`,
      "Content-Type": type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "x-upsert": "true",
    },
    body: new Uint8Array(buffer),
  });
  if (!res.ok) {
    console.error("Supabase Storage:", res.status, await res.text().catch(() => ""));
    return null;
  }
  return `${REMOTE_URL}/storage/v1/object/public/${BUCKET}/${name}`;
}

/**
 * Enregistre une image et renvoie son URL publique.
 * Renvoie null si le fichier est vide, trop lourd ou d'un type non autorisé.
 */
export async function saveImage(file: File | null): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  if (file.size > MAX_BYTES) return null;
  if (!ALLOWED.includes(file.type)) return null;

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (remoteStorageEnabled) return uploadToSupabase(name, buffer, file.type);

  // Repli disque : valable en développement seulement. En hébergement serverless
  // le disque est en lecture seule — on renvoie null plutôt que de casser le formulaire.
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(join(UPLOAD_DIR, name), buffer);
    return `/uploads/${name}`;
  } catch (err) {
    console.error(
      "Écriture de la photo impossible. Définissez SUPABASE_URL et SUPABASE_SERVICE_KEY pour stocker les photos sur Supabase.",
      err
    );
    return null;
  }
}

/** Récupère toutes les images d'un champ multiple d'un formulaire. */
export async function saveImages(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const f of files) {
    const url = await saveImage(f);
    if (url) urls.push(url);
  }
  return urls;
}

/** Accepte soit un fichier téléversé, soit une URL collée. */
export async function resolveImage(file: File | null, url: string): Promise<string | null> {
  const saved = await saveImage(file);
  if (saved) return saved;
  const trimmed = (url || "").trim();
  if (/^https?:\/\/.+/i.test(trimmed) || trimmed.startsWith("/")) return trimmed;
  return null;
}
