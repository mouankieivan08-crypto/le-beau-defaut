import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { money, dateTimeFR, phoneFR, relativeFR, waLink } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/constants";
import { confirmDepositAction, rejectDepositAction } from "@/lib/actions/admin";
import Icon from "@/components/Icon";
import { Badge, PageHeader, EmptyState, Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Paiements à vérifier" };

/**
 * Les dépôts Mobile Money en attente de confirmation.
 *
 * L'acheteur dépose sa capture sur sa commande et/ou l'envoie sur WhatsApp. L'équipe
 * compare avec le relevé du compte Mobile Money, puis confirme : la commande passe en
 * « payée » et part en préparation. Rien n'est jamais confirmé automatiquement.
 */
export default async function PaymentChecksPage() {
  await requireAdmin("/admin/verifications");

  const orders = await prisma.order.findMany({
    where: { status: "EN_ATTENTE_PAIEMENT", paymentStatus: "EN_ATTENTE" },
    include: {
      buyer: { select: { firstName: true, lastName: true, email: true, phone: true } },
      items: { select: { titleSnapshot: true, quantity: true, imageSnapshot: true } },
    },
    // Les commandes avec une preuve d'abord, les plus anciennes en premier.
    orderBy: [{ paymentDeclaredAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
    take: 100,
  });

  const withProof = orders.filter((o) => o.paymentDeclaredAt);
  const waiting = orders.filter((o) => !o.paymentDeclaredAt);

  return (
    <>
      <PageHeader
        title="Paiements à vérifier"
        subtitle="Comparez la preuve avec le relevé Mobile Money, puis confirmez : la commande part aussitôt en préparation."
      />

      <div className="mb-5">
        <Alert tone="info" title="Avant de confirmer">
          Vérifiez sur le téléphone MTN ou Airtel que le dépôt est bien arrivé, au bon montant. Une capture peut être
          retouchée : seul le relevé du compte fait foi.
        </Alert>
      </div>

      <h2 className="font-display text-lg font-bold mb-3">
        Preuves reçues <span className="text-[var(--color-ink-muted)] font-sans text-sm">({withProof.length})</span>
      </h2>
      {withProof.length === 0 ? (
        <EmptyState icon="check-circle" title="Aucune preuve en attente" message="Toutes les preuves reçues ont été traitées." />
      ) : (
        <div className="flex flex-col gap-4 mb-8">
          {withProof.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      )}

      {waiting.length > 0 && (
        <>
          <h2 className="font-display text-lg font-bold mb-1 mt-2">
            Sans preuve pour l&apos;instant{" "}
            <span className="text-[var(--color-ink-muted)] font-sans text-sm">({waiting.length})</span>
          </h2>
          <p className="text-xs text-[var(--color-ink-muted)] mb-3">
            Commandes passées, dépôt pas encore signalé. Si l&apos;acheteur vous a envoyé la preuve sur WhatsApp, vous
            pouvez confirmer d&apos;ici.
          </p>
          <div className="flex flex-col gap-4">
            {waiting.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

type Row = Awaited<ReturnType<typeof prisma.order.findMany>>[number] & {
  buyer: { firstName: string; lastName: string; email: string; phone: string | null };
  items: { titleSnapshot: string; quantity: number; imageSnapshot: string | null }[];
};

function OrderCard({ order: o }: { order: Row }) {
  const whatsapp = waLink(
    o.recipientPhone || o.buyer.phone,
    `Bonjour ${o.buyer.firstName}, c'est Le Beau Défaut au sujet de votre commande ${o.reference} (${money(o.total)}).`
  );

  return (
    <div className="surface p-4">
      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
        {/* La preuve */}
        <div>
          {o.paymentProofUrl ? (
            <a href={o.paymentProofUrl} target="_blank" rel="noreferrer" className="block group" title="Ouvrir la capture en grand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={o.paymentProofUrl}
                alt={`Preuve de paiement ${o.reference}`}
                className="w-full max-h-64 object-contain rounded-xl border border-[var(--color-sand)] bg-[var(--color-cream-deep)] group-hover:opacity-90"
              />
              <span className="text-[11px] text-[var(--color-ink-muted)] underline">Agrandir la capture</span>
            </a>
          ) : (
            <div className="h-32 rounded-xl border border-dashed border-[var(--color-sand)] grid place-items-center text-xs text-[var(--color-ink-muted)] text-center p-3">
              {o.paymentDeclaredAt ? "Numéro de transaction seulement" : "Pas de capture sur le site — voir WhatsApp"}
            </div>
          )}
        </div>

        {/* La commande */}
        <div className="min-w-0 flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <Link href={`/admin/commandes/${o.id}`} className="font-mono text-sm font-semibold hover:text-[var(--color-gold-dark)]">
                {o.reference}
              </Link>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Commandée {relativeFR(o.createdAt)} · {paymentMethodLabel(o.paymentMethod)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-xl font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>
                {money(o.total)}
              </p>
              {o.paymentDeclaredAt ? (
                <Badge tone="info">Preuve reçue {relativeFR(o.paymentDeclaredAt)}</Badge>
              ) : (
                <Badge tone="warning">En attente du dépôt</Badge>
              )}
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)]">Acheteur</dt>
              <dd>
                {o.buyer.firstName} {o.buyer.lastName}
                <span className="block text-xs text-[var(--color-ink-muted)]">
                  {phoneFR(o.recipientPhone || o.buyer.phone)} · {o.buyer.email}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)]">Transaction indiquée</dt>
              <dd className="font-mono">{o.paymentRef ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)]">Articles</dt>
              <dd className="text-xs">{o.items.map((i) => `${i.quantity}× ${i.titleSnapshot}`).join(" · ")}</dd>
            </div>
            {o.paymentDeclaredAt && (
              <div className="sm:col-span-2 text-[11px] text-[var(--color-ink-muted)]">Preuve envoyée le {dateTimeFR(o.paymentDeclaredAt)}</div>
            )}
          </dl>

          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--color-sand)]">
            <form action={confirmDepositAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="orderId" value={o.id} />
              <input name="transaction" defaultValue={o.paymentRef ?? ""} placeholder="N° de transaction" className="field !py-1.5 !w-44 text-xs" />
              <button className="btn btn-sm !bg-[var(--color-grade-a)] !text-white">
                <Icon name="check" size={14} /> Paiement reçu — confirmer
              </button>
            </form>
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                <Icon name="phone" size={14} /> WhatsApp de l&apos;acheteur
              </a>
            )}
            <details className="w-full sm:w-auto">
              <summary className="btn btn-ghost btn-sm cursor-pointer list-none text-[var(--color-danger)]">Refuser la preuve</summary>
              <form action={rejectDepositAction} className="flex flex-wrap items-center gap-2 mt-2">
                <input type="hidden" name="orderId" value={o.id} />
                <input name="reason" placeholder="Motif : montant différent, dépôt introuvable…" className="field !py-1.5 text-xs flex-1 min-w-[220px]" />
                <button className="btn btn-sm btn-outline !text-[var(--color-danger)]">Confirmer le refus</button>
              </form>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
