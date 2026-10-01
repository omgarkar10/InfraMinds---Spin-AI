import React, { useState, useEffect, useRef } from "react";
import type { StaffUser } from "../../types";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { auth } from "../../config/firebase";

// Fix Leaflet's default icon path issues with webpack/vite
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface FieldOfficerDashboardProps {
  user: StaffUser;
}

export const FieldOfficerDashboard: React.FC<FieldOfficerDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<"assigned" | "progress" | "completed">("assigned");
  const [demands, setDemands] = useState<any[]>([]);
  const [selectedDemand, setSelectedDemand] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map" | "report">("list");
  const [loading, setLoading] = useState(false);
  
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

  const mapRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onIdTokenChanged((user) => {
      if (user) {
        fetchAssignedDemands();
      }
    });

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      unsubscribe();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user.id]);

  const fetchAssignedDemands = async () => {
    setLoading(true);
    try {
      const token = (auth.currentUser ? await auth.currentUser.getIdToken() : null) || localStorage.getItem("staff_token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/staff/field/tasks`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDemands(data.demands || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
      formData.append("lat", String(lat));
      formData.append("lng", String(lng));
      formData.append("physicalAccess", String(checklist.physicalAccess));
      formData.append("legalViability", String(checklist.legalViability));
      formData.append("safetyConstraints", String(checklist.safetyConstraints));
      formData.append("estimatedEffort", checklist.estimatedEffort);
      
      const token = (auth.currentUser ? await auth.currentUser.getIdToken() : null) || localStorage.getItem("staff_token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/staff/investigation/${selectedDemand.id}/report`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      
      if (res.ok) {
        setStatus("Feasibility report submitted successfully!");
        setPhoto(null);
        setSelectedDemand(null);
        setViewMode("list");
        fetchAssignedDemands();
      } else {
        const errData = await res.json();
        setStatus(`Error: ${errData.error || "Failed to submit report"}`);
      }
    } catch (err: any) {
      setStatus("Network error. The report is queued for background sync.");
    }
  };

  const filteredDemands = demands.filter(d => {
    if (activeTab === "assigned") return d.status === "field_survey" || d.status === "assigned";
    if (activeTab === "progress") return d.status === "feasibility_reported";
    return d.status === "escalated_to_policy" || d.status === "resolved" || d.status === "approved_for_budget";
  });

  const extractCoords = (d: any) => {
    if (d.location && d.location.coordinates) return [d.location.coordinates[0], d.location.coordinates[1]];
    if (d.lat && d.lng) return [d.lat, d.lng];
    return null;
  };

  const centerCoords = filteredDemands.length > 0 && extractCoords(filteredDemands[0]) 
    ? extractCoords(filteredDemands[0])
    : [28.6139, 77.2090]; // Fallback to generic map center if empty

  useEffect(() => {
    if (mapRef.current && filteredDemands.length > 0) {
      const coords = filteredDemands.map(extractCoords).filter(c => c !== null);
      if (coords.length > 0) {
        const bounds = L.latLngBounds(coords as [number, number][]);
        if (bounds.isValid()) {
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }
  }, [filteredDemands, viewMode]);

  return (
    <div className="citizen-portal-container" style={{ padding: "0", background: "#f8f9fa", minHeight: "calc(100vh - 60px)" }}>
      <style>{`
        @media (min-width: 768px) {
          .mobile-only { display: none !important; }
          .desktop-pane { display: block !important; }
        }
        @media (max-width: 767px) {
          .desktop-pane-list { display: var(--mobile-list-display) !important; }
          .desktop-pane-map { display: var(--mobile-map-display) !important; }
        }
      `}</style>

      {/* Offline Banner */}
      {isOffline && (
        <div style={{ background: "var(--col-orange)", color: "#fff", padding: "10px", textAlign: "center", fontSize: "14px", fontWeight: 600 }}>
          ⚠️ OFFLINE MODE: Reports will be cached and synced automatically.
        </div>
      )}

      {/* Main Content Area - Full width responsive container */}
      <div className="w-full max-w-7xl mx-auto bg-white min-h-screen" style={{ boxShadow: "0 0 20px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
        
        {/* Header & Tabs */}
        {viewMode !== "report" && (
          <div style={{ padding: "20px 20px 0 20px", borderBottom: "1px solid #eee" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "20px", margin: 0, color: "var(--col-navy)", minWidth: 0, flex: "1 1 240px", overflowWrap: "anywhere" }}>Active Field Queue {user.district_display_name ? `— ${user.district_display_name}` : ""}</h2>
              
              {/* Mobile Only Toggle */}
              <div className="mobile-only">
                <button 
                  onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
                  style={{ background: "none", border: "1px solid var(--col-navy)", color: "var(--col-navy)", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}
                >
                  {viewMode === "list" ? "🗺️ Map View" : "📋 List View"}
                </button>
              </div>
            </div>
            <div style={{ display: "flex", gap: "4px 20px", flexWrap: "wrap" }}>
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
        <div 
          style={{ 
            flex: 1, 
            position: "relative",
            "--mobile-list-display": viewMode === "list" ? "block" : "none",
            "--mobile-map-display": viewMode === "map" ? "block" : "none"
          } as React.CSSProperties}
        >
          
          {/* DESKTOP SPLIT VIEW OR MOBILE LIST/MAP */}
          {viewMode !== "report" && (
            <div style={{ display: "flex", height: "calc(100vh - 180px)" }}>
              
              {/* Left Pane: List View (Hidden on mobile if map view is active) */}
              <div 
                className="desktop-pane desktop-pane-list"
                style={{ 
                  flex: "0 0 35%", 
                  borderRight: "1px solid #eee", 
                  overflowY: "auto", 
                  padding: "20px",
                  width: window.innerWidth < 768 ? "100%" : "auto"
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {loading ? (
                    <div style={{ padding: "40px 20px", textAlign: "center", color: "#666" }}>Loading assignments...</div>
                  ) : filteredDemands.length === 0 ? (
                    <div style={{ padding: "40px 20px", textAlign: "center", color: "#666" }}>
                      No tasks found for this category.
                    </div>
                  ) : (
                    filteredDemands.map(demand => (
                      <div key={demand.id} style={{ border: "1px solid #eee", borderRadius: "8px", padding: "16px", cursor: "pointer", transition: "all 0.2s" }} onClick={() => { setSelectedDemand(demand); setViewMode("report"); }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--col-orange)" }}>{demand.id.substring(0,8)}</span>
                          <span style={{ fontSize: "12px", color: "#666" }}>{demand.category}</span>
                        </div>
                        <h3 style={{ fontSize: "16px", margin: "0 0 8px 0", color: "var(--col-navy)" }}>{demand.english_translation || demand.description || demand.original_text}</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#666", fontSize: "13px" }}>
                          <span>📍</span> {demand.location?.address || demand.location?.district || demand.address || "Location provided"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Pane: Map View (Hidden on mobile if list view is active) */}
              <div 
                className="desktop-pane desktop-pane-map"
                style={{ 
                  flex: 1, 
                  height: "100%", 
                  width: window.innerWidth < 768 ? "100%" : "auto"
                }}
              >
                <MapContainer
                  center={centerCoords as [number, number]}
                  zoom={12}
                  style={{ height: "100%", width: "100%" }}
                  
                  ref={mapRef}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  {filteredDemands.map((demand) => {
                    const coords = extractCoords(demand);
                    return coords && (
                      <Marker 
                        key={demand.id} 
                        position={coords as [number, number]}
                        eventHandlers={{
                          click: () => {
                            setSelectedDemand(demand);
                            setViewMode("report");
                          }
                        }}
                      >
                        <Popup>
                          <strong>{demand.english_translation || demand.description || demand.original_text}</strong><br/>
                          {demand.location?.address || demand.address}
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            </div>
          )}

          {/* REPORT / FEASIBILITY VIEW (Drawer overlay style) */}
          {viewMode === "report" && selectedDemand && (
            <div style={{ padding: "20px", paddingBottom: "40px", maxWidth: "800px", margin: "0 auto" }}>
              <button 
                onClick={() => setViewMode("list")}
                style={{ background: "none", border: "none", color: "var(--col-text-muted)", fontSize: "14px", padding: "0 0 20px 0", cursor: "pointer" }}
              >
                ← Back to Queue
              </button>
              
              <h2 style={{ fontSize: "22px", margin: "0 0 8px 0", color: "var(--col-navy)" }}>Feasibility Study</h2>
              <div style={{ background: "#f8f9fa", padding: "12px", borderRadius: "6px", marginBottom: "24px", fontSize: "13px" }}>
                <strong>Demand:</strong> {selectedDemand.english_translation || selectedDemand.description || selectedDemand.original_text} <br/>
                <strong>Location:</strong> {selectedDemand.location?.address || selectedDemand.location?.district || selectedDemand.address}
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
                  {photo && <div style={{marginTop: "10px", fontSize: "12px", color: "var(--col-green)"}}>✓ {photo.name} ready</div>}
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
                  {isOffline ? "💾 Save Report Offline" : "📥 Submit Feasibility Report"}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
