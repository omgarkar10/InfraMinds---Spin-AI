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
        <h2>{t.dash_summary_title}</h2>
        <p className="summary-text">...</p>
      </aside>
    );
  }

  if (!summary) {
    return (
      <aside className="panel executive-panel">
        <h2>{t.dash_summary_title}</h2>
        <p className="summary-text">No data available.</p>
      </aside>
    );
  }

  const stats = summary.weekly_stats;

  return (
    <aside className="panel executive-panel">
      <h2>{t.dash_summary_title}</h2>
      <p className="summary-text">{summary.executive_summary}</p>

      <div className="stat-grid">
        <StatCard label={t.dash_signals} value={stats.total_complaints.toLocaleString()} />
        <StatCard label={t.dash_top_domain} value={stats.top_domain} />
        <StatCard label={t.dash_avg_severity} value={stats.avg_severity.toFixed(1)} />
        <StatCard label={t.dash_red_zones} value={String(stats.red_zone_count)} accent />
      </div>
    </aside>
  );
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`stat-card${accent ? " accent" : ""}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}
