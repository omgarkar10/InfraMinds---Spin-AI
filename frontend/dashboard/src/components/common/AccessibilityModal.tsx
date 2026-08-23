import React, { useState, useEffect } from "react";

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({ isOpen, onClose }) => {
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [grayscale, setGrayscale] = useState<boolean>(false);
  const [letterSpacing, setLetterSpacing] = useState<boolean>(false);

  useEffect(() => {
    // Font size
    if (fontSize === "large") {
      document.documentElement.style.fontSize = "18px";
    } else if (fontSize === "xlarge") {
      document.documentElement.style.fontSize = "20px";
    } else {
      document.documentElement.style.fontSize = "16px";
    }

    // High contrast
    if (highContrast) {
      document.body.classList.add("accessibility-high-contrast");
    } else {
      document.body.classList.remove("accessibility-high-contrast");
    }

    // Grayscale
    if (grayscale) {
      document.body.style.filter = "grayscale(100%)";
    } else {
      document.body.style.filter = "none";
    }

    // Letter spacing
    if (letterSpacing) {
      document.body.style.letterSpacing = "0.08em";
    } else {
      document.body.style.letterSpacing = "normal";
    }
  }, [fontSize, highContrast, grayscale, letterSpacing]);

  const handleReset = () => {
    setFontSize("normal");
    setHighContrast(false);
    setGrayscale(false);
    setLetterSpacing(false);
    document.documentElement.style.fontSize = "16px";
    document.body.classList.remove("accessibility-high-contrast");
    document.body.style.filter = "none";
    document.body.style.letterSpacing = "normal";
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(15,30,54,0.7)", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px"
    }}>
      <div style={{
        background: "#fff", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto",
        borderRadius: "8px", borderTop: "4px solid var(--col-navy)", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--col-orange)", letterSpacing: "0.08em" }}>
              UX4G ACCESSIBILITY CONTROLS
            </span>
            <h2 style={{ fontSize: "20px", color: "var(--col-navy)", margin: "4px 0 0 0" }}>
              Accessibility Options & Assistive Tools
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

        <p style={{ fontSize: "13px", color: "var(--col-text-mid)", marginBottom: "20px" }}>
          Adjust visual display settings to improve readability and compliance with Indian Government Web Guidelines (GIGW 3.0 / WCAG 2.1 AA).
        </p>

        {/* Text Size Control */}
        <div style={{ marginBottom: "20px", padding: "14px", background: "var(--col-panel)", borderRadius: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: "700", display: "block", marginBottom: "8px", color: "var(--col-navy)" }}>
            Text Size (A- / A / A+)
          </label>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setFontSize("normal")}
              style={{
                flex: 1, padding: "8px", fontSize: "13px", borderRadius: "4px", border: "1px solid var(--col-border)",
                background: fontSize === "normal" ? "var(--col-navy)" : "#fff",
                color: fontSize === "normal" ? "#fff" : "var(--col-navy)",
                cursor: "pointer", fontWeight: "600"
              }}
            >
              Default (100%)
            </button>
            <button
              onClick={() => setFontSize("large")}
              style={{
                flex: 1, padding: "8px", fontSize: "15px", borderRadius: "4px", border: "1px solid var(--col-border)",
                background: fontSize === "large" ? "var(--col-navy)" : "#fff",
                color: fontSize === "large" ? "#fff" : "var(--col-navy)",
                cursor: "pointer", fontWeight: "600"
              }}
            >
              Large (115%)
            </button>
            <button
              onClick={() => setFontSize("xlarge")}
              style={{
                flex: 1, padding: "8px", fontSize: "17px", borderRadius: "4px", border: "1px solid var(--col-border)",
                background: fontSize === "xlarge" ? "var(--col-navy)" : "#fff",
                color: fontSize === "xlarge" ? "#fff" : "var(--col-navy)",
                cursor: "pointer", fontWeight: "600"
              }}
            >
              Extra Large (130%)
            </button>
          </div>
        </div>

        {/* Contrast and Display Toggles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          <div style={{ padding: "14px", background: "var(--col-panel)", borderRadius: "6px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "var(--col-navy)" }}>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                style={{ width: "16px", height: "16px" }}
              />
              High Contrast Mode
            </label>
            <span style={{ fontSize: "11px", color: "var(--col-text-muted)", display: "block", marginTop: "4px" }}>
              Sharp contrast for low vision
            </span>
          </div>

          <div style={{ padding: "14px", background: "var(--col-panel)", borderRadius: "6px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "var(--col-navy)" }}>
              <input
                type="checkbox"
                checked={grayscale}
                onChange={(e) => setGrayscale(e.target.checked)}
                style={{ width: "16px", height: "16px" }}
              />
              Grayscale Mode
            </label>
            <span style={{ fontSize: "11px", color: "var(--col-text-muted)", display: "block", marginTop: "4px" }}>
              Monochrome view for color blindness
            </span>
          </div>

          <div style={{ padding: "14px", background: "var(--col-panel)", borderRadius: "6px", gridColumn: "1 / -1" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "var(--col-navy)" }}>
              <input
                type="checkbox"
                checked={letterSpacing}
                onChange={(e) => setLetterSpacing(e.target.checked)}
                style={{ width: "16px", height: "16px" }}
              />
              Expanded Text Spacing
            </label>
            <span style={{ fontSize: "11px", color: "var(--col-text-muted)", display: "block", marginTop: "4px" }}>
              Enhances readability for dyslexia and cognitive reading support
            </span>
          </div>
        </div>

        {/* Screen Reader & Keyboard Guide */}
        <div style={{ padding: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", marginBottom: "20px", fontSize: "12px", color: "#166534" }}>
          <strong>Screen Reader & Keyboard Access:</strong> Use <kbd style={{ padding: "2px 4px", background: "#fff", border: "1px solid #ccc", borderRadius: "3px" }}>Tab</kbd> to navigate interactive elements and <kbd style={{ padding: "2px 4px", background: "#fff", border: "1px solid #ccc", borderRadius: "3px" }}>Enter</kbd> to activate. ARIA landmark regions are active across the portal.
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--col-border)", paddingTop: "16px" }}>
          <button
            onClick={handleReset}
            style={{
              padding: "8px 14px", fontSize: "12px", border: "1px solid var(--col-border)",
              background: "#fff", borderRadius: "4px", cursor: "pointer", color: "var(--col-text-mid)"
            }}
          >
            Reset to Default
          </button>
          <button
            onClick={onClose}
            className="service-card-btn service-card-btn-orange"
            style={{ padding: "8px 18px", fontSize: "12px" }}
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
