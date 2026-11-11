import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireClientSpace } from "@/lib/auth";
import { contactSupportAction } from "@/lib/actions/shop";
import { SUPPORT_TOPICS, SUPPORT_WHATSAPP } from "@/lib/constants";
import { phoneFR, waLink } from "@/lib/format";
import { AccountLayout } from "@/components/AccountNav";
import ActionForm from "@/components/ActionForm";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "Contacter le service client" };

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ commande?: string; sujet?: string }> }) {
  const { commande = "", sujet = "" } = await searchParams;
  const user = await requireClientSpace("/messages/support", "/admin/support");

  const orders = await prisma.order.findMany({
    where: { buyerId: user.id },
    select: { reference: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const wa = waLink(SUPPORT_WHATSAPP, "Bonjour Le Beau Défaut, j'ai besoin d'aide.");

  return (
    <AccountLayout active="/messages" user={user}>
      <Link href="/messages" className="btn btn-ghost btn-sm mb-3 -ml-2">
        <Icon name="arrow-left" size={14} /> Messages
      </Link>
      <h1 className="font-display text-[28px] font-bold mb-1">Contacter le service client</h1>
      <p className="text-sm text-[var(--color-ink-muted)] mb-5">
        Une question sur une commande, un paiement ou une livraison ? Écrivez-nous ici : l&apos;équipe vous répond dans
        vos messages et vous recevez une notification.
      </p>

      <ActionForm action={contactSupportAction} submitLabel="Envoyer ma demande" pendingLabel="Envoi…" className="surface p-5">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="topic">
                Sujet
              </label>
              <select id="topic" name="topic" defaultValue={sujet || "COMMANDE"} className="field">
                {SUPPORT_TOPICS.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="orderRef">
                Commande concernée (facultatif)
              </label>
              <select id="orderRef" name="orderRef" defaultValue={commande} className="field">
                <option value="">— Aucune —</option>
                {orders.map((o) => (
                  <option key={o.reference} value={o.reference}>
                    {o.reference}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="body">
              Votre message
            </label>
            <textarea id="body" name="body" rows={6} required minLength={5} className="field" placeholder="Bonjour, …" />
          </div>
        </div>
      </ActionForm>

      {wa && (
        <p className="text-sm text-[var(--color-ink-muted)] mt-5 flex items-center gap-2 flex-wrap">
          <Icon name="phone" size={14} /> Urgent ? Écrivez-nous aussi sur WhatsApp au{" "}
          <a href={wa} target="_blank" rel="noreferrer" className="underline font-semibold text-[var(--color-ink)]">
            {phoneFR(SUPPORT_WHATSAPP)}
          </a>
        </p>
      )}
    </AccountLayout>
  );
}
