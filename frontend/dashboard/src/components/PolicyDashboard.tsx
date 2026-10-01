import { useState, useEffect } from "react";
import type { StaffUser } from "../types";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { auth } from "../config/firebase";

interface PolicyDashboardProps {
  user: StaffUser;
}

interface Signal {
  lat: number;
  lng: number;
  weight: number;
  title: string;
  category: string;
  votes: number;
  urgency: number;
  demand_id: string;
}

interface QueueItem {
  id: string;
  title: string;
  category: string;
  votes: number;
  severity: string;
  estimated_cost?: number;
  status: string;
}

interface Metrics {
  escalated_count: number;
  approved_for_budget_count: number;
  budget_allocated_inr: number;
  avg_resolution_days: number;
  vote_velocity_trends: number;
}

function HeatmapLayer({ signals }: { signals: Signal[] }) {
  const map = useMap();
  useEffect(() => {
    if (!signals.length) return;
    const points = signals.map(s => [s.lat, s.lng, s.weight * 10]); // Scale weight for visibility
    
    // @ts-ignore
    const heat = L.heatLayer(points, { radius: 25, blur: 15, maxZoom: 17 }).addTo(map);
    
    // Also add invisible markers with tooltips for interactivity
    const markers = signals.map(s => 
      L.circleMarker([s.lat, s.lng], { radius: 10, fillOpacity: 0, opacity: 0 })
        .bindTooltip(`<b>${s.title}</b><br/>Votes: ${s.votes}<br/>Category: ${s.category}`)
        .addTo(map)
    );

    if (signals.length > 0) {
      const group = new L.FeatureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.5));
    }

    return () => {
      map.removeLayer(heat);
      markers.forEach(m => map.removeLayer(m));
    };
  }, [map, signals]);
  return null;
}

export function PolicyDashboard({ user }: PolicyDashboardProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [aiBrief, setAiBrief] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [enactModalOpen, setEnactModalOpen] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<QueueItem | null>(null);
  const [allocatedBudget, setAllocatedBudget] = useState("");
  const [enactNotes, setEnactNotes] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const districtId = user.district_id || "all";

  useEffect(() => {
    fetchDashboardData();
  }, [districtId]);

  const fetchDashboardData = async () => {
    try {
      const token = (auth.currentUser ? await auth.currentUser.getIdToken() : null) || localStorage.getItem("staff_token");
      const headers = { "Authorization": `Bearer ${token}` };
      
      // Parallel fetch for speed
      const [metricsRes, signalsRes, queueRes] = await Promise.all([
        fetch(`${apiUrl}/policy/metrics?district_id=${districtId}`, { headers }),
        fetch(`${apiUrl}/policy/map-signals?district_id=${districtId}`, { headers }),
        fetch(`${apiUrl}/policy/execution/queue?district_id=${districtId}&page=1&limit=20`, { headers })
      ]);
      
      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (signalsRes.ok) {
        const data = await signalsRes.json();
        setSignals(data.signals || []);
      }
      if (queueRes.ok) {
        const data = await queueRes.json();
        setQueue(data.items || data.queue || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateBrief = async () => {
    setIsGenerating(true);
    try {
      const token = (auth.currentUser ? await auth.currentUser.getIdToken() : null) || localStorage.getItem("staff_token");
      const res = await fetch(`${apiUrl}/policy/ai-advisor`, { 
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAiBrief(data.recommendation_markdown);
      }
    } catch (e) {
      console.error(e);
    }
    setIsGenerating(false);
  };

  const openEnactModal = (item: QueueItem) => {
    setSelectedDemand(item);
    setAllocatedBudget("");
    setEnactNotes("");
    setEnactModalOpen(true);
  };

  const submitEnact = async () => {
    if (!selectedDemand) return;
    try {
      const token = (auth.currentUser ? await auth.currentUser.getIdToken() : null) || localStorage.getItem("staff_token");
      const res = await fetch(`${apiUrl}/policy/execution/${selectedDemand.id}/enact`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          allocated_amount: parseFloat(allocatedBudget),
          execution_notes: enactNotes
        })
      });
      if (res.ok) {
        setEnactModalOpen(false);
        fetchDashboardData(); // Refresh queue
      } else {
        alert("Failed to enact policy.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ paddingTop: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
        <div style={{ minWidth: 0, flex: "1 1 320px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--col-navy)", margin: 0, textTransform: "uppercase" }}>POLICYMAKER DASHBOARD</h1>
          <p style={{ color: "var(--col-text-muted)", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
            <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "4px", fontWeight: 600, fontSize: "12px" }}>
              📍 {districtId.toUpperCase()} DISTRICT
            </span>
            Public Infrastructure Intelligence Command Center
          </p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="btn-outline"
        >
          Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div className="panel" style={{ padding: "16px" }}>
          <div style={{ fontSize: "14px", color: "var(--col-text-muted)", fontWeight: 500 }}>Escalated Demands</div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--col-red)", marginTop: "4px" }}>{metrics?.escalated_count || 0}</div>
        </div>
        <div className="panel" style={{ padding: "16px" }}>
          <div style={{ fontSize: "14px", color: "var(--col-text-muted)", fontWeight: 500 }}>Approved / Waiting</div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--col-orange)", marginTop: "4px" }}>{metrics?.approved_for_budget_count || 0}</div>
        </div>
        <div className="panel" style={{ padding: "16px" }}>
          <div style={{ fontSize: "14px", color: "var(--col-text-muted)", fontWeight: 500 }}>Total Allocated (INR)</div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--col-green)", marginTop: "4px" }}>₹{metrics?.budget_allocated_inr?.toLocaleString() || 0}</div>
        </div>
        <div className="panel" style={{ padding: "16px" }}>
          <div style={{ fontSize: "14px", color: "var(--col-text-muted)", fontWeight: 500 }}>Avg Resolution Time</div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--col-blue)", marginTop: "4px" }}>{metrics?.avg_resolution_days || 0} Days</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
        {/* Heatmap Section */}
        <div className="panel" style={{ display: "flex", flexDirection: "column", height: "600px", padding: 0, overflow: "hidden" }}>
          <div className="panel-header" style={{ padding: "16px", borderBottom: "1px solid var(--col-border)" }}>
            <h2 className="panel-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "8px", height: "8px", background: "var(--col-red)", borderRadius: "50%", display: "inline-block" }}></span>
              Live Civic Signals Heatmap
            </h2>
          </div>
          <div style={{ flex: 1, position: "relative", zIndex: 0 }}>
            <MapContainer 
              center={[18.5204, 73.8567]} // Fallback to Pune
              zoom={11} 
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <HeatmapLayer signals={signals} />
            </MapContainer>
          </div>
        </div>

        {/* Right Panel: AI & Queue */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", height: "600px", overflowY: "auto", paddingRight: "8px" }}>
          
          {/* AI Policy Brief Panel */}
          <div className="panel" style={{ padding: 0, overflow: "hidden", border: "1px solid #bae6fd" }}>
            <div style={{ background: "#f0f9ff", padding: "16px", borderBottom: "1px solid #e0f2fe", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontWeight: 600, color: "#075985", margin: 0, fontSize: "16px" }}>Vertex AI Policy Brief</h2>
              <button 
                onClick={handleGenerateBrief}
                disabled={isGenerating}
                style={{ background: "#0284c7", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", fontSize: "13px", fontWeight: 600, cursor: isGenerating ? "not-allowed" : "pointer", opacity: isGenerating ? 0.7 : 1 }}
              >
                {isGenerating ? "Synthesizing..." : "Generate Brief"}
              </button>
            </div>
            <div style={{ padding: "16px", fontSize: "14px", color: "var(--col-navy)", whiteSpace: "pre-wrap", lineHeight: 1.6, maxHeight: "250px", overflowY: "auto" }}>
              {aiBrief ? aiBrief : "Click generate to synthesize millions of data points into a targeted policy brief."}
            </div>
          </div>

          {/* Execution Queue */}
          <div className="panel" style={{ padding: 0, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div className="panel-header" style={{ padding: "16px", borderBottom: "1px solid var(--col-border)", background: "var(--col-panel)" }}>
              <h2 className="panel-title" style={{ margin: 0, fontSize: "16px" }}>Budget Execution Queue</h2>
            </div>
            <div style={{ padding: 0, overflowY: "auto", flex: 1 }}>
              {queue.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--col-text-muted)", fontSize: "14px" }}>No demands pending enactment.</div>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {queue.map(item => (
                    <li key={item.id} style={{ padding: "16px", borderBottom: "1px solid var(--col-border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div style={{ fontWeight: 600, color: "var(--col-navy)", fontSize: "14px" }}>{item.title}</div>
                        <span style={{ background: "#ffedd5", color: "#9a3412", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: 700, marginLeft: "8px", whiteSpace: "nowrap" }}>
                          {item.severity}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                        <div style={{ fontSize: "12px", color: "var(--col-text-muted)", display: "flex", gap: "12px" }}>
                          <span>{item.category}</span>
                          <span style={{ fontWeight: 600 }}>↑ {item.votes} votes</span>
                        </div>
                        <button 
                          onClick={() => openEnactModal(item)}
                          style={{ background: "#eef2ff", color: "#4f46e5", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", cursor: "pointer" }}
                        >
                          Enact
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Enact Modal Overlay */}
      {enactModalOpen && selectedDemand && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: "20px" }}>
          <div className="panel" style={{ width: "100%", maxWidth: "450px", padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "20px", borderBottom: "1px solid var(--col-border)" }}>
              <h3 style={{ margin: 0, fontSize: "20px", color: "var(--col-navy)" }}>Enact Policy & Allocate Budget</h3>
              <p style={{ margin: "4px 0 0 0", color: "var(--col-text-muted)", fontSize: "14px" }}>{selectedDemand.title}</p>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--col-navy)", marginBottom: "6px" }}>Allocated Budget (INR)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--col-text-muted)" }}>₹</span>
                  <input
                    type="number"
                    value={allocatedBudget}
                    onChange={(e) => setAllocatedBudget(e.target.value)}
                    style={{ width: "100%", padding: "10px 10px 10px 30px", border: "1px solid var(--col-border)", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--col-navy)", marginBottom: "6px" }}>Policy Notes (Optional)</label>
                <textarea
                  value={enactNotes}
                  onChange={(e) => setEnactNotes(e.target.value)}
                  style={{ width: "100%", padding: "10px", border: "1px solid var(--col-border)", borderRadius: "6px", fontSize: "14px", resize: "vertical", boxSizing: "border-box" }}
                  rows={3}
                  placeholder="Official notes for the contractor or department..."
                ></textarea>
              </div>
            </div>
            <div style={{ background: "var(--col-panel)", padding: "16px 20px", borderTop: "1px solid var(--col-border)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button 
                onClick={() => setEnactModalOpen(false)}
                className="btn-outline"
                style={{ fontSize: "13px" }}
              >
                Cancel
              </button>
              <button 
                onClick={submitEnact}
                style={{ background: "var(--col-green)", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
              >
                Sign & Enact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
