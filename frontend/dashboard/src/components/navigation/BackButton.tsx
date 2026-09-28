import React from "react";

interface BackButtonProps {
  onClick: () => void;
  label?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ onClick, label = "Back" }) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        top: "16px",
        left: "16px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 16px",
        borderRadius: "20px",
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        color: "var(--col-navy)",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateX(-2px)";
        e.currentTarget.style.background = "rgba(255, 255, 255, 1)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      {label}
    </button>
  );
};
