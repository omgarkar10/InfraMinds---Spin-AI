import type { DashboardSummary } from "../types";
import { useLanguage } from "../hooks/useLanguage";

interface ExecutiveSummaryPanelProps {
  summary: DashboardSummary | null;
  loading: boolean;
}

export function ExecutiveSummaryPanel({ summary, loading }: ExecutiveSummaryPanelProps) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <aside className="panel executive-panel">
        <div className="panel-header">
          <h2 className="panel-title">{t.dash_summary_title}</h2>
          <span className="panel-badge">SYNCING...</span>
        </div>
        <div className="stat-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card skeleton-card">
              <div className="skeleton-line short" />
              <div className="skeleton-line tall" />
            </div>
          ))}
        </div>
        <div className="ai-brief-card skeleton-card" style={{ marginTop: "16px", height: "80px" }}>
          <div className="skeleton-line" />
          <div className="skeleton-line" style={{ width: "70%" }} />
        </div>
      </aside>
    );
  }

  if (!summary) {
    return (
      <aside className="panel executive-panel">
        <div className="panel-header">
          <h2 className="panel-title">{t.dash_summary_title}</h2>
        </div>
        <div className="empty-intelligence-box">
          <span className="empty-icon">📡</span>
          <div className="empty-title">NO LIVE INTELLIGENCE</div>
          <div className="empty-desc">
            No citizen grievances recorded yet. Submit a report through the Citizen Portal to populate live intelligence.
          </div>
        </div>
      </aside>
    );
  }

  const stats = summary.weekly_stats;
  const hasNoComplaints = stats.total_complaints === 0;

  return (
    <aside className="panel executive-panel">
      <div className="panel-header">
        <h2 className="panel-title">INTELLIGENCE SUMMARY</h2>
        <span className="panel-badge">LIVE GIS FEED</span>
      </div>

      {/* 2 x 2 Information Grid */}
      <div className="stat-grid">
        <StatCard
          label="TOTAL SIGNALS"
          value={stats.total_complaints.toLocaleString()}
          subtext="Logged complaints"
        />
        <StatCard
          label="TOP DOMAIN"
          value={stats.top_domain}
          subtext="Highest frequency"
        />
        <StatCard
          label="AVG SEVERITY"
          value={stats.avg_severity > 0 ? stats.avg_severity.toFixed(1) : "0.0"}
          subtext="Out of 10.0 scale"
        />
        <StatCard
          label="RED ZONES"
          value={String(stats.red_zone_count)}
          subtext="Critical spatial clusters"
          accent={stats.red_zone_count > 0}
        />
      </div>

      {/* AI Situation Brief */}
      <div className="ai-brief-card">
        <div className="ai-brief-header">
          <span className="ai-brief-tag">⚡ AI SITUATION BRIEF</span>
          <span className="ai-brief-source">SPIN GEOSPATIAL ENGINE</span>
        </div>
        {hasNoComplaints ? (
          <p className="summary-text empty">
            No citizen grievances recorded yet. Submit a report through the Citizen Portal to trigger automated spatial correlation and AI situation briefings.
          </p>
        ) : (
          <p className="summary-text">{summary.executive_summary}</p>
        )}
      </div>
    </aside>
  );
}

function StatCard({
  label,
  value,
  subtext,
  accent = false,
}: {
  label: string;
  value: string;
  subtext?: string;
  accent?: boolean;
}) {
  return (
    <div className={`stat-card${accent ? " accent" : ""}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {subtext && <span className="stat-subtext">{subtext}</span>}
    </div>
  );
}

