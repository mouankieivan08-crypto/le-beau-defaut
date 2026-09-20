"use client";

/**
 * Allège une photo dans le navigateur avant de l'envoyer.
 *
 * Deux raisons : les photos de téléphone pèsent 3 à 6 Mo alors qu'une requête
 * Vercel est plafonnée à 4,5 Mo, et la connexion mobile congolaise est lente.
 * En cas de doute (format exotique, navigateur ancien), on renvoie le fichier d'origine.
 */
const MAX_SIDE = 1600;
const QUALITY = 0.82;
const SKIP_UNDER = 500 * 1024; // en dessous de 500 Ko, on ne touche à rien

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;
  if (file.size <= SKIP_UNDER) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
