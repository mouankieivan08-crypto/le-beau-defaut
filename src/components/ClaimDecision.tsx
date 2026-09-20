"use client";

import { useState } from "react";
import { useStickyAction } from "@/lib/use-sticky-action";
import { resolveClaimAction } from "@/lib/actions/claims";
import { CLAIM_RESOLUTIONS } from "@/lib/constants";
import { money } from "@/lib/format";
import Icon from "./Icon";
import { Alert } from "./ui";

/** Panneau de décision d'une réclamation, côté administration. */
export default function ClaimDecision({
  claimId,
  orderTotal,
  currentStatus,
}: {
  claimId: string;
  orderTotal: number;
  currentStatus: string;
}) {
  const [state, onSubmit, pending] = useStickyAction(resolveClaimAction, undefined);
  const [decision, setDecision] = useState<string>(currentStatus === "OUVERTE" ? "" : currentStatus);
  const [resolution, setResolution] = useState<string>("");
  const [refund, setRefund] = useState<number>(0);

  if (state?.success) {
    return <Alert tone="success">{state.success}</Alert>;
  }

  return (
    <form onSubmit={onSubmit} className="border-t border-[var(--color-sand)] pt-4 mt-4">
      <input type="hidden" name="claimId" value={claimId} />
      <input type="hidden" name="status" value={decision} />

      {state?.error && (
        <div className="mb-3">
          <Alert tone="danger">{state.error}</Alert>
        </div>
      )}

      <p className="label">Décision</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {[
          { key: "EN_EXAMEN", label: "Mettre à l'examen", icon: "clock" as const },
          { key: "ACCEPTEE", label: "Accepter", icon: "check" as const },
          { key: "REFUSEE", label: "Refuser", icon: "close" as const },
        ].map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setDecision(d.key)}
            className={`btn btn-sm ${
              decision === d.key
                ? d.key === "ACCEPTEE"
                  ? "!bg-[var(--color-grade-a)] !text-white"
                  : d.key === "REFUSEE"
                    ? "btn-danger"
                    : "btn-primary"
                : "btn-outline"
            }`}
          >
            <Icon name={d.icon} size={13} /> {d.label}
          </button>
        ))}
      </div>

      {decision === "ACCEPTEE" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="label" htmlFor={`res-${claimId}`}>
              Suite donnée
            </label>
            <select
              id={`res-${claimId}`}
              name="resolution"
              value={resolution}
              onChange={(e) => {
                setResolution(e.target.value);
                if (e.target.value === "REPRISE" || e.target.value === "REMBOURSEMENT") setRefund(orderTotal);
                if (e.target.value === "AUCUNE") setRefund(0);
              }}
              className="field"
              required
            >
              <option value="">Choisir…</option>
              {CLAIM_RESOLUTIONS.filter((r) => r.key !== "AUCUNE").map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label} — {r.hint}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor={`refund-${claimId}`}>
              Montant remboursé (max {money(orderTotal)})
            </label>
            <input
              id={`refund-${claimId}`}
              name="refundAmount"
              type="number"
              min={0}
              max={orderTotal}
              step={500}
              value={refund || ""}
              onChange={(e) => setRefund(Number(e.target.value))}
              className="field"
            />
          </div>
        </div>
      )}

      {decision && (
        <>
          <div className="mb-3">
            <label className="label" htmlFor={`note-${claimId}`}>
              Message à l&apos;acheteur
            </label>
            <textarea
              id={`note-${claimId}`}
              name="adminNote"
              rows={2}
              className="field"
              placeholder={
                decision === "REFUSEE"
                  ? "Expliquez pourquoi la réclamation n'est pas retenue."
                  : "Ce que vous faites et sous quel délai."
              }
            />
          </div>
          <button className="btn btn-primary btn-sm" disabled={pending}>
            {pending ? "Enregistrement…" : "Valider la décision"}
          </button>
        </>
      )}
    </form>
  );
}
