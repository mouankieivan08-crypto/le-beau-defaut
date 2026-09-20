"use client";

import { useStickyAction } from "@/lib/use-sticky-action";
import { resetUserPasswordAction } from "@/lib/actions/admin";
import Icon from "./Icon";

/** Dépannage : donne un mot de passe provisoire à dicter au téléphone. */
export default function ResetPassword({ userId, name }: { userId: string; name: string }) {
  const [state, onSubmit, pending] = useStickyAction(resetUserPasswordAction, undefined);

  if (state?.success) {
    const temp = state.success.split(": ").pop();
    return (
      <span className="inline-flex items-center gap-1.5 chip bg-[var(--color-grade-a-bg)] text-[var(--color-grade-a)]">
        <Icon name="check" size={11} />
        <code className="font-mono font-bold select-all">{temp}</code>
      </span>
    );
  }

  return (
    <form onSubmit={onSubmit} className="inline">
      <input type="hidden" name="userId" value={userId} />
      <button
        className="btn btn-ghost btn-sm !px-2"
        disabled={pending}
        title={`Réinitialiser le mot de passe de ${name}`}
        aria-label={`Réinitialiser le mot de passe de ${name}`}
      >
        <Icon name="refresh" size={13} />
      </button>
      {state?.error && <span className="text-[11px] text-[var(--color-danger)] ml-1">{state.error}</span>}
    </form>
  );
}
