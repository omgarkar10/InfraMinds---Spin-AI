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

  const hasRedZone = redZoneDomain && redZoneDomain !== "None";

  return (
    <aside className="panel budget-panel">
      <div className="panel-header">
        <h2 className="panel-title">BUDGET REALLOCATION RECOMMENDATIONS</h2>
        <span className="panel-badge">FISCAL MODEL</span>
      </div>

      <p className="spin-signal-note">
        Adjustments below are AI-generated recommendations. Final approval remains with policymakers.
      </p>

      {hasRedZone && (
        <div className="why-recommendation-box">
          <div className="why-header">
            <span className="why-icon">💡</span>
            <span className="why-title">WHY THIS RECOMMENDATION?</span>
          </div>
          <p className="why-desc">
            Spatial correlation & civic demand elevated for <strong>{redZoneDomain}</strong> in identified red zones.
          </p>
        </div>
      )}

      <div className="slider-list">
        {allocations.map((item) => {
          const delta = item.proposed_cr - item.current_cr;
          return (
            <div key={item.domain} className="slider-row">
              <div className="slider-header">
                <span className="domain-name">{item.domain}</span>
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
              <div className="slider-footer">
                <span className={`budget-delta ${delta > 0 ? "positive" : delta < 0 ? "negative" : ""}`}>
                  {delta >= 0 ? "+" : ""}{delta} Cr from current ₹{item.current_cr} Cr
                </span>
              </div>
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

