"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Fine barre dorée en haut de l'écran pendant le chargement d'une page.
 *
 * Sans elle, sur un réseau mobile lent, un clic sur un article ne montre rien pendant
 * plusieurs secondes : on croit que le lien ne marche pas et on reclique.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [progress, setProgress] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // La nouvelle page est affichée : on termine la barre puis on la retire.
  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setProgress((p) => (p === null ? null : 100));
    const t = setTimeout(() => setProgress(null), 250);
    return () => clearTimeout(t);
  }, [pathname, search]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      // Démarre vite, puis ralentit sans jamais atteindre la fin tant que la page n'est pas là.
      setProgress(12);
      if (timer.current) clearInterval(timer.current);
      timer.current = setInterval(() => {
        setProgress((p) => (p === null ? null : Math.min(90, p + (90 - p) * 0.12)));
      }, 200);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  if (progress === null) return null;

  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-[100] h-[3px] pointer-events-none">
      <div
        className="h-full transition-[width] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, #A97F22, #D8B24A, #F2E0A6)",
          boxShadow: "0 0 8px rgba(201,162,39,0.6)",
        }}
      />
    </div>
  );
}
