"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    setDark(isDark);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  };

  if (!mounted) return <div className="h-10 w-10 rounded-full opacity-0" aria-hidden="true" />;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="btn btn-ghost !px-2.5"
      aria-label={dark ? "Passer en mode clair" : "Passer en mode sombre"}
      title={dark ? "Passer en mode clair" : "Passer en mode sombre"}
    >
      <Icon name={dark ? "sun" : "moon"} size={18} />
    </button>
  );
}
