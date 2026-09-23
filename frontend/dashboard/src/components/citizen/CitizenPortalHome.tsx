import React, { useState, useEffect } from "react";
import "../../styles/citizen.css";
import type { CitizenUser } from "../../types";
import { getMyRequestsFromBackend } from "../../services/grievanceService";

interface CitizenPortalHomeProps {
  user: CitizenUser;
  onNavigate: (view: string, id?: string) => void;
}

export const CitizenPortalHome: React.FC<CitizenPortalHomeProps> = ({ user, onNavigate }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [searchRequestId, setSearchRequestId] = useState<string>("");

  useEffect(() => {
    async function loadRequests() {
      if (!user.isLoggedIn) {
        setLoading(false);
        return;
      }
      try {
        const data = await getMyRequestsFromBackend();
        setRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        setRequests([]);
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
  }, [user.isLoggedIn]);

  const activeCount = requests.filter((r) => r.status !== "RESOLVED").length;
  const resolvedCount = requests.filter((r) => r.status === "RESOLVED").length;

  return (
    <div className="citizen-portal-container">
      {/* Top Government Service Header */}
      <div className="portal-header-bar">
        <div className="container portal-header-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              className="btn-outline"
              style={{
                color: "#fff",
                borderColor: "rgba(255,255,255,0.4)",
                background: "rgba(255,255,255,0.1)",
                fontSize: "12px",
                fontWeight: "700",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              onClick={() => onNavigate("landing")}
            >
              ← Back to Home
            </button>

            <div className="portal-title-group">
              <span className="portal-org">SPIN · SYMBIOTIC PUBLIC INFRASTRUCTURE NETWORK</span>
              <h1 className="portal-heading" style={{ fontSize: "24px" }}>
                Citizen Dashboard
              </h1>
              <p className="portal-subtext" style={{ fontSize: "13px" }}>
                {user.isLoggedIn && user.name ? `Welcome, ${user.name}` : "Infrastructure Demand & Resolution Services"}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {user.isLoggedIn ? (
              <>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)", fontSize: "12px" }}
                  onClick={() => setShowProfile(!showProfile)}
                >
                  👤 My Profile
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)", fontSize: "12px" }}
                  onClick={() => onNavigate("citizen-logout")}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn-outline"
                style={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)", fontSize: "12px" }}
                onClick={() => onNavigate("citizen-login")}
              >
                Sign In / Citizen Login
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        {/* Profile Card Modal / Drawer */}
        {showProfile && user.isLoggedIn && (
          <div className="form-card" style={{ marginBottom: "24px", borderLeft: "4px solid var(--col-orange)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span className="label-eyebrow">CITIZEN PROFILE DETAILS</span>
              <button
                type="button"
                onClick={() => setShowProfile(false)}
                style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "var(--col-text-muted)" }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", fontSize: "13px" }}>
              <div><strong>Full Name:</strong> {user.name || "Citizen User"}</div>
              <div><strong>Registered Phone:</strong> {user.phone || "Not specified"}</div>
              <div><strong>Citizen ID:</strong> {user.id || "cit-verified"}</div>
              <div><strong>Account Role:</strong> Citizen Verified</div>
            </div>
          </div>
        )}

        {/* Real Account-Specific Metrics (0 for new user, no fake seed numbers) */}
        {user.isLoggedIn && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
            <div className="stat-card">
              <span className="stat-label">TOTAL SUBMISSIONS</span>
              <span className="stat-value">{loading ? "..." : requests.length}</span>
            </div>
            <div className="stat-card accent">
              <span className="stat-label">ACTIVE / UNDER REVIEW</span>
              <span className="stat-value" style={{ color: "var(--col-orange)" }}>
                {loading ? "..." : activeCount}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">RESOLVED</span>
              <span className="stat-value" style={{ color: "var(--col-green)" }}>
                {loading ? "..." : resolvedCount}
              </span>
            </div>
          </div>
        )}

        {/* Quick Search & Track By Request ID */}
        <div className="form-card" style={{ padding: "16px", marginBottom: "24px", display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <label className="form-label" style={{ fontSize: "12px" }}>Track Specific Request</label>
            <input
              type="text"
              className="form-input"
              value={searchRequestId}
              onChange={(e) => setSearchRequestId(e.target.value)}
              placeholder="Enter genuine Request ID (e.g., SPIN-2026-XXXXXX)..."
              style={{ fontSize: "13px" }}
            />
          </div>
          <button
            type="button"
            className="service-card-btn service-card-btn-orange"
            style={{ marginTop: "18px", padding: "10px 18px", fontSize: "13px" }}
            onClick={() => {
              if (searchRequestId.trim()) {
                onNavigate("citizen-detail", searchRequestId.trim());
              } else {
                onNavigate("citizen-track");
              }
            }}
          >
            Track Status →
          </button>
        </div>

        {/* Primary Service Cards */}
        <div className="service-cards-grid" style={{ marginBottom: "24px" }}>
          {/* CARD 1: SUBMIT DEVELOPMENT NEED */}
          <div className="service-card">
            <span className="service-card-tag">SERVICE 01 · CITIZEN INTAKE</span>
            <h2 className="service-card-title">SUBMIT DEVELOPMENT NEED</h2>
            <p className="service-card-desc">
              Report an existing breakdown or propose a new infrastructure facility for your neighborhood.
            </p>
            <ul className="service-card-examples">
              <li>• Existing problem (Potholes, pipeline burst, power cuts, flood drains)</li>
              <li>• New development request (New clinic, school room, paved road, water line)</li>
              <li>• Multilingual speech recognition &amp; audio intake</li>
              <li>• Optional GPS geolocation with explicit confirmation</li>
              <li>• Real-time photo &amp; document evidence attachments</li>
            </ul>
            <button
              className="service-card-btn service-card-btn-orange"
              onClick={() => onNavigate("citizen-raise")}
            >
              + Submit Request →
            </button>
          </div>

          {/* CARD 2: MY REQUESTS & TRACKING */}
          <div className="service-card">
            <span className="service-card-tag">SERVICE 02 · TRACKING</span>
            <h2 className="service-card-title">MY SUBMITTED REQUESTS</h2>
            <p className="service-card-desc">
              Check the official government review status, department routing, and resolution timeline.
            </p>
            <ul className="service-card-examples">
              <li>• Genuine request ID retrieval and real status tracking</li>
              <li>• Review official department assignments</li>
              <li>• Spatial cluster correlation updates</li>
              <li>• Transparent government policy timeline</li>
              <li>• Citizen feedback on resolution</li>
            </ul>
            <button
              className="service-card-btn"
              onClick={() => onNavigate("citizen-track")}
            >
              View My Requests ({requests.length}) →
            </button>
          </div>
        </div>

        {/* My Recent Requests / Clean Empty State Section */}
        {user.isLoggedIn && (
          <div className="form-card" style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <span className="label-eyebrow">YOUR RECENT SUBMISSIONS</span>
                <h3 className="editorial-h3" style={{ fontSize: "18px", marginTop: "4px" }}>
                  Submitted Infrastructure Demands
                </h3>
              </div>
              {requests.length > 0 && (
                <button
                  type="button"
                  className="btn-outline"
                  style={{ fontSize: "12px" }}
                  onClick={() => onNavigate("citizen-track")}
                >
                  View All ({requests.length})
                </button>
              )}
            </div>

            {loading ? (
              <p style={{ textAlign: "center", padding: "20px", color: "var(--col-text-muted)", fontSize: "13px" }}>
                Loading your requests from authoritative registry...
              </p>
            ) : requests.length === 0 ? (
              /* Clean Empty State for New Citizens */
              <div style={{ textAlign: "center", padding: "32px 16px", background: "var(--col-panel)", borderRadius: "8px" }}>
                <div style={{ fontSize: "36px", marginBottom: "8px" }}>📋</div>
                <h4 style={{ color: "var(--col-navy)", fontSize: "16px", margin: "0 0 6px 0" }}>
                  No Infrastructure Demands Submitted Yet
                </h4>
                <p style={{ color: "var(--col-text-muted)", fontSize: "13px", maxWidth: "460px", margin: "0 auto 16px auto" }}>
                  When you report an infrastructure problem or submit a new development proposal, its official status and department review timeline will be tracked here.
                </p>
                <button
                  type="button"
                  className="service-card-btn service-card-btn-orange"
                  style={{ display: "inline-block" }}
                  onClick={() => onNavigate("citizen-raise")}
                >
                  + Submit Your First Request
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {requests.slice(0, 5).map((req) => (
                  <div
                    key={req.grievance_id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      background: "var(--col-panel)",
                      borderRadius: "6px",
                      border: "1px solid var(--col-border)",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--col-navy)", fontSize: "14px" }}>
                        {req.grievance_id}{" "}
                        <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--col-text-muted)" }}>
                          ({req.request_type === "new_development" ? "New Development" : "Existing Problem"})
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--col-text-mid)", marginTop: "2px" }}>
                        <strong>{req.category}</strong> · {req.district}, {req.state}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span className={`status-pill ${req.status}`}>{req.status}</span>
                      <button
                        type="button"
                        className="btn-outline"
                        style={{ fontSize: "12px", padding: "4px 10px" }}
                        onClick={() => onNavigate("citizen-detail", req.grievance_id)}
                      >
                        Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Transparent Process Flow */}
        <div className="process-flow-box">
          <span className="label-eyebrow">TRANSPARENT PROCESS FLOW</span>
          <h3 className="editorial-h3" style={{ fontSize: "20px", marginTop: "4px" }}>
            How SPIN processes your request
          </h3>

          <div className="process-stepper-line">
            <div className="process-step-node">
              <span style={{ fontSize: "10px", color: "var(--col-orange)" }}>STEP 01</span>
              Citizen submission
            </div>
            <span className="process-arrow">→</span>

            <div className="process-step-node">
              <span style={{ fontSize: "10px", color: "var(--col-orange)" }}>STEP 02</span>
              Language &amp; evidence intake
            </div>
            <span className="process-arrow">→</span>

            <div className="process-step-node">
              <span style={{ fontSize: "10px", color: "var(--col-orange)" }}>STEP 03</span>
              Location verification
            </div>
            <span className="process-arrow">→</span>

            <div className="process-step-node">
              <span style={{ fontSize: "10px", color: "var(--col-orange)" }}>STEP 04</span>
              AI semantic parsing
            </div>
            <span className="process-arrow">→</span>

            <div className="process-step-node">
              <span style={{ fontSize: "10px", color: "var(--col-orange)" }}>STEP 05</span>
              Spatial clustering
            </div>
            <span className="process-arrow">→</span>

            <div className="process-step-node">
              <span style={{ fontSize: "10px", color: "var(--col-orange)" }}>STEP 06</span>
              Government review
            </div>
            <span className="process-arrow">→</span>

            <div className="process-step-node">
              <span style={{ fontSize: "10px", color: "var(--col-orange)" }}>STEP 07</span>
              Resolution &amp; update
            </div>
          </div>
        </div>

        {/* Disclaimer Callout */}
        <div className="gov-disclaimer-callout">
          <span>🏛️</span>
          <div>
            <strong>RESPONSIBLE AI GOVERNANCE DISCLAIMER:</strong> AI assists municipal officials by parsing civic demand, mapping geographic locations, and identifying community clusters. Final policy prioritization, budget allocation, and infrastructure commissioning remain strictly with authorized government authorities.
          </div>
        </div>
      </div>
    </div>
  );
};
