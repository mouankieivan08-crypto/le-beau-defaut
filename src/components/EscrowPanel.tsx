import { confirmReceptionAction } from "@/lib/actions/shop";
import { ESCROW_STATUS, ESCROW_RELEASE_DAYS } from "@/lib/constants";
import { escrowDueDate } from "@/lib/escrow";
import { money, dateFR } from "@/lib/format";
import Icon from "./Icon";
import { Badge } from "./ui";

/**
 * Le séquestre, vu par l'acheteur.
 *
 * Tant que l'argent est chez nous, il faut que l'acheteur le sache — c'est ce qui lui
 * donne le courage d'acheter à un inconnu. Et le jour où il confirme, il faut que ce
 * soit un geste simple, explicite, qui libère le vendeur.
 */
export default function EscrowPanel({
  order,
}: {
  order: {
    id: string;
    status: string;
    escrowStatus: string;
    escrowAmount: number;
    deliveredAt: Date | null;
    releasedAt: Date | null;
    buyerConfirmedAt: Date | null;
  };
}) {
  if (order.escrowStatus === "AUCUN" || order.escrowAmount === 0) return null;

  const state = ESCROW_STATUS[order.escrowStatus] ?? ESCROW_STATUS.SOUS_SEQUESTRE;
  const due = escrowDueDate(order.deliveredAt);
  const canConfirm = order.status === "LIVREE" && order.escrowStatus === "SOUS_SEQUESTRE";

  return (
    <section className="surface p-5 border-l-4 !border-l-[var(--color-gold)]">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h2 className="font-display text-base font-bold flex items-center gap-2">
          <Icon name="shield" size={16} className="text-[var(--color-gold-dark)]" />
          Votre argent est protégé
        </h2>
        <Badge tone={state.tone}>{state.label}</Badge>
      </div>

      <p className="text-sm text-[var(--color-ink-soft)] mb-3">{state.description}</p>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--color-ink-muted)] mb-4">
        <span>
          Somme conservée :{" "}
          <strong className="text-[var(--color-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>
            {money(order.escrowAmount)}
          </strong>
        </span>
        {order.escrowStatus === "SOUS_SEQUESTRE" && due && (
          <span>
            Versement automatique le <strong className="text-[var(--color-ink)]">{dateFR(due)}</strong>
          </span>
        )}
        {order.releasedAt && <span>Libéré le {dateFR(order.releasedAt)}</span>}
      </div>

      {canConfirm && (
        <form action={confirmReceptionAction} className="flex flex-col gap-2">
          <input type="hidden" name="orderId" value={order.id} />
          <button className="btn btn-gold w-full sm:w-auto">
            <Icon name="check-circle" size={15} /> J&apos;ai bien reçu, payez le vendeur
          </button>
          <p className="text-[11px] text-[var(--color-ink-muted)]">
            Sans confirmation de votre part, le vendeur sera payé automatiquement {ESCROW_RELEASE_DAYS} jours
            après la livraison. Un souci avec l&apos;article ? Ouvrez plutôt une réclamation ci-dessous :
            l&apos;argent reste bloqué le temps que nous tranchions.
          </p>
        </form>
      )}
    </section>
  );
}
