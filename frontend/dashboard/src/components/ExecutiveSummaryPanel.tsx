import type { DashboardSummary } from "../types";

interface ExecutiveSummaryPanelProps {
  summary: DashboardSummary | null;
  loading: boolean;
}

export function ExecutiveSummaryPanel({ summary, loading }: ExecutiveSummaryPanelProps) {
  if (loading) {
    return (
      <aside className="panel executive-panel">
        <h2>INTELLIGENCE SUMMARY</h2>
        <p className="summary-text">Generating analysis…</p>
      </aside>
    );
  }

  if (!summary) {
    return (
      <aside className="panel executive-panel">
        <h2>INTELLIGENCE SUMMARY</h2>
        <p className="summary-text">No data available.</p>
      </aside>
    );
  }

  const stats = summary.weekly_stats;

  return (
    <aside className="panel executive-panel">
      <h2>INTELLIGENCE SUMMARY</h2>
      <p className="summary-text">{summary.executive_summary}</p>

      <div className="stat-grid">
        <StatCard label="Total Signals" value={stats.total_complaints.toLocaleString()} />
        <StatCard label="Top Domain" value={stats.top_domain} />
        <StatCard label="Avg Severity" value={stats.avg_severity.toFixed(1)} />
        <StatCard label="Red Zones" value={String(stats.red_zone_count)} accent />
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
