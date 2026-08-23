import { useLanguage } from "../../hooks/useLanguage";
import { SectionBase } from "./SectionBase";
import "./GeospatialSection.css";

export function GeospatialSection() {
  const { t } = useLanguage();

  return (
    <SectionBase id="spatial" number="06" label={t.geo_label.toUpperCase()}>
      <div className="geo-layout">
        {/* Title */}
        <div className="geo-heading">
          <h2 className="editorial-h2">
            {t.geo_h2_1}<br />
            <span className="problem-h2-highlight">{t.geo_h2_2}</span>
          </h2>
        </div>

        <div className="geo-grid">
          {/* Left Column: Red Zone Breakdown Card */}
          <div className="redzone-spec-card">
            <div className="redzone-card-header">
              <span className="tag-red-badge">🔴 {t.geo_redzone}</span>
              <span className="provenance-tag">PUNE EAST / WARD 14</span>
            </div>

            <div className="redzone-stats-grid">
              {t.geo_data_rows.map((row, i) => (
                <div key={i} className="stat-box">
                  <span className="label-eyebrow">{row[0]}</span>
                  <span className={`stat-text ${i === 2 ? "num-large num-orange" : i === 3 ? "bold" : i === 4 ? "red-text" : ""}`}>
                    {row[1]}
                  </span>
                </div>
              ))}
            </div>

            {/* AI Recommendation */}
            <div className="ai-rec-box">
              <span className="label-eyebrow tag-orange">AI {t.geo_rec_label.toUpperCase()}</span>
              <h4 className="rec-heading">"{t.geo_rec_action}"</h4>
              <span className="rec-amount">Budget Allocation: {t.geo_rec_amount}</span>
              <span className="status-pending">● {t.geo_pending}</span>
            </div>
            
            <p className="body-sm" style={{ marginTop: '2rem', color: 'var(--text-tertiary)' }}>{t.geo_redzone_def}</p>
          </div>
        </div>
      </div>
    </SectionBase>
  );
}
