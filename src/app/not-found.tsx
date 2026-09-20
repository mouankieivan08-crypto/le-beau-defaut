import Link from "next/link";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center px-4 py-16 bg-[var(--color-cream)]">
      <div className="text-center max-w-md">
        <Logo variant="mark" size={96} className="mx-auto" />
        <p className="font-display text-[80px] font-bold leading-none mt-4 text-gilded">404</p>
        <h1 className="font-display text-2xl font-bold mt-2">Cette page a un défaut… majeur</h1>
        <p className="text-[var(--color-ink-muted)] mt-2">
          Elle n&apos;existe pas, ou l&apos;article a déjà trouvé preneur. Les bonnes affaires partent vite ici.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-7">
          <Link href="/" className="btn btn-primary">
            Retour à l&apos;accueil
          </Link>
          <Link href="/catalogue" className="btn btn-outline">
            Voir le catalogue
          </Link>
        </div>
      </div>
    </main>
  );
}
