import React, { useState } from "react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string) => void;
}

const FAQS = [
  {
    q: "What is SPIN (Symbiotic Public Infrastructure Network)?",
    a: "SPIN is an AI-powered municipal intelligence platform that bridges citizen grievance reporting with municipal infrastructure engineers and Union Ministries for real-time fiscal reallocation.",
  },
  {
    q: "How do I report a public infrastructure issue?",
    a: "Go to Citizen Portal -> 'Raise a Grievance'. Select your category (Water, Roads, Power, Sanitation, etc.), pin your GPS location, describe the problem, and submit. An AI engine classifies severity and routes the ticket directly to the municipal queue.",
  },
  {
    q: "How can I track my submitted grievance?",
    a: "Click on 'Track Grievances' in the Citizen Portal or use the search bar with your Grievance ID (e.g. GRV-2026-XXXX) to view live review status, assigned engineer, and resolution milestones.",
  },
  {
    q: "How does the Policymaker Dashboard work?",
    a: "Policymakers can filter data by Indian State and District, view spatial cluster heatmaps of recurring civic failures, and test AI fiscal budget reallocation models before submitting them to the Ministry for clearance.",
  },
  {
    q: "How do Union Ministries evaluate and approve budget proposals?",
    a: "Ministry officials can sign into the Ministry Portal to access the Evaluation Desk, inspect the empirical data backing each budget proposal, and grant formal clearance with ministerial directives.",
  },
];

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(15,30,54,0.7)", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px"
    }}>
      <div style={{
        background: "#fff", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflowY: "auto",
        borderRadius: "8px", borderTop: "4px solid var(--col-orange)", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--col-orange)", letterSpacing: "0.08em" }}>
              GOVERNMENT HELPDESK & GUIDANCE
            </span>
            <h2 style={{ fontSize: "20px", color: "var(--col-navy)", margin: "4px 0 0 0" }}>
              Help Center & Emergency Helplines
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--col-text-muted)"
            }}
          >
            ✕
          </button>
        </div>

        {/* Emergency Helplines Strip */}
        <div style={{ background: "var(--col-navy)", color: "#fff", padding: "14px", borderRadius: "6px", marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--col-orange)", letterSpacing: "0.06em", marginBottom: "8px" }}>
            🚨 NATIONAL PUBLIC INFRASTRUCTURE HELPLINES
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", fontSize: "12px" }}>
            <div>📞 <strong>CPGRAMS National Portal:</strong> 1800-11-4000 (Toll-Free)</div>
            <div>⚡ <strong>Power Outages / DISCOM:</strong> 1912</div>
            <div>🚰 <strong>Jal Jeevan Mission / Water:</strong> 1800-180-1551</div>
            <div>🏛️ <strong>Municipal Grievance Desk:</strong> 1913</div>
            <div>🚑 <strong>Emergency Disaster Response:</strong> 112 / 1077</div>
            <div>🛣️ <strong>National Highways (NHAI):</strong> 1033</div>
          </div>
        </div>

        {/* Quick Portal Navigation Links */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "20px" }}>
          <button
            onClick={() => { onClose(); onNavigate?.("citizen-raise"); }}
            style={{
              padding: "10px", background: "var(--col-panel)", border: "1px solid var(--col-border)",
              borderRadius: "6px", textAlign: "left", cursor: "pointer"
            }}
          >
            <strong style={{ fontSize: "12px", color: "var(--col-navy)", display: "block" }}>Raise Grievance</strong>
            <span style={{ fontSize: "11px", color: "var(--col-text-muted)" }}>Submit civic complaint</span>
          </button>

          <button
            onClick={() => { onClose(); onNavigate?.("citizen-track"); }}
            style={{
              padding: "10px", background: "var(--col-panel)", border: "1px solid var(--col-border)",
              borderRadius: "6px", textAlign: "left", cursor: "pointer"
            }}
          >
            <strong style={{ fontSize: "12px", color: "var(--col-navy)", display: "block" }}>Track Ticket</strong>
            <span style={{ fontSize: "11px", color: "var(--col-text-muted)" }}>Check resolution status</span>
          </button>

          <button
            onClick={() => { onClose(); onNavigate?.("approval-portal"); }}
            style={{
              padding: "10px", background: "var(--col-panel)", border: "1px solid var(--col-border)",
              borderRadius: "6px", textAlign: "left", cursor: "pointer"
            }}
          >
            <strong style={{ fontSize: "12px", color: "var(--col-navy)", display: "block" }}>Approval Status</strong>
            <span style={{ fontSize: "11px", color: "var(--col-text-muted)" }}>Fiscal audit trail</span>
          </button>
        </div>

        {/* FAQs Accordion */}
        <h3 style={{ fontSize: "15px", color: "var(--col-navy)", marginBottom: "10px" }}>
          Frequently Asked Questions
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              style={{
                border: "1px solid var(--col-border)", borderRadius: "6px", overflow: "hidden"
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                style={{
                  width: "100%", padding: "10px 14px", background: openFaq === idx ? "var(--col-orange-dim)" : "var(--col-surface)",
                  border: "none", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center",
                  cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "var(--col-navy)"
                }}
              >
                <span>{faq.q}</span>
                <span>{openFaq === idx ? "▲" : "▼"}</span>
              </button>
              {openFaq === idx && (
                <div style={{ padding: "12px 14px", fontSize: "12px", color: "var(--col-text-mid)", background: "#fff", borderTop: "1px solid var(--col-border)" }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Action */}
        <div style={{ textAlign: "right", borderTop: "1px solid var(--col-border)", paddingTop: "14px" }}>
          <button
            onClick={onClose}
            className="service-card-btn service-card-btn-orange"
            style={{ padding: "8px 20px", fontSize: "12px" }}
          >
            Close Help Center
          </button>
        </div>
      </div>
    </div>
  );
};
