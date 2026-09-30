import React, { useState, useEffect, useRef } from "react";
import { auth } from "../config/firebase";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface ExecutionTask {
  id: string;
  category: string;
  english_translation?: string;
  description?: string;
  original_text?: string;
  location?: { address?: string; district?: string };
  address?: string;
  vote_count: number;
  feasibility_report?: {
    estimated_effort?: string;
  };
  allocated_budget?: number;
}

import type { StaffUser } from "../../types";

export const PolicyDashboard: React.FC<{ user: StaffUser }> = ({ user }) => {
  const [metrics, setMetrics] = useState({
    total_demands: 0,
    top_domain: "N/A",
    avg_severity: 0,
  });
  const [mapSignals, setMapSignals] = useState<any[]>([]);
  const [executionQueue, setExecutionQueue] = useState<ExecutionTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Enact Modal State
  const [selectedTask, setSelectedTask] = useState<ExecutionTask | null>(null);
  const [allocationAmount, setAllocationAmount] = useState<number>(0);
  const [executionNotes, setExecutionNotes] = useState("");
  const [enactStatus, setEnactStatus] = useState("");

  const mapRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onIdTokenChanged((user) => {
      if (user) {
        fetchAllData();
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const headers = { "Authorization": `Bearer ${token}` };
      
      const [metricsRes, mapRes, queueRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/policy/metrics`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/policy/map-signals`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/policy/execution/queue`, { headers })
      ]);
      
      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (mapRes.ok) setMapSignals((await mapRes.json()).signals || []);
      if (queueRes.ok) setExecutionQueue((await queueRes.json()).queue || []);
      
    } catch (err) {
      console.error("Failed to fetch policy data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || allocationAmount <= 0) return;
    
    setEnactStatus("Processing allocation...");
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/policy/execution/${selectedTask.id}/enact`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          allocated_amount: allocationAmount,
          execution_notes: executionNotes
        })
      });
      
      if (res.ok) {
        setEnactStatus("Project successfully enacted!");
        setTimeout(() => {
          setSelectedTask(null);
          setEnactStatus("");
          setAllocationAmount(0);
          setExecutionNotes("");
          fetchAllData();
        }, 1500);
      } else {
        const data = await res.json();
        setEnactStatus(`Error: ${data.error}`);
      }
    } catch (err) {
      setEnactStatus("Network error during allocation.");
    }
  };

  // Map Centering
  useEffect(() => {
    if (mapRef.current && mapSignals.length > 0) {
      // @ts-ignore
      const bounds = window.L?.latLngBounds(mapSignals.map(s => [s.lat, s.lng]));
      if (bounds?.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [mapSignals]);

  return (
    <div className="citizen-portal-container" style={{ padding: "0", background: "#f8f9fa", minHeight: "calc(100vh - 60px)" }}>
      {/* We rely on StaffNavbar for the top header. Just a localized toolbar here. */}
      <div style={{ padding: "16px 24px", background: "#fff", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", color: "var(--col-navy)", textTransform: "uppercase" }}>{user.district_display_name ? `${user.district_display_name} JURISDICTION COVERAGE` : 'GLOBAL COVERAGE'}</h2>
          <span style={{ fontSize: "13px", color: "var(--col-text-muted)" }}>Live Intelligence & Budget Execution</span>
        </div>
        <div>
          <button 
            className="btn-outline"
            onClick={fetchAllData}
            disabled={loading}
            style={{ padding: "8px 16px", fontSize: "14px", borderColor: "var(--col-navy)", color: "var(--col-navy)" }}
          >
            {loading ? "Syncing..." : "🔄 Refresh Intelligence"}
          </button>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Top Metrics Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <div style={{ fontSize: "13px", color: "#666", fontWeight: 600 }}>Total Verified Demands</div>
            <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--col-navy)", marginTop: "8px" }}>{metrics.total_demands}</div>
          </div>
          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <div style={{ fontSize: "13px", color: "#666", fontWeight: 600 }}>Top Demanded Infrastructure</div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--col-orange)", marginTop: "12px", textTransform: "capitalize" }}>{metrics.top_domain}</div>
          </div>
          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <div style={{ fontSize: "13px", color: "#666", fontWeight: 600 }}>Avg Severity Score</div>
            <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--col-red)", marginTop: "8px" }}>{metrics.avg_severity.toFixed(1)} / 10</div>
          </div>
        </div>

        {/* Map & Execution Queue Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
          
          {/* Spatial Heatmap */}
          <div style={{ background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", height: "600px", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #eee", background: "#f8f9fa" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "var(--col-navy)" }}>Live Spatial Heatmap</h3>
              <div style={{ fontSize: "12px", color: "#666" }}>Weighted by community support velocity</div>
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              <MapContainer
                center={[28.6139, 77.2090]}
                zoom={11}
                style={{ height: "100%", width: "100%" }}
                ref={mapRef}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {mapSignals.map((signal, idx) => (
                  <CircleMarker
                    key={idx}
                    center={[signal.lat, signal.lng]}
                    radius={Math.min(30, Math.max(10, signal.weight * 2))}
                    pathOptions={{ 
                      fillColor: "var(--col-red)", 
                      fillOpacity: Math.min(0.8, signal.weight * 0.1),
                      color: "none"
                    }}
                  >
                    <Popup>Signal Weight: {signal.weight}</Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Project Execution Queue */}
          <div style={{ background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #eee", background: "#f8f9fa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", color: "var(--col-navy)" }}>Project Execution Queue</h3>
                <div style={{ fontSize: "12px", color: "#666" }}>Ready for final budget allocation</div>
              </div>
              <div style={{ background: "var(--col-green)", color: "#fff", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 700 }}>
                {executionQueue.length} Pending
              </div>
            </div>
            
            <div style={{ padding: "20px", maxHeight: "530px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
              {executionQueue.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>No projects currently waiting for execution.</div>
              ) : (
                executionQueue.map(task => (
                  <div key={task.id} style={{ border: "1px solid #eee", borderRadius: "8px", padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <span style={{ background: "#e0f2fe", color: "var(--col-blue)", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                        {task.category}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--col-orange)" }}>
                        {task.vote_count} Votes
                      </span>
                    </div>
                    
                    <h4 style={{ margin: "0 0 8px 0", fontSize: "15px", color: "var(--col-navy)" }}>
                      {task.english_translation || task.description || task.original_text}
                    </h4>
                    
                    <div style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
                      <strong>Field Est. Effort:</strong> {task.feasibility_report?.estimated_effort || "Medium"} <br/>
                      <strong>Location:</strong> {task.location?.address || task.location?.district || task.address}
                    </div>

                    <button 
                      onClick={() => setSelectedTask(task)}
                      style={{ width: "100%", background: "var(--col-navy)", color: "#fff", border: "none", padding: "10px", borderRadius: "6px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
                    >
                      Allocate Budget & Enact
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enact Modal Overlay */}
      {selectedTask && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: "500px", borderRadius: "12px", overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "var(--col-navy)" }}>Enact Policy & Allocate Budget</h3>
              <button onClick={() => setSelectedTask(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#666" }}>×</button>
            </div>
            
            <form onSubmit={handleEnact} style={{ padding: "20px" }}>
              <div style={{ background: "#f8f9fa", padding: "12px", borderRadius: "6px", fontSize: "13px", marginBottom: "20px" }}>
                <strong>Project:</strong> {selectedTask.english_translation || selectedTask.description || selectedTask.original_text}
              </div>

              {enactStatus && (
                <div style={{ margin: "0 0 20px 0", padding: "12px", backgroundColor: "#e0f2fe", borderLeft: "4px solid var(--col-blue)", fontSize: "13px" }}>
                  {enactStatus}
                </div>
              )}

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Allocated Amount (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  value={allocationAmount || ""}
                  onChange={e => setAllocationAmount(Number(e.target.value))}
                  style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "16px" }}
                  placeholder="e.g. 1500000"
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Execution Mandate / Notes</label>
                <textarea 
                  required
                  value={executionNotes}
                  onChange={e => setExecutionNotes(e.target.value)}
                  style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #ddd", minHeight: "80px", fontFamily: "inherit" }}
                  placeholder="e.g. Approved for immediate contractor deployment. Q3 FY24 allocation."
                />
              </div>

              <button type="submit" style={{ width: "100%", padding: "16px", background: "var(--col-orange)", color: "#fff", border: "none", borderRadius: "6px", fontSize: "16px", fontWeight: 700, cursor: "pointer" }}>
                Confirm Allocation & Enact
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

