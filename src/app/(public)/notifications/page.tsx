import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { relativeFR } from "@/lib/format";
import { markNotificationsReadAction } from "@/lib/actions/shop";
import { AccountLayout } from "@/components/AccountNav";
import Icon, { type IconName } from "@/components/Icon";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Notifications" };

const ICONS: Record<string, IconName> = {
  COMMANDE: "package",
  ANNONCE: "tag",
  MESSAGE: "message",
  PAIEMENT: "wallet",
  SYSTEME: "bell",
};

export default async function NotificationsPage() {
  const user = await requireUser("/notifications");
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <AccountLayout active="/notifications" user={user}>
      <div className="flex items-end justify-between gap-3 flex-wrap mb-5">
        <div>
          <h1 className="font-display text-[28px] font-bold">Notifications</h1>
          <p className="text-sm text-[var(--color-ink-muted)]">{unread} non lue{unread > 1 ? "s" : ""}</p>
        </div>
        {unread > 0 && (
          <form action={markNotificationsReadAction}>
            <button className="btn btn-outline btn-sm">
              <Icon name="check" size={14} /> Tout marquer comme lu
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon="bell" title="Rien de neuf" message="Vos commandes, messages et versements apparaîtront ici." />
      ) : (
        <ul className="surface divide-y divide-[var(--color-sand)] overflow-hidden">
          {notifications.map((n) => {
            const body = (
              <div className={`flex gap-3.5 p-4 ${n.isRead ? "" : "bg-[var(--color-gold-pale)]/25"}`}>
                <span
                  className={`h-9 w-9 rounded-full grid place-items-center shrink-0 ${
                    n.isRead ? "bg-[var(--color-cream-deep)] text-[var(--color-ink-muted)]" : "bg-[var(--color-gold)] text-white"
                  }`}
                >
                  <Icon name={ICONS[n.type] ?? "bell"} size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm ${n.isRead ? "font-medium" : "font-bold"}`}>{n.title}</p>
                    <span className="text-[11px] text-[var(--color-ink-muted)] shrink-0">{relativeFR(n.createdAt)}</span>
                  </div>
                  <p className="text-sm text-[var(--color-ink-muted)]">{n.body}</p>
                </div>
              </div>
            );
            return (
              <li key={n.id}>
                {n.link ? (
                  <Link href={n.link} className="block hover:bg-[var(--color-cream-deep)]/50 transition-colors">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AccountLayout>
  );
}
