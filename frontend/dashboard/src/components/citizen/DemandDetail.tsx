import React, { useState, useEffect } from "react";
import "../../styles/citizen.css";
import { getRequestDetailFromBackend, getDemandById, castVote } from "../../services/demandService";
import type { CitizenUser } from "../../types";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const getCategoryEmoji = (cat?: string) => {
  if (!cat) return "📌";
  const catLower = cat.toLowerCase();
  if (catLower.includes("water")) return "💧";
  if (catLower.includes("road")) return "🛣️";
  if (catLower.includes("electric")) return "⚡";
  if (catLower.includes("drain")) return "🌊";
  if (catLower.includes("health")) return "🏥";
  if (catLower.includes("edu")) return "🏫";
  if (catLower.includes("waste")) return "🗑️";
  if (catLower.includes("transport")) return "🚌";
  return "📌";
};

interface DemandDetailProps {
  user: CitizenUser;
  DemandId: string;
  onNavigate: (view: string) => void;
}

export const DemandDetail: React.FC<DemandDetailProps> = ({
  user,
  DemandId,
  onNavigate,
}) => {
  const [proposal, setDemand] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      if (!DemandId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Try authoritative backend first
        const data = await getRequestDetailFromBackend(DemandId);
        setDemand(data);
      } catch (err: any) {
        // Fallback to local storage (e.g. For seed or offline preview)
        const local = getDemandById(DemandId);
        if (local) {
          setDemand(local);
        } else {
          setError(err.message || "Request not found in authoritative registry.");
        }
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [DemandId]);

  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    const pendingDemandId = localStorage.getItem("pending_vote_demand_id");
    if (pendingDemandId === DemandId && user.isLoggedIn) {
      handleUpvoteClick();
      localStorage.removeItem("pending_vote_demand_id");
    }
  }, [user.isLoggedIn, DemandId]);

  const handleUpvoteClick = async () => {
    if (!user.isLoggedIn) {
      localStorage.setItem("pending_vote_demand_id", DemandId);
      onNavigate("citizen-login");
      return;
    }
    try {
      setIsVoting(true);
      await castVote(DemandId);
      setHasVoted(true);
      setDemand((prev: any) => ({ ...prev, vote_count: (prev.vote_count || 0) + 1 }));
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("already voted")) {
        setHasVoted(true);
      } else {
        alert(e.message || "Failed to vote.");
      }
    } finally {
      setIsVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="citizen-portal-container">
        <div className="container" style={{ maxWidth: "600px", textAlign: "center", padding: "60px 0" }}>
          <div className="form-card">
            <p className="portal-subtext">Loading request details from official registry...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="citizen-portal-container">
        <div className="container" style={{ maxWidth: "600px", textAlign: "center", padding: "60px 0" }}>
          <div className="form-card">
            <h2 className="editorial-h3" style={{ fontSize: "20px" }}>Request Not Found</h2>
            <p className="portal-subtext" style={{ margin: "12px 0 20px 0" }}>
              {error || `No verified request found matching ID: ${DemandId}`}
            </p>
            <button className="service-card-btn" onClick={() => onNavigate("citizen-track")}>
              ← Back to My Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isNewDev = proposal.request_type === "new_development";
  const evidenceList = proposal.evidence_urls || proposal.media_urls || (proposal.evidence?.photos || []);

  return (
    <div className="citizen-portal-container">
      <div className="container" style={{ maxWidth: "900px" }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button className="btn-outline" style={{ fontSize: "12px" }} onClick={() => onNavigate("citizen-track")}>
            ← Back to My Requests
          </button>
          <span className="label-eyebrow">OFFICIAL GOVERNMENT RECORD</span>
        </div>

        {/* Top Header Card */}
        <div className="form-card" style={{ marginBottom: "20px" }}>
          <div className="demand-header-group">
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", background: "rgba(71, 85, 105, 0.1)", color: "#475569", padding: "4px 10px", borderRadius: "12px", fontWeight: 600 }}>
                {getCategoryEmoji(proposal.category)} {proposal.category || "General Infrastructure"}
              </span>
              <span className={`status-pill ${proposal.status || "SUBMITTED"}`}>
                {(proposal.status || "SUBMITTED").replace(/_/g, " ")}
              </span>
            </div>
            
            <h2 className="editorial-h2" style={{ fontSize: "24px", margin: "12px 0 16px 0", color: "var(--col-navy)", lineHeight: "1.3" }}>
              {proposal.title || proposal.english_translation || proposal.original_text || proposal.issueType || "Public Demand"}
            </h2>
            
            {/* Voting Progress Bar */}
            <div className="vote-progress-container" style={{ background: "var(--col-panel)", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px", fontWeight: 600 }}>
                <span style={{ color: "var(--col-navy)" }}>Community Support</span>
                <span style={{ color: "var(--col-text-mid)" }}>{proposal.vote_count || 0} / 50 votes needed</span>
              </div>
              <div className="vote-progress-bar" style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ height: "100%", background: "var(--col-orange)", width: `${Math.min(((proposal.vote_count || 0) / 50) * 100, 100)}%`, transition: "width 0.5s ease" }} />
              </div>
              <div style={{ fontSize: "11px", color: "var(--col-text-muted)", marginTop: "8px" }}>
                Reaching 50 votes triggers an automatic municipal review.
              </div>
            </div>
          </div>

          <div className="demand-actions" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button 
              className={`service-card-btn ${hasVoted ? 'btn-outline' : 'service-card-btn-orange'}`}
              style={{ flex: 1, minWidth: "200px" }}
              onClick={handleUpvoteClick}
              disabled={hasVoted || isVoting}
            >
              {isVoting ? "Voting..." : hasVoted ? "Supported ✓" : "Back This Demand / Upvote"}
            </button>

            <a 
              href={`https://wa.me/?text=${encodeURIComponent(`Help us get 50 votes for a new ${proposal.category || "civic"} project in ${proposal.district || "our area"}: ${window.location.origin}/demand/${DemandId}`)}`}
              target="_blank"
              rel="noreferrer"
              className="btn-outline"
              style={{ flex: 1, minWidth: "200px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "#16a34a", borderColor: "rgba(22, 163, 74, 0.3)", textDecoration: "none" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
              Share to WhatsApp
            </a>
          </div>
        </div>

        {/* Two-Column Detail Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "20px", marginBottom: "24px" }}>
          {/* Left Column: Full Particulars */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="form-card">
              <span className="label-eyebrow">CITIZEN DESCRIPTION</span>
              <p style={{ marginTop: "8px", fontSize: "14px", lineHeight: "1.6", color: "var(--col-navy)", whiteSpace: "pre-wrap" }}>
                {proposal.description || (proposal.original_text?.match(/Description:\s*(.+)/)?.[1]?.trim()) || proposal.original_text}
              </p>

              {/* Conditional Type B Details */}
              {isNewDev && (
                <div style={{ borderTop: "1px solid var(--col-border)", paddingTop: "12px", marginTop: "16px", fontSize: "13px" }}>
                  {proposal.reason && (
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Civic Justification:</strong> {proposal.reason}
                    </div>
                  )}
                  {proposal.intended_beneficiaries && (
                    <div>
                      <strong>Intended Beneficiaries:</strong> {proposal.intended_beneficiaries}
                    </div>
                  )}
                </div>
              )}

              {/* Conditional Type A Details */}
              {!isNewDev && (
                <div style={{ borderTop: "1px solid var(--col-border)", paddingTop: "12px", marginTop: "16px", fontSize: "13px" }}>
                  {proposal.start_date && (
                    <div style={{ marginBottom: "6px" }}>
                      <strong>Started:</strong> {proposal.start_date}
                    </div>
                  )}
                  {proposal.frequency && (
                    <div>
                      <strong>Frequency:</strong> {proposal.frequency}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Location Card */}
            <div className="form-card location-card">
              <span className="label-eyebrow">VERIFIED LOCATION</span>
              
              <div className="mini-map-container" style={{ height: "200px", marginTop: "12px", borderRadius: "8px", overflow: "hidden", background: "#f1f5f9" }}>
                {(proposal.latitude && proposal.longitude) ? (
                  <MapContainer center={[proposal.latitude, proposal.longitude]} zoom={15} style={{ height: "100%", width: "100%" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[proposal.latitude, proposal.longitude]} />
                  </MapContainer>
                ) : (proposal.location?.lat && proposal.location?.lng) ? (
                  <MapContainer center={[proposal.location.lat, proposal.location.lng]} zoom={15} style={{ height: "100%", width: "100%" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[proposal.location.lat, proposal.location.lng]} />
                  </MapContainer>
                ) : (
                  <div className="map-placeholder" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--col-text-muted)", fontSize: "13px" }}>
                    Location coordinates unavailable
                  </div>
                )}
              </div>

              <div className="location-details" style={{ marginTop: "16px", display: "grid", gap: "8px", fontSize: "13px" }}>
                {proposal.address && <div><strong>Address:</strong> {proposal.address}</div>}
                {proposal.district && <div><strong>District:</strong> {proposal.district}</div>}
                {proposal.pincode && <div><strong>PIN Code:</strong> {proposal.pincode}</div>}
                {proposal.landmark && <div><strong>Landmark:</strong> {proposal.landmark}</div>}
              </div>
            </div>

            {/* Evidence Card */}
            <div className="form-card">
              <span className="label-eyebrow">SUPPORTING EVIDENCE</span>
              <div style={{ marginTop: "12px" }}>
                {evidenceList && evidenceList.length > 0 ? (
                  <div className="media-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "8px" }}>
                    {evidenceList.map((url: string, idx: number) => {
                      const absoluteUrl = url.startsWith("http") ? url : `http://${window.location.hostname}:8080${url}`;
                      return (
                        <a key={idx} href={absoluteUrl} target="_blank" rel="noreferrer">
                          <img src={absoluteUrl} alt={`Evidence ${idx + 1}`} style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--col-border)" }} />
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <span style={{ color: "var(--col-text-muted)", fontSize: "13px" }}>No site photos attached by author.</span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Official Lifecycle Timeline */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="form-card">
              <span className="label-eyebrow">RESOLUTION TIMELINE</span>
              <div className="civic-stepper" style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                {(() => {
                  const stages = ['Gathering Support', 'Under Review', 'Field Feasibility Survey', 'Approved for Budget', 'Fulfilled'];
                  const statusMap: Record<string, number> = {
                    "SUBMITTED": 0,
                    "UNDER_REVIEW": 1,
                    "RESOLVED": 4,
                  };
                  const currentStageIndex = statusMap[proposal.status] !== undefined ? statusMap[proposal.status] : 0;
                  
                  const formatDateIfAvailable = (timeline: any[], stageName: string) => {
                    const match = timeline?.find(t => t.stage === stageName || t.title === stageName);
                    if (!match?.date) return null;
                    try {
                      return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(match.date));
                    } catch (e) {
                      return match.date;
                    }
                  };

                  return stages.map((stage, idx) => {
                    const isCompleted = idx < currentStageIndex || proposal.status === "RESOLVED";
                    const isActive = idx === currentStageIndex && proposal.status !== "RESOLVED";
                    
                    return (
                      <div key={idx} className={`stepper-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : 'pending'}`} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <div className="stepper-circle" style={{ 
                          width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                          background: isCompleted ? "var(--col-green)" : isActive ? "var(--col-orange)" : "var(--col-panel)",
                          color: isCompleted || isActive ? "#fff" : "var(--col-text-muted)",
                          fontSize: "12px", fontWeight: "bold"
                        }}>
                          {isCompleted ? '✓' : isActive ? '●' : '○'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="stepper-label" style={{ fontWeight: 600, fontSize: "14px", color: isActive || isCompleted ? "var(--col-navy)" : "var(--col-text-muted)" }}>{stage}</div>
                        </div>
                        <div className="stepper-date" style={{ fontSize: "12px", color: "var(--col-text-muted)" }}>
                           {formatDateIfAvailable(proposal.timeline, stage) || (isCompleted ? "Completed" : "Pending")}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Governance Callout */}
            <div className="gov-disclaimer-callout">
              <span>🏛️</span>
              <div style={{ fontSize: "11px", lineHeight: "1.4" }}>
                <strong>SPIN POLICY ASSURANCE:</strong> Your submission has been securely ingested into the authoritative municipal database. All decisions and resolution timelines remain under the audit of authorized civic officers.
              </div>
            </div>

            <div style={{ marginTop: "32px", textAlign: "center" }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => onNavigate("citizen-track")}
              >
                ← Go Back to My Requests
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
