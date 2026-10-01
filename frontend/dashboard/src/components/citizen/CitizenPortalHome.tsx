import React, { useState, useEffect, useRef, useMemo } from "react";
import "../../styles/citizen.css";
import type { CitizenUser } from "../../types";
import { fetchDemands, castVote, fetchMyVotes } from "../../services/demandService";
import { DEPARTMENT_LABELS, STATUS_LABELS } from "../../utils/departmentLabels";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { HeatmapLayer } from "../map/HeatmapLayer";

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

function getDemandCoordinates(demand: any): [number, number] | null {
  const rawLatitude = demand.latitude ?? demand.lat ?? demand.location?.lat;
  const rawLongitude = demand.longitude ?? demand.lng ?? demand.location?.lng;
  if (rawLatitude == null || rawLongitude == null) return null;

  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    ? [latitude, longitude]
    : null;
}

function MapOverlays({ demands, hoveredCardId, setHoveredCardId, scrollToCard }: any) {
  const map = useMapEvents({
    zoomend: () => {
      setZoomLevel(map.getZoom());
    }
  });
  const [zoomLevel, setZoomLevel] = useState(map.getZoom());

  const heatPoints = useMemo(() => demands.flatMap((demand: any) => {
    const coordinates = getDemandCoordinates(demand);
    if (!coordinates) return [];
    const voteCount = demand.vote_count ?? demand.votes;
    return [[coordinates[0], coordinates[1], Math.min((voteCount || 1) / 10, 1)] as [number, number, number]];
  }), [demands]);

  return (
    <>
      <HeatmapLayer points={heatPoints} />
      {zoomLevel > 14 && demands.map((demand: any) => {
        const coordinates = getDemandCoordinates(demand);
        if (!coordinates) return null;
        const id = demand.id || demand.Demand_id;
        const isHovered = hoveredCardId === id;
        const statusInfo = formatStatus(demand.status);
        return (
          <CircleMarker
            key={id}
            center={coordinates}
            radius={isHovered ? 12 : 8}
            pathOptions={{
              fillColor: statusInfo.color,
              color: isHovered ? "white" : statusInfo.color,
              weight: isHovered ? 3 : 1,
              fillOpacity: isHovered ? 1 : 0.7
            }}
            eventHandlers={{
              click: () => scrollToCard(id),
              mouseover: () => setHoveredCardId(id),
              mouseout: () => setHoveredCardId(null)
            }}
          >
            <Popup>
              <strong>{demand.title || demand.category}</strong><br/>
              <span style={{ fontSize: "11px", color: statusInfo.color }}>{statusInfo.label}</span><br/>
              {demand.vote_count || demand.votes || 0} Votes<br/>
              <a href={`/demand/${id}`} style={{ display: "inline-block", marginTop: "4px", padding: "2px 8px", fontSize: "11px", cursor: "pointer", background: "var(--col-navy)", color: "white", textDecoration: "none", borderRadius: "4px" }}>View Details</a>
            </Popup>
          </CircleMarker>
        )
      })}
    </>
  );
}

function timeAgo(dateString: string) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

function formatStatus(status: string) {
  if (!status) return { label: STATUS_LABELS["gathering_support"], color: "var(--col-orange)" };
  const s = status.toLowerCase();
  const label = STATUS_LABELS[s] || s.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
  switch (s) {
    case "gathering_support": return { label, color: "var(--col-orange)" };
    case "under_review": return { label, color: "#3b82f6" };
    case "field_survey": return { label, color: "#8b5cf6" };
    case "approved_for_budget": return { label, color: "#10b981" };
    case "fulfilled": 
    case "resolved": return { label, color: "#22c55e" };
    case "rejected": return { label, color: "#ef4444" };
    default: return { label, color: "#6b7280" };
  }
}

const ImageGrid = ({ images }: { images: string[] }) => {
  if (!images || images.length === 0) return null;
  
  const displayImages = images.slice(0, 4);
  const extraCount = images.length - 4;
  
  // Use grid depending on number of images
  const gridTemplateColumns = images.length === 1 ? "1fr" : "1fr 1fr";
  
  return (
    <div style={{ display: "grid", gridTemplateColumns, gap: "8px", marginTop: "12px", marginBottom: "12px" }}>
      {displayImages.map((img, idx) => (
        <div key={idx} style={{ position: "relative", height: images.length === 1 ? "200px" : "120px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
          <img src={img} alt="Attachment" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {idx === 3 && extraCount > 0 && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "20px" }}>
              +{extraCount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

import { useNavigate } from "react-router-dom";

interface CitizenPortalHomeProps {
  user: CitizenUser;
}

export const CitizenPortalHome: React.FC<CitizenPortalHomeProps> = ({ user }) => {
  const navigate = useNavigate();
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Trending");
  const [contextLocation, setContextLocation] = useState("All");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleVote = async (e: React.MouseEvent, demandId: string) => {
    e.stopPropagation();
    if (votedIds.has(demandId)) return;

    if (!user.isLoggedIn) {
      localStorage.setItem("pending_vote_demand_id", demandId);
      navigate(`/login?redirect=${encodeURIComponent(`/demand/${demandId}`)}`);
      return;
    }

    try {
      const res = await castVote(demandId);
      if (res.status === "already_voted") {
        alert("You have already voted for this demand.");
        setVotedIds(prev => new Set(prev).add(demandId)); // Ensure it's in local set
        return;
      }
      setVotedIds(prev => new Set(prev).add(demandId));
      setDemands(prev => prev.map(d => {
        if ((d.id || d.Demand_id) === demandId) {
          return { ...d, vote_count: (d.vote_count || d.votes || 0) + 1 };
        }
        return d;
      }));
    } catch (err) {
      console.error("Vote failed", err);
    }
  };

  const handleShare = (e: React.MouseEvent, demand: any) => {
    e.stopPropagation();
    const url = window.location.origin + "?demand=" + (demand.id || demand.Demand_id);
    const text = `Please support this demand: ${demand.title || demand.category}\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const scrollToCard = (id: string) => {
    const node = cardRefs.current.get(id);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a brief highlight flash
      node.style.transition = "background-color 0.5s ease";
      node.style.backgroundColor = "rgba(234, 88, 12, 0.1)";
      setTimeout(() => {
        node.style.backgroundColor = "white";
      }, 1000);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetchDemands();
        setDemands(res.demands || (Array.isArray(res) ? res : []));
        if (user.isLoggedIn) {
          const myVotes = await fetchMyVotes();
          setVotedIds(new Set(myVotes));
        }
      } catch (err) {
        console.error("Failed to fetch demands for feed", err);
      } finally {
        setLoading(false);
      }
    }
    load();

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation([position.coords.latitude, position.coords.longitude]),
        (error) => console.warn("Geolocation denied or error", error)
      );
    }
  }, [user.isLoggedIn]);

  return (
    <div className="citizen-portal-container pb-24 md:pb-8 flex-1 w-full">
      <div className="portal-header-bar">
        <div className="container portal-header-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
           <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
             <button className="navbar-logo" onClick={() => navigate("/")} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
               <span className="navbar-wordmark notranslate" style={{ fontSize: "28px", color: "var(--col-brand-blue)", fontWeight: 900, letterSpacing: "-1px" }}>SPIN</span>
             </button>
             <div className="portal-title-group" style={{ borderLeft: "1px solid #ddd", paddingLeft: "24px" }}>
                <h1 className="portal-heading" style={{ fontSize: "24px" }}>Public Demands Feed</h1>
                <p className="portal-subtext" style={{ fontSize: "13px" }}>Discover and support infrastructure proposals in your community.</p>
             </div>
           </div>
           
           <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
             {/* Bhashini Language Dropdown placeholder */}
             <select className="btn-outline" style={{ padding: "6px 12px", fontSize: "12px", background: "white", cursor: "pointer" }}>
               <option value="en">🌐 English</option>
               <option value="hi">हिंदी (Hindi)</option>
               <option value="bn">বাংলা (Bengali)</option>
               <option value="te">తెలుగు (Telugu)</option>
               <option value="mr">मराठी (Marathi)</option>
               <option value="ta">தமிழ் (Tamil)</option>
               <option value="ur">اردو (Urdu)</option>
               <option value="gu">ગુજરાતી (Gujarati)</option>
               <option value="kn">ಕನ್ನಡ (Kannada)</option>
               <option value="or">ଓଡ଼ିଆ (Odia)</option>
               <option value="ml">മലയാളം (Malayalam)</option>
               <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
               {/* Note: Full 23 languages omitted for brevity but UI is ready */}
             </select>

             <button className="service-card-btn service-card-btn-orange" onClick={() => navigate("/propose")}>
               + Propose New Demand
             </button>

             {user?.isLoggedIn && (
               <>
                 <button className="btn-outline" onClick={() => navigate("/track")} style={{ padding: "6px 12px", fontSize: "12px", background: "white" }}>
                   📝 Track Demands
                 </button>
                 <button className="btn-outline" onClick={() => navigate("/profile")} style={{ padding: "6px 12px", fontSize: "12px", background: "white" }}>
                   👤 My Profile
                 </button>
                 <button className="btn-outline" onClick={() => navigate("/login")} style={{ padding: "6px 12px", fontSize: "12px", background: "white" }}>
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
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px", borderBottom: "1px solid #eee", paddingBottom: "12px" }}>
               {['Trending', 'Top Voted', 'Most Recent', 'Category'].map(tab => (
                 <button 
                   key={tab} 
                   onClick={() => setActiveTab(tab)}
                   style={{ 
                     background: activeTab === tab ? "var(--col-navy)" : "transparent", 
                     border: "none", 
                     fontWeight: activeTab === tab ? "700" : "500",
                     color: activeTab === tab ? "white" : "#666",
                     cursor: "pointer",
                     padding: "6px 16px",
                     borderRadius: "16px",
                     fontSize: "13px",
                     transition: "all 0.2s"
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
                 <button className="btn-outline" style={{ marginTop: "12px" }} onClick={() => navigate("/propose")}>Submit the first one</button>
              </div>
            ) : (
              [...demands].sort((a, b) => {
                if (activeTab === "Trending" || activeTab === "Top Voted") {
                  return (b.vote_count || b.votes || 0) - (a.vote_count || a.votes || 0);
                } else if (activeTab === "Most Recent") {
                  const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                  const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                  return dateB - dateA;
                } else if (activeTab === "Category") {
                  return (a.category || "").localeCompare(b.category || "");
                }
                return 0;
              }).map(demand => {
                const id = demand.id || demand.Demand_id;
                const statusInfo = formatStatus(demand.status);
                // Ensure media_urls is an array if the backend sent a comma string or it's missing
                let mediaUrls = demand.media_urls || [];
                if (typeof mediaUrls === 'string') mediaUrls = mediaUrls.split(',').map((u: string) => u.trim()).filter((u: string) => u);

                // Firebase Storage URL converter
                mediaUrls = mediaUrls.map((url: string) => {
                   if (url.startsWith("gs://")) {
                      const parts = url.replace("gs://", "").split("/");
                      const bucket = parts[0];
                      const path = encodeURIComponent(parts.slice(1).join("/"));
                      return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${path}?alt=media`;
                   }
                   return url;
                });

                const voteCount = demand.vote_count || demand.votes || 0;


                return (
                  <div 
                    key={id} 
                    ref={(node) => { if (node) cardRefs.current.set(id, node); }}
                    className="form-card feed-card" 
                    style={{ 
                      padding: "16px", 
                      marginBottom: "16px", 
                      cursor: "pointer",
                      border: hoveredCardId === id ? "1px solid var(--col-orange)" : "1px solid transparent",
                      transition: "all 0.2s",
                      background: "white"
                    }} 
                    onClick={() => navigate("/demand/" + id)}
                    onMouseEnter={() => setHoveredCardId(id)}
                    onMouseLeave={() => setHoveredCardId(null)}
                  >
                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                       <h3 style={{ margin: 0, fontSize: "16px", color: "var(--col-navy)", fontWeight: 700, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                         {demand.title || (demand.english_translation ? demand.english_translation : null) || demand.category}
                       </h3>
                       <div style={{ display: "flex", gap: "6px" }}>
                         <span style={{ 
                           backgroundColor: `#f1f5f9`, 
                           color: `#475569`, 
                           padding: "4px 10px", 
                           borderRadius: "12px", 
                           fontSize: "11px", 
                           fontWeight: 700 
                         }}>
                           {DEPARTMENT_LABELS[demand.category] || demand.category}
                         </span>
                         <span style={{ 
                           backgroundColor: `${statusInfo.color}15`, 
                           color: statusInfo.color, 
                           padding: "4px 10px", 
                           borderRadius: "12px", 
                           fontSize: "11px", 
                           fontWeight: 700 
                         }}>
                           {statusInfo.label}
                         </span>
                       </div>
                     </div>
                     
                     <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
                       <span>📍 {demand.target_location_id || demand.district || "Local Ward"}</span>
                       <span>🕒 {timeAgo(demand.created_at)}</span>
                     </div>

                     <p style={{ 
                       fontSize: "13px", 
                       color: "#475569", 
                       margin: "0 0 12px 0",
                       display: "-webkit-box",
                       WebkitLineClamp: 2,
                       WebkitBoxOrient: "vertical",
                       overflow: "hidden"
                     }}>
                       {demand.description || demand.specific_issue || (demand.original_text?.match(/Description:\s*(.+)/)?.[1]?.trim()) || demand.original_text}
                     </p>

                     <ImageGrid images={mediaUrls} />

                     <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                       <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                         <div style={{ fontSize: "12px", color: "var(--col-navy)", fontWeight: "600", display: "flex", alignItems: "center" }}>
                           <span style={{ fontSize: "16px", marginRight: "4px" }}>{voteCount}</span> 
                           <span style={{ color: "#64748b" }}>votes</span>
                         </div>
                         
                         <div style={{ display: "flex", gap: "8px" }}>
                         <button
                           onClick={(e) => handleShare(e, demand)}
                           title="Share to WhatsApp"
                           style={{
                             padding: "6px",
                             borderRadius: "6px",
                             border: "1px solid #e2e8f0",
                             background: "white",
                             color: "#25D366",
                             cursor: "pointer",
                             display: "flex",
                             alignItems: "center",
                             justifyContent: "center",
                             width: "32px",
                             height: "32px"
                           }}
                         >
                           <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                             <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                           </svg>
                         </button>
                         <button
                           onClick={(e) => handleVote(e, id)}
                           disabled={votedIds.has(id)}
                           style={{
                             padding: "6px 16px",
                             borderRadius: "6px",
                             border: votedIds.has(id) ? "1px solid #ccc" : "1px solid var(--col-orange)",
                             background: votedIds.has(id) ? "#f1f5f9" : "var(--col-orange)",
                             color: votedIds.has(id) ? "#94a3b8" : "white",
                             fontWeight: 700,
                             fontSize: "12px",
                             cursor: votedIds.has(id) ? "default" : "pointer",
                             display: "flex",
                             alignItems: "center",
                             gap: "4px",
                             transition: "all 0.2s ease",
                           }}
                         >
                           {votedIds.has(id) ? "✓ Supported" : "▲ Back This"}
                          </button>
                        </div>
                      </div>

                      {/* Vote Progress Bar */}
                      <div style={{ marginTop: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
                          <span>Progress to Threshold</span>
                          <span>{Math.min(100, Math.round((voteCount / 100) * 100))}%</span>
                        </div>
                        <div style={{ width: "100%", height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ 
                            width: `${Math.min(100, (voteCount / 100) * 100)}%`, 
                            height: "100%", 
                            backgroundColor: "var(--col-orange)",
                            transition: "width 0.5s ease"
                          }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Feed Map */}
          <div className="feed-map" style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
            <MapContainer center={userLocation || [18.5204, 73.8567]} zoom={userLocation ? 13 : 11} style={{ height: "100%", width: "100%" }}>
              <ChangeMapView center={userLocation || [18.5204, 73.8567]} zoom={userLocation ? 13 : 11} />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
              
              {userLocation && (
                <Marker 
                  position={userLocation} 
                  icon={new L.DivIcon({ 
                    html: `<div style="width: 16px; height: 16px; background-color: #3b82f6; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59,130,246,0.5);"></div>`,
                    className: 'user-location-marker',
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                  })}
                >
                  <Popup>Your Location</Popup>
                </Marker>
              )}

              <MapOverlays
                demands={demands}
                hoveredCardId={hoveredCardId}
                setHoveredCardId={setHoveredCardId}
                scrollToCard={scrollToCard}
              />
            </MapContainer>
          </div>

        </div>
      </div>
    </div>
  );
};
