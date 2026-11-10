import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { relativeFR } from "@/lib/format";
import { AccountLayout } from "@/components/AccountNav";
import { Avatar, EmptyState } from "@/components/ui";
import Icon from "@/components/Icon";
import { threadKind } from "@/lib/constants";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await requireUser("/messages");

  const memberships = await prisma.threadMember.findMany({
    where: { userId: user.id },
    include: {
      thread: {
        include: {
          product: { select: { title: true, images: { where: { isCover: true }, take: 1 } } },
          members: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, seller: { select: { shopName: true } } } },
            },
          },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { thread: { updatedAt: "desc" } },
  });

  return (
    <AccountLayout active="/messages" user={user}>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <h1 className="font-display text-[28px] font-bold">Messages</h1>
        <Link href="/messages/support" className="btn btn-gold btn-sm">
          <Icon name="message" size={14} /> Contacter le service client
        </Link>
      </div>

      {memberships.length === 0 ? (
        <EmptyState
          icon="message"
          title="Aucune conversation"
          message="Une question sur un défaut ? Utilisez le bouton « Poser une question » sur la fiche de l'article."
        />
      ) : (
        <ul className="surface divide-y divide-[var(--color-sand)] overflow-hidden">
          {memberships.map(({ thread, lastReadAt }) => {
            const other = thread.members.find((m) => m.userId !== user.id)?.user;
            const last = thread.messages[0];
            const unread = last && last.senderId !== user.id && (!lastReadAt || last.createdAt > lastReadAt);
            const name =
              threadKind(thread.subject) !== "QUESTION"
                ? "Service client Le Beau Défaut"
                : other?.seller?.shopName ?? `${other?.firstName ?? ""} ${other?.lastName ?? ""}`;
            return (
              <li key={thread.id}>
                <Link
                  href={`/messages/${thread.id}`}
                  className={`flex items-center gap-3.5 p-4 hover:bg-[var(--color-cream-deep)]/60 transition-colors ${
                    unread ? "bg-[var(--color-gold-pale)]/25" : ""
                  }`}
                >
                  <Avatar first={other?.firstName ?? "?"} last={other?.lastName ?? ""} url={other?.avatarUrl} size={42} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${unread ? "font-bold" : "font-medium"}`}>{name}</p>
                      <span className="text-[11px] text-[var(--color-ink-muted)] shrink-0">
                        {last ? relativeFR(last.createdAt) : ""}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-gold-dark)] truncate">{thread.product?.title ?? thread.subject}</p>
                    <p className={`text-sm truncate ${unread ? "text-[var(--color-ink)]" : "text-[var(--color-ink-muted)]"}`}>
                      {last ? `${last.senderId === user.id ? "Vous : " : ""}${last.body}` : "—"}
                    </p>
                  </div>
                  {thread.product?.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thread.product.images[0].url} alt="" className="h-11 w-11 rounded-lg object-cover hidden sm:block" />
                  )}
                  {unread && <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-gold)] shrink-0" />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AccountLayout>
  );
}
