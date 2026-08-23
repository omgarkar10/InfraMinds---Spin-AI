import { useLanguage } from "../../hooks/useLanguage";
import { SectionBase } from "./SectionBase";
import "./EcosystemSection.css";

export function EcosystemSection() {
  const { t } = useLanguage();

  return (
    <SectionBase id="intelligence" number="04" label={t.eco_label.toUpperCase()}>
      <div className="ecosystem-heading">
        <h2 className="editorial-h2">
          {t.eco_h2_1}<br />
          <span className="problem-h2-highlight">{t.eco_h2_2}</span>
        </h2>
      </div>

      {/* Layered Stack */}
      <div className="ecosystem-stack">
        {t.eco_layers.map((l, i) => (
          <div key={l.label} className="layer-row-card">
            <div className="layer-row-header">
              <span className="layer-step-num">0{i + 1}</span>
              <strong className="layer-title">{l.label}</strong>
            </div>

            <div className="layer-row-body">
              <div className="layer-items-grid">
                {l.items.map((item) => (
                  <span key={item} className="layer-pill">{item}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Bhashini Dedicated Block */}
      <div className="ecosystem-bhashini-block" style={{ marginTop: '4rem', padding: '2.5rem', background: 'var(--surface-sunken)', borderRadius: '1rem', border: '1px solid var(--border-light)' }}>
        <h3 className="editorial-h3" style={{ marginBottom: '1rem' }}>{t.eco_bhashini_h3}</h3>
        <p className="body-lg" style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>{t.eco_bhashini_body}</p>
        <div className="bhashini-flow-visual" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          {t.eco_bhashini_flow.map((step, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="layer-pill" style={{ background: 'var(--surface-raised)' }}>{step}</span>
              {idx < t.eco_bhashini_flow.length - 1 && <span style={{ color: 'var(--text-tertiary)' }}>→</span>}
            </div>
          ))}
        </div>
      </div>
    </SectionBase>
  );
}
