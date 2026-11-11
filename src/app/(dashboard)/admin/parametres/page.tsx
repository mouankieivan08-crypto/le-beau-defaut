import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { GRADE_LIST } from "@/lib/constants";
import { saveSettingsAction } from "@/lib/actions/admin";
import ActionForm from "@/components/ActionForm";
import { PageHeader, Card, GradeBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Paramètres" };

const GROUPS: { title: string; keys: string[] }[] = [
  { title: "Plateforme", keys: ["site.name", "site.tagline"] },
  { title: "Contact client", keys: ["contact.phone", "contact.whatsapp", "contact.email"] },
  { title: "Livraison & réclamations", keys: ["delivery.defaultFee", "returns.days"] },
  { title: "Paiements Mobile Money", keys: ["payment.mtn.merchant", "payment.airtel.merchant"] },
  { title: "Modération", keys: ["moderation.required"] },
];

export default async function AdminSettingsPage() {
  await requireAdmin("/admin/parametres");
  const settings = await prisma.setting.findMany();
  const byKey = Object.fromEntries(settings.map((s) => [s.key, s]));

  return (
    <>
      <PageHeader title="Paramètres" subtitle="Réglages généraux de la plateforme." />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-start">
        <Card>
          <ActionForm action={saveSettingsAction} submitLabel="Enregistrer les paramètres">
            <div className="flex flex-col gap-7">
              {GROUPS.map((g) => (
                <fieldset key={g.title}>
                  <legend className="font-display text-lg font-bold mb-3">{g.title}</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {g.keys.map((k) => {
                      const s = byKey[k];
                      const isBool = s?.value === "true" || s?.value === "false";
                      return (
                        <div key={k}>
                          <label className="label" htmlFor={k}>
                            {s?.label ?? k}
                          </label>
                          {isBool ? (
                            <select id={k} name={`setting:${k}`} defaultValue={s.value} className="field">
                              <option value="true">Oui</option>
                              <option value="false">Non</option>
                            </select>
                          ) : (
                            <input id={k} name={`setting:${k}`} defaultValue={s?.value ?? ""} className="field" />
                          )}
                          <code className="text-[10px] text-[var(--color-ink-muted)]">{k}</code>
                        </div>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          </ActionForm>
        </Card>

        <Card>
          <h2 className="font-display text-lg font-bold mb-1">La grille du défaut</h2>
          <p className="text-xs text-[var(--color-ink-muted)] mb-4">
            Remises minimales imposées à la publication (définies dans <code>src/lib/constants.ts</code>).
          </p>
          <ul className="flex flex-col gap-3">
            {GRADE_LIST.map((g) => (
              <li key={g.key} className="flex items-start gap-3">
                <GradeBadge grade={g.key} />
                <div>
                  <p className="text-sm font-semibold">{g.name}</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    Remise de {g.minDiscount} à {g.maxDiscount} % · {g.short}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
