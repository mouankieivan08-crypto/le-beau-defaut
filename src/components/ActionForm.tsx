"use client";

import { useEffect, useRef } from "react";
import { useStickyAction } from "@/lib/use-sticky-action";
import { Alert } from "./ui";

type State = { error?: string; success?: string } | undefined;

/**
 * Formulaire relié à une action serveur qui renvoie { error } ou { success }.
 * Les champs sont passés en enfants depuis un composant serveur.
 */
export default function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Enregistrement…",
  className = "",
  resetOnSuccess = false,
  submitClassName = "btn btn-primary",
}: {
  action: (prev: State, formData: FormData) => Promise<State>;
  children: React.ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  className?: string;
  resetOnSuccess?: boolean;
  submitClassName?: string;
}) {
  const [state, onSubmit, pending] = useStickyAction(action, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state?.success) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form ref={ref} onSubmit={onSubmit} className={className}>
      {state?.error && (
        <div className="mb-3">
          <Alert tone="danger">{state.error}</Alert>
        </div>
      )}
      {state?.success && (
        <div className="mb-3">
          <Alert tone="success">{state.success}</Alert>
        </div>
      )}
      {children}
      <div className="mt-4">
        <button className={submitClassName} disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
