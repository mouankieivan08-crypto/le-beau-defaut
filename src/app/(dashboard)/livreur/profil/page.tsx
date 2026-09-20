import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { VEHICLES, CITIES } from "@/lib/constants";
import { updateCourierProfileAction } from "@/lib/actions/courier";
import ActionForm from "@/components/ActionForm";
import { PageHeader, Card, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Véhicule & zones" };

export default async function CourierProfilePage() {
  const user = await requireRole(["LIVREUR", "ADMIN"], "/livreur/profil");
  const courier = user.courier;
  if (!courier) {
    return (
      <>
        <PageHeader title="Véhicule & zones" />
        <EmptyState icon="truck" title="Aucun profil livreur" />
      </>
    );
  }

  const zones = courier.zones.split(";").map((z) => z.trim());

  return (
    <div className="max-w-2xl">
      <PageHeader title="Véhicule & zones" subtitle="Ces informations servent à vous proposer les bonnes courses." />
      <Card>
        <ActionForm action={updateCourierProfileAction} submitLabel="Enregistrer" submitClassName="btn btn-gold">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="vehicle">
                Véhicule
              </label>
              <select id="vehicle" name="vehicle" defaultValue={courier.vehicle} className="field">
                {Object.entries(VEHICLES).map(([key, v]) => (
                  <option key={key} value={key}>
                    {v.label} (≈ {v.capacity} kg)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="plateNumber">
                Immatriculation
              </label>
              <input id="plateNumber" name="plateNumber" defaultValue={courier.plateNumber ?? ""} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="capacityKg">
                Charge maximale (kg)
              </label>
              <input id="capacityKg" name="capacityKg" type="number" min={1} defaultValue={courier.capacityKg} className="field" />
            </div>
            <div>
              <p className="label">Villes desservies</p>
              <input type="hidden" name="zones" value={zones.join(";")} />
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {CITIES.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="zoneChoice"
                      value={c}
                      defaultChecked={zones.includes(c)}
                      className="accent-[var(--color-gold)] h-4 w-4"
                    />
                    {c}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
