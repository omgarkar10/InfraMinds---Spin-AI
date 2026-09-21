/**
 * useBudgetReallocation — state and logic for the BudgetReallocationPanel.
 *
 * Separates domain-specific budget data and mutation logic from the view.
 * The DEFAULT_ALLOCATIONS table is the canonical source for initial values;
 * it is NOT AI-generated at runtime — these are baseline planning figures
 * that the policymaker adjusts and approves.
 */
import { useState, useMemo } from "react";
import type { BudgetAllocation } from "../types";

/** Baseline budget allocations (₹ Cr). recommended_cr values come from
 *  historical grievance volume — NOT real-time AI generation. */
export const DEFAULT_ALLOCATIONS: BudgetAllocation[] = [
  { domain: "Water Supply",          current_cr: 120, proposed_cr: 120, recommended_cr: 145 },
  { domain: "Roads & Potholes",      current_cr: 200, proposed_cr: 200, recommended_cr: 230 },
  { domain: "Drainage / Flooding",   current_cr: 75,  proposed_cr: 75,  recommended_cr: 95  },
  { domain: "Electricity",           current_cr: 85,  proposed_cr: 85,  recommended_cr: 90  },
  { domain: "Waste Management",      current_cr: 60,  proposed_cr: 60,  recommended_cr: 72  },
  { domain: "Street Lighting",       current_cr: 40,  proposed_cr: 40,  recommended_cr: 48  },
  { domain: "Public Transport",      current_cr: 110, proposed_cr: 110, recommended_cr: 125 },
  { domain: "Sanitation",            current_cr: 55,  proposed_cr: 55,  recommended_cr: 65  },
  { domain: "Public Infrastructure", current_cr: 90,  proposed_cr: 90,  recommended_cr: 105 },
];

interface UseBudgetReallocationOptions {
  redZoneDomain?: string;
}

export function useBudgetReallocation({ redZoneDomain }: UseBudgetReallocationOptions) {
  const initialAllocations = useMemo<BudgetAllocation[]>(
    () =>
      DEFAULT_ALLOCATIONS.map((a) => {
        const isRedZone =
          redZoneDomain && a.domain.toLowerCase().includes(redZoneDomain.toLowerCase());
        return isRedZone ? { ...a, proposed_cr: a.recommended_cr } : { ...a };
      }),
    [redZoneDomain]
  );

  const [allocations, setAllocations] = useState<BudgetAllocation[]>(initialAllocations);
  const [submitting, setSubmitting] = useState(false);
  const [approved, setApproved] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const updateProposed = (domain: string, value: number) => {
    setAllocations((prev) => prev.map((a) => (a.domain === domain ? { ...a, proposed_cr: value } : a)));
  };

  const applyRecommended = (domain: string) => {
    setAllocations((prev) =>
      prev.map((a) => (a.domain === domain ? { ...a, proposed_cr: a.recommended_cr } : a))
    );
  };

  const applyAllRecommended = () => {
    setAllocations((prev) => prev.map((a) => ({ ...a, proposed_cr: a.recommended_cr })));
  };

  const reset = () => {
    setAllocations(initialAllocations);
    setApproved(false);
    setSubmitMessage("");
  };

  const approve = async (
    onApprove: (a: BudgetAllocation[]) => Promise<void>,
    _meta: { submittedBy: string; state?: string; district?: string }
  ) => {
    setSubmitting(true);
    try {
      await onApprove(allocations);
      setApproved(true);
      setSubmitMessage("Recommendation submitted to Ministry for approval.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalProposed = allocations.reduce((s, a) => s + a.proposed_cr, 0);
  const totalCurrent = allocations.reduce((s, a) => s + a.current_cr, 0);
  const totalDelta = totalProposed - totalCurrent;

  return {
    allocations,
    submitting,
    approved,
    submitMessage,
    totalProposed,
    totalCurrent,
    totalDelta,
    updateProposed,
    applyRecommended,
    applyAllRecommended,
    reset,
    approve,
  };
}
