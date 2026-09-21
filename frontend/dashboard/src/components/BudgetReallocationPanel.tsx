import type { BudgetAllocation } from "../types";
import { useLanguage } from "../hooks/useLanguage";
import { saveApprovalRecord } from "../services/approvalService";
import { useBudgetReallocation } from "../hooks/useBudgetReallocation";

interface BudgetReallocationPanelProps {
  onApprove: (allocations: BudgetAllocation[]) => Promise<void>;
  redZoneDomain?: string;
  submittedBy?: string;
  selectedState?: string;
  selectedDistrict?: string;
}

export function BudgetReallocationPanel({
  onApprove,
  redZoneDomain,
  submittedBy = "Policymaker Dashboard",
  selectedState,
  selectedDistrict,
}: BudgetReallocationPanelProps) {
  const { t } = useLanguage();
  const {
    allocations, submitting, approved, submitMessage,
    totalProposed, totalCurrent, totalDelta,
    updateProposed, applyRecommended, applyAllRecommended, reset, approve,
  } = useBudgetReallocation({ redZoneDomain });

  const handleApprove = async () => {
    await approve(async (a) => {
      await onApprove(a);
      a.forEach((item) => {
        if (item.proposed_cr !== item.current_cr) {
          saveApprovalRecord({
            category: item.domain,
            proposed_cr: item.proposed_cr,
            current_cr: item.current_cr,
            recommended_cr: item.recommended_cr,
            submittedBy,
            state: selectedState,
            district: selectedDistrict,
          });
        }
      });
    }, { submittedBy, state: selectedState, district: selectedDistrict });
  };

  return (
    <aside className="panel budget-panel">
      <div className="panel-header">
        <h2 className="panel-title">BUDGET REALLOCATION RECOMMENDATIONS</h2>
        <span className="panel-badge">FISCAL MODEL</span>
      </div>

      <p className="spin-signal-note">
        Adjustments below are AI-generated recommendations based on grievance volume.
        Final approval remains with policymakers.
      </p>

      {!approved && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <button
            onClick={applyAllRecommended}
            style={{
              flex: 1, padding: "8px 12px", fontSize: "12px", fontWeight: "700",
              background: "var(--col-orange)", color: "#fff", border: "none",
              borderRadius: "6px", cursor: "pointer", letterSpacing: "0.04em",
            }}
          >
            ⚡ Apply All Recommended Budgets
          </button>
          <button
            onClick={reset}
            style={{
              padding: "8px 12px", fontSize: "12px", color: "var(--col-text-muted)",
              background: "var(--col-panel)", border: "1px solid var(--col-border)",
              borderRadius: "6px", cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>
      )}

      <div style={{
        display: "flex", justifyContent: "space-between", padding: "10px 12px",
        background: "var(--col-panel)", borderRadius: "6px", marginBottom: "12px",
        fontSize: "12px", border: "1px solid var(--col-border)",
      }}>
        <span>Total Budget: <strong>₹{totalProposed.toLocaleString()} Cr</strong></span>
        <span style={{ color: totalDelta > 0 ? "var(--col-orange)" : totalDelta < 0 ? "var(--col-red)" : "var(--col-text-muted)" }}>
          {totalDelta >= 0 ? "+" : ""}{totalDelta} Cr from current ₹{totalCurrent.toLocaleString()} Cr
        </span>
      </div>

      <div className="slider-list">
        {allocations.map((item) => {
          const delta = item.proposed_cr - item.current_cr;
          const isAtRecommended = item.proposed_cr === item.recommended_cr;
          return (
            <div key={item.domain} className="slider-row">
              <div className="slider-header">
                <span className="domain-name">{item.domain}</span>
                <span className="budget-value">₹{item.proposed_cr} Cr</span>
              </div>
              <input
                type="range" min={10} max={500} step={5}
                value={item.proposed_cr}
                onChange={(e) => updateProposed(item.domain, Number(e.target.value))}
                className="budget-slider"
                disabled={approved}
              />
              <div className="slider-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className={`budget-delta ${delta > 0 ? "positive" : delta < 0 ? "negative" : ""}`}>
                  {delta >= 0 ? "+" : ""}{delta} Cr · Recommended: ₹{item.recommended_cr} Cr
                </span>
                {!approved && !isAtRecommended && (
                  <button
                    onClick={() => applyRecommended(item.domain)}
                    title={`Apply recommended ₹${item.recommended_cr} Cr`}
                    style={{
                      fontSize: "10px", padding: "2px 8px", background: "var(--col-orange-dim)",
                      color: "var(--col-orange)", border: "1px solid var(--col-orange-line)",
                      borderRadius: "4px", cursor: "pointer", whiteSpace: "nowrap", fontWeight: "600",
                    }}
                  >
                    Apply ₹{item.recommended_cr} Cr
                  </button>
                )}
                {isAtRecommended && (
                  <span style={{ fontSize: "10px", color: "var(--col-green)", fontWeight: "600" }}>✓ Recommended</span>
                )}
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
          ? "✓ Submitted — Awaiting Ministry Approval"
          : submitting
          ? "Submitting…"
          : "Submit Recommendation for Ministry Approval"}
      </button>

      {approved && submitMessage && (
        <div style={{
          marginTop: "10px", padding: "10px", background: "#ecfdf5",
          border: "1px solid #6ee7b7", borderRadius: "6px", fontSize: "12px", color: "#065f46",
        }}>
          ✅ {submitMessage} View status in the <strong>Approval Portal</strong>.
        </div>
      )}

      {!approved && <p className="approval-note">{t.trans_disclaimer}</p>}
    </aside>
  );
}
