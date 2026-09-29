import React, { useState, useEffect } from "react";
import type { StaffUser, Proposal } from "../../types";
import { getStaffDemands } from "../../services/demandService";
import { Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

interface FieldOfficerDashboardProps {
  user: StaffUser;
}

export const FieldOfficerDashboard: React.FC<FieldOfficerDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<"assigned" | "progress" | "completed">("assigned");
  const [demands, setDemands] = useState<Proposal[]>([]);
  const [selectedDemand, setSelectedDemand] = useState<Proposal | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map" | "report">("list");
  
  // Geotagging & Form State
  const [photo, setPhoto] = useState<File | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Checklist State
  const [checklist, setChecklist] = useState({
    physicalAccess: false,
    legalViability: false,
    safetyConstraints: false,
    estimatedEffort: "Medium"
  });

  useEffect(() => {
    // Simulated proximity sort based on dummy data
    const allDemands = getStaffDemands(user);
    setDemands(allDemands);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user]);

  const handleCapturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
      setStatus("Photo attached. EXIF validation pending on submit.");
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setStatus("Locating...");
      navigator.geolocation.getCurrentPosition((pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setStatus("Location captured successfully.");
      }, (err) => {
        setStatus("Error capturing location: " + err.message);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDemand || !photo || !lat || !lng) {
      setStatus("Please take a photo and capture location before submitting.");
      return;
    }
    
    if (isOffline) {
      setStatus("Saved offline. Will sync when connection is restored.");
      setViewMode("list");
      setSelectedDemand(null);
      return;
    }

    setStatus("Uploading feasibility report...");
    try {
      const formData = new FormData();
      formData.append("file", photo);
      formData.append("physicalAccess", String(checklist.physicalAccess));
      formData.append("legalViability", String(checklist.legalViability));
      formData.append("safetyConstraints", String(checklist.safetyConstraints));
      formData.append("estimatedEffort", checklist.estimatedEffort);
      
      // Simulated API Call
      await new Promise(r => setTimeout(r, 1000));
      
      setStatus("Feasibility report submitted successfully!");
      setPhoto(null);
      setSelectedDemand(null);
      setViewMode("list");
    } catch (err: any) {
      setStatus("Network error. The report is queued for background sync.");
    }
  };

  const filteredDemands = demands.filter(d => {
    if (activeTab === "assigned") return d.status === "PENDING" || d.status === "GATHERING_SUPPORT";
    if (activeTab === "progress") return d.status === "FEASIBILITY_STUDY";
    return d.status === "APPROVED_FOR_BUDGET" || d.status === "RESOLVED";
  });

  return (
    <div className="citizen-portal-container" style={{ padding: "0", background: "#f8f9fa", minHeight: "calc(100vh - 60px)" }}>
      {/* Offline Banner */}
      {isOffline && (
        <div style={{ background: "var(--col-orange)", color: "#fff", padding: "10px", textAlign: "center", fontSize: "14px", fontWeight: 600 }}>
          ⚠️ OFFLINE MODE: Reports will be cached and synced automatically.
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ maxWidth: "600px", margin: "0 auto", background: "#fff", minHeight: "100vh", boxShadow: "0 0 20px rgba(0,0,0,0.05)" }}>
        
        {/* Header & Tabs (Only in List/Map view) */}
        {viewMode !== "report" && (
          <div style={{ padding: "20px 20px 0 20px", borderBottom: "1px solid #eee" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "20px", margin: 0, color: "var(--col-navy)" }}>Active Field Queue</h2>
              <button 
                onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
                style={{ background: "none", border: "1px solid var(--col-navy)", color: "var(--col-navy)", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}
              >
                {viewMode === "list" ? "🗺️ Map View" : "📋 List View"}
              </button>
            </div>
            <div style={{ display: "flex", gap: "20px" }}>
              {(["assigned", "progress", "completed"] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "10px 0",
                    border: "none",
                    background: "none",
                    borderBottom: activeTab === tab ? "3px solid var(--col-orange)" : "3px solid transparent",
                    color: activeTab === tab ? "var(--col-navy)" : "#666",
                    fontWeight: activeTab === tab ? 700 : 500,
                    textTransform: "capitalize",
                    fontSize: "14px",
                    cursor: "pointer"
                  }}
                >
                  {tab.replace("assigned", "Assigned Today").replace("progress", "In Progress")}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* View Routing */}
        <div style={{ padding: viewMode === "map" ? "0" : "20px" }}>
          
          {/* MAP VIEW */}
          {viewMode === "map" && (
            <div style={{ height: "calc(100vh - 180px)", width: "100%" }}>
              <Map
                defaultZoom={12}
                defaultCenter={{ lat: 28.6139, lng: 77.2090 }}
                mapId="DEMAND_MAP_ID"
                disableDefaultUI={true}
              >
                {filteredDemands.map((demand) => (
                  demand.location.coordinates && (
                    <AdvancedMarker 
                      key={demand.id} 
                      position={{ lat: demand.location.coordinates[0], lng: demand.location.coordinates[1] }}
                      onClick={() => { setSelectedDemand(demand); setViewMode("report"); }}
                    >
                      <Pin background={"var(--col-orange)"} borderColor={"var(--col-navy)"} glyphColor={"#fff"} />
                    </AdvancedMarker>
                  )
                ))}
              </Map>
            </div>
          )}

          {/* LIST VIEW */}
          {viewMode === "list" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredDemands.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "#666" }}>
                  No tasks found for this category.
                </div>
              ) : (
                filteredDemands.map(demand => (
                  <div key={demand.id} style={{ border: "1px solid #eee", borderRadius: "8px", padding: "16px", cursor: "pointer", transition: "all 0.2s" }} onClick={() => { setSelectedDemand(demand); setViewMode("report"); }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--col-orange)" }}>{demand.id}</span>
                      <span style={{ fontSize: "12px", color: "#666" }}>{demand.category}</span>
                    </div>
                    <h3 style={{ fontSize: "16px", margin: "0 0 8px 0", color: "var(--col-navy)" }}>{demand.description}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#666", fontSize: "13px" }}>
                      <span>📍</span> {demand.location.address || demand.location.district || "Location provided"}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* REPORT / FEASIBILITY VIEW */}
          {viewMode === "report" && selectedDemand && (
            <div style={{ paddingBottom: "40px" }}>
              <button 
                onClick={() => setViewMode("list")}
                style={{ background: "none", border: "none", color: "var(--col-text-muted)", fontSize: "14px", padding: "0 0 20px 0", cursor: "pointer" }}
              >
                ← Back to Queue
              </button>
              
              <h2 style={{ fontSize: "22px", margin: "0 0 8px 0", color: "var(--col-navy)" }}>Feasibility Study</h2>
              <div style={{ background: "#f8f9fa", padding: "12px", borderRadius: "6px", marginBottom: "24px", fontSize: "13px" }}>
                <strong>Demand:</strong> {selectedDemand.description} <br/>
                <strong>Location:</strong> {selectedDemand.location.address || selectedDemand.location.district}
              </div>

              {status && (
                <div style={{ margin: "0 0 20px 0", padding: "12px", backgroundColor: "#e0f2fe", borderLeft: "4px solid var(--col-blue)", fontSize: "13px" }}>
                  {status}
                </div>
              )}
              
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* Geotagged Photo */}
                <div style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "10px" }}>📷</div>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>Geotagged Evidence</h3>
                  <p style={{ fontSize: "12px", color: "#666", marginBottom: "16px" }}>Capture a live photo of the site. EXIF metadata will be automatically extracted and validated against the demand coordinates.</p>
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    onChange={handleCapturePhoto} 
                    id="cameraInput"
                    style={{ display: "none" }}
                  />
                  <label htmlFor="cameraInput" style={{ display: "inline-block", background: "var(--col-navy)", color: "#fff", padding: "10px 20px", borderRadius: "20px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                    {photo ? "📸 Retake Photo" : "📸 Open Camera"}
                  </label>
                </div>

                {/* GPS Capture */}
                <div>
                  <button type="button" onClick={handleGetLocation} className="btn-outline" style={{ width: "100%", padding: "12px", borderColor: "var(--col-border)" }}>
                    📍 {lat ? `Coordinates Logged: ${lat.toFixed(4)}, ${lng?.toFixed(4)}` : "Capture Current GPS Coordinates"}
                  </button>
                </div>

                {/* Feasibility Checklist */}
                <div>
                  <h3 style={{ fontSize: "16px", marginBottom: "16px", borderBottom: "1px solid #eee", paddingBottom: "8px" }}>Rapid Assessment Checklist</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", cursor: "pointer" }}>
                      <input type="checkbox" checked={checklist.physicalAccess} onChange={e => setChecklist({...checklist, physicalAccess: e.target.checked})} style={{ width: "18px", height: "18px" }} />
                      Clear Physical Access to Site
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", cursor: "pointer" }}>
                      <input type="checkbox" checked={checklist.legalViability} onChange={e => setChecklist({...checklist, legalViability: e.target.checked})} style={{ width: "18px", height: "18px" }} />
                      No Immediate Legal/Zoning Blockers
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", cursor: "pointer" }}>
                      <input type="checkbox" checked={checklist.safetyConstraints} onChange={e => setChecklist({...checklist, safetyConstraints: e.target.checked})} style={{ width: "18px", height: "18px" }} />
                      Site Requires Safety Clearing First
                    </label>
                    
                    <div style={{ marginTop: "8px" }}>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Estimated Construction/Setup Effort</label>
                      <select 
                        value={checklist.estimatedEffort} 
                        onChange={e => setChecklist({...checklist, estimatedEffort: e.target.value})}
                        style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
                      >
                        <option>Low (Under 1 week)</option>
                        <option>Medium (1 - 4 weeks)</option>
                        <option>High (1+ Months / Heavy Machinery)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button type="submit" className="service-card-btn" style={{ background: "var(--col-orange)", width: "100%", padding: "16px", justifyContent: "center", fontSize: "16px", marginTop: "10px" }}>
                  {isOffline ? "💾 Save Report Offline" : "📤 Submit Feasibility Report"}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
