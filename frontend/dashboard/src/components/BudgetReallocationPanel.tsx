import { useState } from "react";
import type { BudgetAllocation, InfrastructureDomain } from "../types";
import { useLanguage } from "../hooks/useLanguage";

const DEFAULT_ALLOCATIONS: BudgetAllocation[] = [
  { domain: "Water", current_cr: 120, proposed_cr: 120 },
  { domain: "Road",  current_cr: 200, proposed_cr: 200 },
  { domain: "Power", current_cr: 85,  proposed_cr: 85  },
];

interface BudgetReallocationPanelProps {
  onApprove: (allocations: BudgetAllocation[]) => Promise<void>;
  redZoneDomain?: InfrastructureDomain;
}

export function BudgetReallocationPanel({
  onApprove,
  redZoneDomain,
}: BudgetReallocationPanelProps) {
  const { t } = useLanguage();
  const [allocations, setAllocations] = useState<BudgetAllocation[]>(() =>
    DEFAULT_ALLOCATIONS.map((a) =>
      a.domain === redZoneDomain ? { ...a, proposed_cr: a.current_cr + 12 } : a
    )
  );
  const [submitting, setSubmitting] = useState(false);
  const [approved, setApproved] = useState(false);

  const updateProposed = (domain: InfrastructureDomain, value: number) => {
    setAllocations((prev) =>
      prev.map((a) => (a.domain === domain ? { ...a, proposed_cr: value } : a))
    );
  };

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await onApprove(allocations);
      setApproved(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <aside className="panel budget-panel">
      <h2>{t.dash_budget_title}</h2>

      {redZoneDomain && (
        <p className="red-zone-hint">
          SPIN Signal: <strong>{redZoneDomain}</strong> demand elevated in identified zones.
        </p>
      )}

      <p className="spin-signal-note">
        Adjustments below are AI-generated recommendations. Final approval remains with policymakers.
      </p>

      <div className="slider-list">
        {allocations.map((item) => {
          const delta = item.proposed_cr - item.current_cr;
          return (
            <div key={item.domain} className="slider-row">
              <div className="slider-header">
                <span>{item.domain}</span>
                <span className="budget-value">₹{item.proposed_cr} Cr</span>
              </div>
              <input
                type="range"
                min={10}
                max={400}
                step={5}
                value={item.proposed_cr}
                onChange={(e) => updateProposed(item.domain, Number(e.target.value))}
                className="budget-slider"
                disabled={approved}
              />
              <span className={`budget-delta ${delta > 0 ? "positive" : ""}`}>
                {delta >= 0 ? "+" : ""}{delta} Cr from current ₹{item.current_cr} Cr
              </span>
            </div>
          );
        })}
      </div>

      <button
        className={`approve-btn${approved ? " approved" : ""}`}
        onClick={handleApprove}
        disabled={submitting || approved}
      >
        {approved
          ? "✓ Submitted — Awaiting Policymaker Sign-Off"
          : submitting
          ? "Submitting…"
          : "Submit Recommendation for Approval"}
      </button>
      {!approved && (
        <p className="approval-note">{t.trans_disclaimer}</p>
      )}
    </aside>
  );
}
