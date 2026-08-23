import React from "react";
import "../../styles/citizen.css";
import type { CitizenUser } from "../../types";

interface CitizenPortalHomeProps {
  user: CitizenUser;
  onNavigate: (view: string) => void;
}

export const CitizenPortalHome: React.FC<CitizenPortalHomeProps> = ({ user, onNavigate }) => {
  return (
    <div className="citizen-portal-container">
      {/* Top Government Service Header */}
      <div className="portal-header-bar">
        <div className="container portal-header-inner">
          <div className="portal-title-group">
            <span className="portal-org">SPIN · SYMBIOTIC PUBLIC INFRASTRUCTURE NETWORK</span>
            <h1 className="portal-heading">Citizen Grievance Services</h1>
            <p className="portal-subtext">
              Report a public infrastructure issue or track the progress of a grievance you have already submitted.
            </p>
          </div>

          {user.isLoggedIn ? (
            <button className="btn-outline" onClick={() => onNavigate("citizen-logout")}>
              Sign Out
            </button>
          ) : (
            <button className="btn-outline" onClick={() => onNavigate("citizen-login")}>
              Sign In / Citizen Login
            </button>
          )}
        </div>
      </div>

      <div className="container">
        {/* Two Large Service Cards */}
        <div className="service-cards-grid">
          {/* CARD 1: RAISE A NEW GRIEVANCE */}
          <div className="service-card">
            <span className="service-card-tag">SERVICE 01 · INTAKE</span>
            <h2 className="service-card-title">RAISE A NEW GRIEVANCE</h2>
            <p className="service-card-desc">
              Report a public infrastructure issue affecting your area directly to municipal authorities.
            </p>
            <ul className="service-card-examples">
              <li>• Water supply & pipeline leakages</li>
              <li>• Roads & dangerous potholes</li>
              <li>• Electricity & transformer outages</li>
              <li>• Waste management & sanitation</li>
              <li>• Drainage & flood blockages</li>
              <li>• Street lighting & public transport</li>
            </ul>
            <button
              className="service-card-btn service-card-btn-orange"
              onClick={() => onNavigate("citizen-raise")}
            >
              Raise a Grievance →
            </button>
          </div>

          {/* CARD 2: TRACK A GRIEVANCE */}
          <div className="service-card">
            <span className="service-card-tag">SERVICE 02 · STATUS</span>
            <h2 className="service-card-title">TRACK A GRIEVANCE</h2>
            <p className="service-card-desc">
              Check the live status, department assignment, and official updates of grievances you have submitted.
            </p>
            <ul className="service-card-examples">
              <li>• Search by Grievance ID (e.g. SPIN-2026-123456)</li>
              <li>• Real-time department routing status</li>
              <li>• AI Spatial Cluster correlation breakdown</li>
              <li>• Official resolution timeline</li>
              <li>• Provide citizen feedback & confirmation</li>
            </ul>
            <button
              className="service-card-btn"
              onClick={() => onNavigate("citizen-track")}
            >
              Track My Grievance →
            </button>
          </div>
        </div>

        {/* How SPIN processes your grievance */}
        <div className="process-flow-box">
          <span className="label-eyebrow">TRANSPARENT PROCESS FLOW</span>
          <h3 className="editorial-h3" style={{ fontSize: "20px", marginTop: "4px" }}>
            How SPIN processes your grievance
          </h3>

          <div className="process-stepper-line">
            <div className="process-step-node">
              <span style={{ fontSize: "10px", color: "var(--col-orange)" }}>STEP 01</span>
              Citizen submission
            </div>
            <span className="process-arrow">→</span>

            <div className="process-step-node">
              <span style={{ fontSize: "10px", color: "var(--col-orange)" }}>STEP 02</span>
              Language & document processing
            </div>
            <span className="process-arrow">→</span>

            <div className="process-step-node">
              <span style={{ fontSize: "10px", color: "var(--col-orange)" }}>STEP 03</span>
              Location verification
            </div>
            <span className="process-arrow">→</span>

            <div className="process-step-node">
              <span style={{ fontSize: "10px", color: "var(--col-orange)" }}>STEP 04</span>
              AI classification
            </div>
            <span className="process-arrow">→</span>

            <div className="process-step-node">
              <span style={{ fontSize: "10px", color: "var(--col-orange)" }}>STEP 05</span>
              Spatial correlation
            </div>
            <span className="process-arrow">→</span>

            <div className="process-step-node">
              <span style={{ fontSize: "10px", color: "var(--col-orange)" }}>STEP 06</span>
              Government review
            </div>
            <span className="process-arrow">→</span>

            <div className="process-step-node">
              <span style={{ fontSize: "10px", color: "var(--col-orange)" }}>STEP 07</span>
              Resolution & update
            </div>
          </div>
        </div>

        {/* Disclaimer Callout */}
        <div className="gov-disclaimer-callout">
          <span>🏛️</span>
          <div>
            <strong>RESPONSIBLE AI GOVERNANCE DISCLAIMER:</strong> AI assists government officials by parsing intent, mapping locations, and identifying clusters. Final policy and budget decisions remain strictly with authorized government personnel.
          </div>
        </div>
      </div>
    </div>
  );
};
