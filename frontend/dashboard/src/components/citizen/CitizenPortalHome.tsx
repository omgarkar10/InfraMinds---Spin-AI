import React, { useState, useEffect } from "react";
import "../../styles/citizen.css";
import type { CitizenUser } from "../../types";
import { fetchDemands, castVote } from "../../services/demandService";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function ChangeMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

interface CitizenPortalHomeProps {
  user: CitizenUser;
  onNavigate: (view: string, id?: string) => void;
}

export const CitizenPortalHome: React.FC<CitizenPortalHomeProps> = ({ user, onNavigate }) => {
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Trending");
  const [contextLocation, setContextLocation] = useState("All");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  const handleVote = async (e: React.MouseEvent, demandId: string) => {
    e.stopPropagation();
    if (votedIds.has(demandId)) return;
    try {
      await castVote(demandId);
      setVotedIds(prev => new Set(prev).add(demandId));
      setDemands(prev => prev.map(d => {
        if ((d.id || d.Demand_id) === demandId) {
          return { ...d, votes: (d.votes || 0) + 1 };
        }
        return d;
      }));
    } catch (err) {
      console.error("Vote failed", err);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetchDemands();
        setDemands(res.demands || (Array.isArray(res) ? res : []));
      } catch (err) {
        console.error("Failed to fetch demands for feed", err);
      } finally {
        setLoading(false);
      }
    }
    load();

    // Ask for location on load
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn("Geolocation denied or error", error);
        }
      );
    }
  }, [user.isLoggedIn]);

  return (
    <div className="citizen-portal-container">
      <div className="portal-header-bar">
        <div className="container portal-header-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
           <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
             <button className="navbar-logo notranslate" onClick={() => onNavigate("landing")} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
               <span className="navbar-wordmark" style={{ fontSize: "28px", color: "var(--col-brand-blue)", fontWeight: 900, letterSpacing: "-1px" }}>SPIN</span>
             </button>
             <div className="portal-title-group" style={{ borderLeft: "1px solid #ddd", paddingLeft: "24px" }}>
                <h1 className="portal-heading" style={{ fontSize: "24px" }}>Public Demands Feed</h1>
                <p className="portal-subtext" style={{ fontSize: "13px" }}>Discover and support infrastructure proposals in your community.</p>
             </div>
           </div>
           <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
             <button className="service-card-btn service-card-btn-orange" onClick={() => onNavigate("citizen-raise")}>
               + Propose New Demand
             </button>
             {user?.isLoggedIn && (
               <>
                 <button className="btn-outline" onClick={() => onNavigate("citizen-profile")} style={{ padding: "6px 12px", fontSize: "12px", background: "white" }}>
                   👤 My Profile
                 </button>
                 <button className="btn-outline" onClick={() => onNavigate("citizen-logout")} style={{ padding: "6px 12px", fontSize: "12px", background: "white" }}>
                   Log Out
                 </button>
               </>
             )}
           </div>
        </div>
      </div>

      <div className="citizen-feed-container container" style={{ marginTop: "24px" }}>
        <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <strong>Location Filter:</strong>
          <select value={contextLocation} onChange={e => setContextLocation(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}>
            <option value="All">All Regions</option>
            <option value="My Ward">My Ward</option>
            <option value="My District">My District</option>
          </select>
        </div>
        
        <div className="feed-layout citizen-feed-grid">
          
          {/* Feed List */}
          <div className="feed-list" style={{ overflowY: "auto", paddingRight: "8px" }}>
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px", borderBottom: "1px solid #eee", paddingBottom: "8px" }}>
               {['Trending', 'Top Voted', 'Most Recent', 'Category'].map(tab => (
                 <button 
                   key={tab} 
                   onClick={() => setActiveTab(tab)}
                   style={{ 
                     background: "none", 
                     border: "none", 
                     fontWeight: activeTab === tab ? "bold" : "normal",
                     color: activeTab === tab ? "var(--col-navy)" : "#666",
                     cursor: "pointer"
                   }}
                 >
                   {tab}
                 </button>
               ))}
            </div>

            {loading ? (
              <p>Loading demands...</p>
            ) : demands.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", background: "#f9f9f9", borderRadius: "8px" }}>
                 <p>No active demands found for this location.</p>
                 <button className="btn-outline" style={{ marginTop: "12px" }} onClick={() => onNavigate("citizen-raise")}>Submit the first one</button>
              </div>
            ) : (
              demands.map(demand => (
                <div key={demand.id || demand.Demand_id} className="form-card" style={{ padding: "16px", marginBottom: "16px", cursor: "pointer" }} onClick={() => onNavigate("citizen-detail", demand.id || demand.Demand_id)}>
                   <div style={{ display: "flex", justifyContent: "space-between" }}>
                     <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "var(--col-navy)" }}>{demand.title || demand.category}</h3>
                     <span className={`status-pill ${demand.status || 'SUBMITTED'}`}>{demand.status || "Gathering Support"}</span>
                   </div>
                   <p style={{ fontSize: "13px", color: "#666", margin: "0 0 12px 0" }}>{demand.description || demand.specific_issue}</p>
                   <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                     <div style={{ background: "#eee", height: "6px", borderRadius: "3px", flex: 1 }}>
                       <div style={{ background: "var(--col-orange)", height: "100%", borderRadius: "3px", width: `${Math.min((demand.votes || 0) / (demand.vote_threshold || 100) * 100, 100)}%` }} />
                     </div>
                     <button
                       onClick={(e) => handleVote(e, demand.id || demand.Demand_id)}
                       disabled={votedIds.has(demand.id || demand.Demand_id)}
                       style={{
                         padding: "4px 12px",
                         borderRadius: "6px",
                         border: votedIds.has(demand.id || demand.Demand_id) ? "1px solid #ccc" : "1px solid var(--col-orange)",
                         background: votedIds.has(demand.id || demand.Demand_id) ? "#f0f0f0" : "rgba(234, 88, 12, 0.08)",
                         color: votedIds.has(demand.id || demand.Demand_id) ? "#999" : "var(--col-orange)",
                         fontWeight: 700,
                         fontSize: "12px",
                         cursor: votedIds.has(demand.id || demand.Demand_id) ? "default" : "pointer",
                         whiteSpace: "nowrap" as const,
                         display: "flex",
                         alignItems: "center",
                         gap: "4px",
                         transition: "all 0.2s ease",
                       }}
                     >
                       {votedIds.has(demand.id || demand.Demand_id) ? "✓ Voted" : "▲ Vote"}
                     </button>
                   </div>
                   <div style={{ fontSize: "11px", color: "#666", fontWeight: "bold" }}>
                     {demand.votes || 0} / {demand.vote_threshold || 100} votes needed
                   </div>
                </div>
              ))
            )}
          </div>

          {/* Feed Map */}
          <div className="feed-map">
            <MapContainer center={userLocation || [22.5937, 78.9629]} zoom={userLocation ? 13 : 4} style={{ height: "100%", width: "100%" }}>
              <ChangeMapView center={userLocation || [22.5937, 78.9629]} zoom={userLocation ? 13 : 4} />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
              
              {userLocation && (
                <Marker 
                  position={userLocation} 
                  icon={new L.Icon({ 
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', 
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', 
                    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] 
                  })}
                >
                  <Popup>You are here</Popup>
                </Marker>
              )}

              {demands.map(demand => {
                if (!demand.lat || !demand.lng) return null;
                return (
                  <Marker key={demand.id || demand.Demand_id} position={[demand.lat, demand.lng]}>
                    <Popup>
                      <strong>{demand.title || demand.category}</strong><br/>
                      {demand.votes || 0} Votes<br/>
                      <button onClick={() => onNavigate("citizen-detail", demand.id || demand.Demand_id)} style={{ marginTop: "4px", padding: "2px 8px", fontSize: "11px", cursor: "pointer" }}>View</button>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </div>

        </div>
      </div>
    </div>
  );
};
