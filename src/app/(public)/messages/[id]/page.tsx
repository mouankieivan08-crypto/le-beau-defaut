import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireClientSpace } from "@/lib/auth";
import { dateTimeFR, money } from "@/lib/format";
import { sendMessageAction } from "@/lib/actions/shop";
import { AccountLayout } from "@/components/AccountNav";
import Icon from "@/components/Icon";
import { GradeBadge } from "@/components/ui";
import { threadKind } from "@/lib/constants";

export const metadata: Metadata = { title: "Conversation" };

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireClientSpace(`/messages/${id}`, `/admin/support/${id}`);

  const thread = await prisma.thread.findUnique({
    where: { id },
    include: {
      product: {
        select: { title: true, slug: true, price: true, defectGrade: true, images: { where: { isCover: true }, take: 1 } },
      },
      members: {
        include: { user: { select: { id: true, firstName: true, lastName: true, seller: { select: { shopName: true } } } } },
      },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!thread || !thread.members.some((m) => m.userId === user.id)) notFound();

  await prisma.threadMember.updateMany({
    where: { threadId: id, userId: user.id },
    data: { lastReadAt: new Date() },
  });

  const other = thread.members.find((m) => m.userId !== user.id)?.user;
  const otherName =
    threadKind(thread.subject) !== "QUESTION"
      ? "Service client Le Beau Défaut"
      : other?.seller?.shopName ?? `${other?.firstName ?? ""} ${other?.lastName ?? ""}`;

  return (
    <AccountLayout active="/messages" user={user}>
      <Link href="/messages" className="btn btn-ghost btn-sm mb-3 -ml-2">
        <Icon name="arrow-left" size={14} /> Toutes les conversations
      </Link>

      <div className="surface overflow-hidden flex flex-col" style={{ minHeight: "60vh" }}>
        <header className="flex items-center gap-3 p-4 border-b border-[var(--color-sand)]">
          {thread.product?.images[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thread.product.images[0].url} alt="" className="h-12 w-12 rounded-lg object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm">{otherName}</p>
            {thread.product ? (
              <Link
                href={`/produit/${thread.product.slug}`}
                className="text-xs text-[var(--color-gold-dark)] hover:underline flex items-center gap-1.5 truncate"
              >
                <GradeBadge grade={thread.product.defectGrade} size="sm" />
                {thread.product.title} · {money(thread.product.price)}
              </Link>
            ) : (
              <p className="text-xs text-[var(--color-ink-muted)]">{thread.subject}</p>
            )}
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 flex flex-col gap-3 bg-[var(--color-cream)]/50">
          <p className="mx-auto max-w-md text-center text-[11px] text-[var(--color-ink-muted)] bg-[var(--color-linen)] border border-[var(--color-sand)] rounded-xl px-3 py-2">
            <Icon name="shield" size={12} className="inline align-[-2px] mr-1 text-[var(--color-gold-dark)]" />
            Les numéros, adresses et liens sont masqués. Restez ici : c&apos;est ce qui vous permet d&apos;être
            remboursé si l&apos;article ne correspond pas.
          </p>

          {thread.messages.map((m) => {
            const mine = m.senderId === user.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    mine
                      ? "bg-[var(--color-ink)] text-[var(--color-cream)] rounded-br-md"
                      : "bg-[var(--color-linen)] border border-[var(--color-sand)] rounded-bl-md"
                  }`}
                >
                  <p className="text-sm whitespace-pre-line leading-relaxed">{m.body}</p>
                  {m.wasFiltered && (
                    <p className={`text-[10px] mt-1 flex items-center gap-1 ${mine ? "text-[var(--color-cream)]/70" : "text-[var(--color-gold-dark)]"}`}>
                      <Icon name="shield" size={10} /> Coordonnées retirées par Le Beau Défaut
                    </p>
                  )}
                  <p className={`text-[10px] mt-1 ${mine ? "text-[var(--color-cream)]/55" : "text-[var(--color-ink-muted)]"}`}>
                    {dateTimeFR(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <form action={sendMessageAction} className="p-3 border-t border-[var(--color-sand)] flex gap-2 items-end">
          <input type="hidden" name="threadId" value={thread.id} />
          <textarea
            name="body"
            rows={2}
            required
            placeholder="Votre message… (inutile de donner votre numéro, il sera masqué)"
            className="field resize-none"
            aria-label="Votre message"
          />
          <button className="btn btn-primary !px-4 !py-3" aria-label="Envoyer">
            <Icon name="arrow-right" size={17} />
          </button>
        </form>
      </div>
    </AccountLayout>
  );
}
