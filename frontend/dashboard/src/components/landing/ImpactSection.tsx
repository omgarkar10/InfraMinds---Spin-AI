import { useLanguage } from "../../hooks/useLanguage";
import { SectionBase } from "./SectionBase";
import "./ImpactSection.css";

export function ImpactSection() {
  const { t } = useLanguage();

  return (
    <SectionBase id="impact" number="10" label={t.impact_label.toUpperCase()}>
      <div className="impact-heading">
        <h2 className="editorial-h2">
          {t.impact_h2_1}<br />
          <span className="problem-h2-highlight">{t.impact_h2_2}</span>
        </h2>
        <span className="demo-badge">[ {t.impact_demo_badge} ]</span>
      </div>

      <div className="impact-levels-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginTop: '4rem' }}>
        {t.impact_metrics.map((item, i) => (
          <div key={i} className="impact-card" style={{ padding: '2rem', background: 'var(--surface-sunken)', border: '1px solid var(--border-light)', borderRadius: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{item.value}</div>
            <div className="label-eyebrow" style={{ color: 'var(--text-secondary)' }}>{item.label}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>{item.sub}</div>
          </div>
        ))}
      </div>
    </SectionBase>
  );
}
