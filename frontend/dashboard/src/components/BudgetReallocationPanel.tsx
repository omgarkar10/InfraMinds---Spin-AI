import { useState } from "react";
import type { BudgetAllocation, InfrastructureDomain } from "../types";

const DEFAULT_ALLOCATIONS: BudgetAllocation[] = [
  { domain: "Water", current_cr: 120, proposed_cr: 120 },
  { domain: "Road", current_cr: 200, proposed_cr: 200 },
  { domain: "Power", current_cr: 85, proposed_cr: 85 },
];

interface BudgetReallocationPanelProps {
  onApprove: (allocations: BudgetAllocation[]) => Promise<void>;
  redZoneDomain?: InfrastructureDomain;
}

export function BudgetReallocationPanel({
  onApprove,
  redZoneDomain,
}: BudgetReallocationPanelProps) {
  const [allocations, setAllocations] = useState<BudgetAllocation[]>(() =>
    DEFAULT_ALLOCATIONS.map((a) =>
      a.domain === redZoneDomain ? { ...a, proposed_cr: a.current_cr + 30 } : a
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
      <h2>Budget Reallocation</h2>
      {redZoneDomain && (
        <p className="red-zone-hint">
          Red Zone detected: <strong>{redZoneDomain}</strong> — consider increasing allocation.
        </p>
      )}

      <div className="slider-list">
        {allocations.map((item) => (
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
            />
            <span className="budget-delta">
              {item.proposed_cr - item.current_cr >= 0 ? "+" : ""}
              {item.proposed_cr - item.current_cr} Cr from current
            </span>
          </div>
        ))}
      </div>

      <button
        className="approve-btn"
        onClick={handleApprove}
        disabled={submitting || approved}
      >
        {approved ? "✓ Approved — Citizens Notified" : submitting ? "Processing…" : "One-Click Approve"}
      </button>
    </aside>
  );
}
