import React, { useState } from "react";
import "../../styles/citizen.css";
import { saveGrievance } from "../../services/grievanceService";
import type {
  CitizenUser,
  Grievance,
  GrievanceCategory,
  GrievanceSeverity,
  LocationData,
} from "../../types";

interface RaiseGrievanceFormProps {
  user: CitizenUser;
  onNavigate: (view: string, grievanceId?: string) => void;
}

const CATEGORY_ISSUE_MAP: Record<GrievanceCategory, string[]> = {
  "Water Supply": [
    "No water supply",
    "Low pressure",
    "Contaminated water",
    "Pipeline leakage / burst",
    "Irregular supply hours",
    "Other water issue",
  ],
  "Roads & Potholes": [
    "Pothole",
    "Damaged asphalt road",
    "Road blockage / debris",
    "Missing traffic signage",
    "Unsafe road condition",
    "Other road issue",
  ],
  "Drainage / Flooding": [
    "Clogged drainage pipe",
    "Overflowing sewer main",
    "Waterlogging on street",
    "Broken storm drain cover",
    "Other drainage issue",
  ],
  Electricity: [
    "Frequent load shedding",
    "Transformer failure / sparks",
    "High/Low voltage fluctuation",
    "Dangling power lines",
    "Other electrical issue",
  ],
  "Waste Management": [
    "Garbage dump not cleared",
    "Overflowing community bin",
    "Illegal waste dumping",
    "Hazardous waste on public land",
    "Other sanitation issue",
  ],
  "Street Lighting": [
    "Street light not working",
    "Flickering streetlight",
    "Dark stretch / No lights installed",
    "Damaged electric pole",
  ],
  "Public Transport": [
    "Irregular bus schedule",
    "Damaged bus shelter",
    "Overcrowded transit route",
    "Missing timetable board",
  ],
  Sanitation: [
    "Public toilet unhygienic",
    "Lack of water in public washroom",
    "Open sewage discharge",
  ],
  "Public Infrastructure": [
    "Damaged public park facility",
    "Footpath blockage",
    "Encroachment on public land",
    "Broken bridge/culvert guardrail",
  ],
  Other: ["Other public infrastructure grievance"],
};

export const RaiseGrievanceForm: React.FC<RaiseGrievanceFormProps> = ({
  user,
  onNavigate,
}) => {
  const [step, setStep] = useState<number>(1);

  /* Step 1 State */
  const [category, setCategory] = useState<GrievanceCategory>("Water Supply");
  const [issueType, setIssueType] = useState<string>("Pipeline leakage / burst");
  const [severity, setSeverity] = useState<GrievanceSeverity>("High");
  const [startDate, setStartDate] = useState<string>("2026-08-01");
  const [frequency, setFrequency] = useState<"One time" | "Occasional" | "Daily" | "Continuous">("Continuous");
  const [description, setDescription] = useState<string>(
    "Main drinking water pipeline W-402 has burst near Sector 4 East. Residents have received no municipal water for 3 weeks and water tankers are irregular."
  );

  /* Step 2 State (Location) */
  const [location, setLocation] = useState<LocationData>({
    lat: 18.5204,
    lng: 73.8567,
    address: "Main Road, Sector 4 East, Ward 14",
    district: "Pune",
    state: "Maharashtra",
    pinCode: "411001",
    isVerified: true,
  });

  /* Step 3 State (Evidence & Bhashini Voice) */
  const [voiceText] = useState<string>(
    "पानी की मुख्य लाइन पिछले 3 हफ़्तों से टूटी हुई है। सेक्टर 4 में पीने का पानी नहीं आ रहा है।"
  );
  const [isRecording, setIsRecording] = useState<boolean>(false);

  /* Step 5 Declaration */
  const [declaration, setDeclaration] = useState<boolean>(false);
  const [submittedGrievance, setSubmittedGrievance] = useState<Grievance | null>(null);

  /* Handle Location GPS trigger */
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation((prev) => ({
            ...prev,
            lat: Number(pos.coords.latitude.toFixed(4)),
            lng: Number(pos.coords.longitude.toFixed(4)),
            isVerified: true,
          }));
        },
        () => {
          setLocation((prev) => ({ ...prev, isVerified: true }));
        }
      );
    }
  };

  /* Voice Recording Trigger simulation */
  const handleToggleRecord = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
      }, 3000);
    }
  };

  /* Category Change */
  const handleCategoryChange = (cat: GrievanceCategory) => {
    setCategory(cat);
    const available = CATEGORY_ISSUE_MAP[cat];
    if (available && available.length > 0) {
      setIssueType(available[0]);
    }
  };

  /* Handle Final Submission */
  const handleSubmit = () => {
    const id = `SPIN-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const newGrievance: Grievance = {
      id,
      citizenId: user.id || "cit-001",
      citizenName: user.name || "Ramesh Kulkarni",
      citizenPhone: user.phone || "+91 98230 41092",
      category,
      issueType,
      severity,
      startDate,
      frequency,
      description,
      location,
      evidence: {
        photos: ["/demo-water-leak.jpg"],
        voiceNoteUrl: "/demo-audio-hindi.mp3",
        voiceText,
        documentName: "Evidence_Photo.jpg",
      },
      aiAnalysis: {
        category,
        issue: issueType,
        severity,
        location: `${location.district} / Ward 14`,
        confidence: 94,
        nearbyGrievances: 37,
        redZone: true,
        reasoning: `Spatial correlation detected 37 similar ${category.toLowerCase()} grievances within a 12 km² cluster near ${location.district}.`,
      },
      status: "SUBMITTED",
      department: `${location.district} Municipal ${category} Department`,
      assignedTo: "Chief Engineer (Infrastructure)",
      createdAt: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      updatedAt: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      timeline: [
        {
          date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" }).toUpperCase(),
          title: "Grievance Submitted",
          description: "Grievance recorded on SPIN Citizen Portal.",
          completed: true,
        },
        {
          date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" }).toUpperCase(),
          title: "AI Classification Queued",
          description: "Bhashini ASR & Gemini intent parsing active.",
          completed: true,
        },
      ],
      decisionStatus: "PENDING",
    };

    saveGrievance(newGrievance);
    setSubmittedGrievance(newGrievance);
    setStep(6);
  };

  /* SUCCESS SCREEN STEP 6 */
  if (step === 6 && submittedGrievance) {
    return (
      <div className="citizen-portal-container">
        <div className="container" style={{ maxWidth: "720px" }}>
          <div className="form-card" style={{ borderTop: "4px solid var(--col-green)", textAlign: "center" }}>
            <div style={{ fontSize: "40px", color: "var(--col-green)" }}>✓</div>
            <h2 className="portal-heading" style={{ color: "var(--col-green)" }}>Grievance Submitted Successfully</h2>
            <p className="portal-subtext">
              Your report has been logged and assigned to the municipal infrastructure engine.
            </p>

            <div style={{ background: "var(--col-panel)", padding: "16px", borderRadius: "8px", margin: "16px 0" }}>
              <span className="label-eyebrow">OFFICIAL GRIEVANCE TRACKING ID</span>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--col-navy)", letterSpacing: "0.05em", margin: "4px 0" }}>
                {submittedGrievance.id}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: "16px", fontSize: "12px", color: "var(--col-text-mid)", flexWrap: "wrap" }}>
                <span><strong>Date:</strong> {submittedGrievance.createdAt}</span>
                <span><strong>Category:</strong> {submittedGrievance.category}</span>
                <span><strong>District:</strong> {submittedGrievance.location.district}</span>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--col-border)", paddingTop: "16px", textAlign: "left" }}>
              <span className="label-eyebrow">NEXT SYSTEM STAGES</span>
              <div className="process-stepper-line" style={{ marginTop: "8px" }}>
                <span className="status-pill SUBMITTED">1. SUBMITTED</span>
                <span className="process-arrow">→</span>
                <span className="status-pill UNDER_REVIEW">2. AI PROCESSING</span>
                <span className="process-arrow">→</span>
                <span className="status-pill UNDER_REVIEW">3. ROUTED TO DEPT</span>
                <span className="process-arrow">→</span>
                <span className="status-pill RESOLVED">4. RESOLVED</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "16px" }}>
              <button
                className="service-card-btn service-card-btn-orange"
                onClick={() => onNavigate("citizen-detail", submittedGrievance.id)}
              >
                Track Grievance →
              </button>
              <button className="btn-outline" onClick={() => window.print()}>
                📄 Download Acknowledgement
              </button>
              <button className="btn-outline" onClick={() => onNavigate("citizen")}>
                Return to Citizen Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="citizen-portal-container">
      <div className="container" style={{ maxWidth: "880px" }}>
        <div style={{ marginBottom: "20px" }}>
          <span className="portal-org">SPIN · CITIZEN SERVICES</span>
          <h1 className="portal-heading">Raise a Public Infrastructure Grievance</h1>
          <p className="portal-subtext">Follow the steps below to submit your complaint with location and evidence context.</p>
        </div>

        {/* 5-Step Progress Bar */}
        <div className="form-step-bar">
          <div className={`step-indicator-item ${step === 1 ? "active" : step > 1 ? "completed" : ""}`}>
            <span className="step-number-circle">{step > 1 ? "✓" : "1"}</span>
            <span>STEP 1 — ISSUE</span>
          </div>
          <div className={`step-indicator-item ${step === 2 ? "active" : step > 2 ? "completed" : ""}`}>
            <span className="step-number-circle">{step > 2 ? "✓" : "2"}</span>
            <span>STEP 2 — LOCATION</span>
          </div>
          <div className={`step-indicator-item ${step === 3 ? "active" : step > 3 ? "completed" : ""}`}>
            <span className="step-number-circle">{step > 3 ? "✓" : "3"}</span>
            <span>STEP 3 — EVIDENCE</span>
          </div>
          <div className={`step-indicator-item ${step === 4 ? "active" : step > 4 ? "completed" : ""}`}>
            <span className="step-number-circle">{step > 4 ? "✓" : "4"}</span>
            <span>STEP 4 — AI REVIEW</span>
          </div>
          <div className={`step-indicator-item ${step === 5 ? "active" : ""}`}>
            <span className="step-number-circle">5</span>
            <span>STEP 5 — SUBMIT</span>
          </div>
        </div>

        {/* STEP 1: ISSUE DETAILS */}
        {step === 1 && (
          <div className="form-card">
            <div>
              <span className="label-eyebrow">STEP 1 OF 5</span>
              <h2 className="portal-heading" style={{ fontSize: "20px" }}>Select Infrastructure Issue Category</h2>
            </div>

            <div className="form-group">
              <label className="form-label">Grievance Category *</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as GrievanceCategory)}
              >
                {Object.keys(CATEGORY_ISSUE_MAP).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Specific Issue Type *</label>
              <select className="form-select" value={issueType} onChange={(e) => setIssueType(e.target.value)}>
                {(CATEGORY_ISSUE_MAP[category] || []).map((issue) => (
                  <option key={issue} value={issue}>
                    {issue}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Severity Level *</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                {(["Low", "Medium", "High", "Critical"] as GrievanceSeverity[]).map((sev) => (
                  <label
                    key={sev}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: severity === sev ? "var(--col-orange-dim)" : "var(--col-panel)",
                      border: severity === sev ? "1px solid var(--col-orange)" : "1px solid var(--col-border)",
                      padding: "10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: severity === sev ? "600" : "400",
                      fontSize: "13px",
                    }}
                  >
                    <input
                      type="radio"
                      name="severity"
                      checked={severity === sev}
                      onChange={() => setSeverity(sev)}
                    />
                    {sev}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">When did this issue start?</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">How frequently does this happen?</label>
                <select
                  className="form-select"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                >
                  <option value="One time">One time</option>
                  <option value="Occasional">Occasional</option>
                  <option value="Daily">Daily</option>
                  <option value="Continuous">Continuous</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Describe the issue *</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what is happening, where it is happening, and how it is affecting local residents..."
                required
              />
              <span className="body-sm" style={{ textAlign: "right", fontSize: "11px" }}>
                {description.length} / 1000 characters
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="service-card-btn service-card-btn-orange" onClick={() => setStep(2)}>
                Continue to Step 2: Location →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: LOCATION */}
        {step === 2 && (
          <div className="form-card">
            <div>
              <span className="label-eyebrow">STEP 2 OF 5</span>
              <h2 className="portal-heading" style={{ fontSize: "20px" }}>Where is the issue?</h2>
              <p className="portal-subtext" style={{ fontSize: "13px" }}>
                SPIN uses location information to identify clusters of similar grievances and understand infrastructure demand.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button className="btn-outline btn-outline-orange" onClick={handleUseCurrentLocation}>
                📍 Use My Current Location (GPS)
              </button>

              <span className={`location-status-badge ${location.isVerified ? "verified" : "required"}`}>
                {location.isVerified ? "LOCATION VERIFIED ✓" : "LOCATION REQUIRED"}
              </span>
            </div>

            <div className="process-flow-box" style={{ padding: "20px", textAlign: "center", background: "#E2E8F0" }}>
              <span style={{ fontSize: "24px" }}>📍</span>
              <div style={{ fontWeight: "700", color: "var(--col-navy)", fontSize: "14px", marginTop: "4px" }}>
                {location.address}
              </div>
              <span style={{ fontSize: "11px", color: "var(--col-text-muted)" }}>
                GPS: {location.lat}, {location.lng} · Drag marker to adjust exact street location
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">Address / Landmark *</label>
                <input
                  type="text"
                  className="form-input"
                  value={location.address}
                  onChange={(e) => setLocation({ ...location, address: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">District *</label>
                <select
                  className="form-select"
                  value={location.district}
                  onChange={(e) => setLocation({ ...location, district: e.target.value })}
                >
                  <option value="Pune">Pune</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="form-input"
                  value={location.state}
                  onChange={(e) => setLocation({ ...location, state: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">PIN Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={location.pinCode}
                  onChange={(e) => setLocation({ ...location, pinCode: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Coordinates</label>
                <input
                  type="text"
                  className="form-input"
                  disabled
                  value={`${location.lat}, ${location.lng}`}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn-outline" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button className="service-card-btn service-card-btn-orange" onClick={() => setStep(3)}>
                Continue to Step 3: Evidence →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: EVIDENCE & BHASHINI VOICE */}
        {step === 3 && (
          <div className="form-card">
            <div>
              <span className="label-eyebrow">STEP 3 OF 5</span>
              <h2 className="portal-heading" style={{ fontSize: "20px" }}>Add Supporting Evidence (Optional)</h2>
              <p className="portal-subtext" style={{ fontSize: "13px" }}>
                Upload photos, documents, or record a voice grievance in your native Indian dialect via Bhashini AI integration.
              </p>
            </div>

            <div className="ai-review-card" style={{ background: "var(--col-orange-dim)", border: "1px solid var(--col-orange-line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="label-orange">🇮🇳 BHASHINI MULTILINGUAL VOICE INTAKE</span>
                <span className="demo-badge-subtle">SPEECH-TO-TEXT</span>
              </div>
              <p className="body-sm" style={{ color: "var(--col-navy)" }}>
                Prefer speaking in your local language? Record a voice note below. Bhashini will automatically transcribe and translate it into structured data.
              </p>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <button
                  type="button"
                  className={`btn-outline ${isRecording ? "btn-outline-orange" : ""}`}
                  onClick={handleToggleRecord}
                >
                  {isRecording ? "🔴 Recording... Click to Stop" : "🎙 Record Voice Grievance"}
                </button>
                <span style={{ fontSize: "12px", color: "var(--col-text-muted)" }}>
                  {isRecording ? "Listening (Hindi / Marathi / Local Dialect)..." : "Audio file: demo-audio-hindi.mp3 attached"}
                </span>
              </div>

              <div style={{ background: "var(--col-surface)", padding: "12px", borderRadius: "6px", fontSize: "11px" }}>
                <div style={{ fontWeight: "700", color: "var(--col-navy)", marginBottom: "4px" }}>BHASHINI PROCESSING PIPELINE:</div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", color: "var(--col-text-mid)" }}>
                  <span>VOICE INPUT (Hindi / Marathi)</span>
                  <span>→</span>
                  <span>BHASHINI ASR (Speech → Text)</span>
                  <span>→</span>
                  <span>GEMINI PARSER (Entity & Severity)</span>
                </div>
                <div style={{ marginTop: "6px", fontStyle: "italic", color: "var(--col-navy)" }}>
                  "{voiceText}"
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">Upload Site Photo</label>
                <div style={{ border: "2px dashed var(--col-border-strong)", padding: "20px", borderRadius: "6px", textAlign: "center", fontSize: "12px", color: "var(--col-text-muted)" }}>
                  📷 Drag photo here or click to browse (JPEG, PNG up to 10MB)
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Upload Document / Petition</label>
                <div style={{ border: "2px dashed var(--col-border-strong)", padding: "20px", borderRadius: "6px", textAlign: "center", fontSize: "12px", color: "var(--col-text-muted)" }}>
                  📄 Drag PDF document here (PDF up to 5MB)
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn-outline" onClick={() => setStep(2)}>
                ← Back
              </button>
              <button className="service-card-btn service-card-btn-orange" onClick={() => setStep(4)}>
                Continue to Step 4: AI Review →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: AI REVIEW & INTERPRETATION */}
        {step === 4 && (
          <div className="form-card">
            <div>
              <span className="label-eyebrow">STEP 4 OF 5</span>
              <h2 className="portal-heading" style={{ fontSize: "20px" }}>SPIN AI Interpretation Breakdown</h2>
              <p className="portal-subtext" style={{ fontSize: "13px" }}>
                SPIN has analyzed your input and correlated spatial demand across government GIS datasets.
              </p>
            </div>

            <div className="ai-review-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="label-orange">SPIN AI PARSED OUTPUT</span>
                <span className="location-status-badge verified">CONFIDENCE: 94%</span>
              </div>

              <div className="ai-review-grid">
                <div className="ai-review-item">
                  <label>Category</label>
                  <span>{category}</span>
                </div>
                <div className="ai-review-item">
                  <label>Issue Identified</label>
                  <span>{issueType}</span>
                </div>
                <div className="ai-review-item">
                  <label>Severity Score</label>
                  <span style={{ color: "var(--col-red)" }}>{severity} (8.5/10)</span>
                </div>
                <div className="ai-review-item">
                  <label>Location Cluster</label>
                  <span>{location.district} / Ward 14</span>
                </div>
                <div className="ai-review-item">
                  <label>Nearby Complaints</label>
                  <span style={{ color: "var(--col-orange)" }}>37 Complaints in 12 km²</span>
                </div>
                <div className="ai-review-item">
                  <label>Red Zone Flag</label>
                  <span style={{ color: "var(--col-red)" }}>YES (High Demand)</span>
                </div>
              </div>

              <div style={{ background: "var(--col-surface)", padding: "12px", borderRadius: "6px", fontSize: "12px", color: "var(--col-text-mid)" }}>
                <strong>Reasoning:</strong> Grievance density in Ward 14 reached 3.1 complaints/km². 84% cite line W-402 rupture. High likelihood of public infrastructure intervention required.
              </div>
            </div>

            <div className="gov-disclaimer-callout">
              <span>⚠️</span>
              <div>
                <strong>CITIZEN REVIEW:</strong> Please review the information above before submitting. If the AI misidentified your category or issue, click "Edit Information".
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn-outline" onClick={() => setStep(1)}>
                ✏️ Edit Information
              </button>
              <button className="service-card-btn service-card-btn-orange" onClick={() => setStep(5)}>
                Confirm & Continue to Step 5 →
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: FINAL REVIEW & SUBMIT */}
        {step === 5 && (
          <div className="form-card">
            <div>
              <span className="label-eyebrow">STEP 5 OF 5</span>
              <h2 className="portal-heading" style={{ fontSize: "20px" }}>Final Grievance Summary & Declaration</h2>
              <p className="portal-subtext" style={{ fontSize: "13px" }}>
                Review all submitted details and sign the citizen declaration before official dispatch.
              </p>
            </div>

            <table className="data-table">
              <tbody>
                <tr>
                  <td>CITIZEN NAME</td>
                  <td>{user.name} ({user.phone})</td>
                </tr>
                <tr>
                  <td>CATEGORY</td>
                  <td><strong>{category}</strong></td>
                </tr>
                <tr>
                  <td>ISSUE TYPE</td>
                  <td>{issueType}</td>
                </tr>
                <tr>
                  <td>SEVERITY</td>
                  <td><span style={{ color: "var(--col-red)", fontWeight: "700" }}>{severity}</span></td>
                </tr>
                <tr>
                  <td>LOCATION</td>
                  <td>{location.address}, {location.district}, {location.state} - {location.pinCode}</td>
                </tr>
                <tr>
                  <td>DESCRIPTION</td>
                  <td>{description}</td>
                </tr>
                <tr>
                  <td>EVIDENCE ATTACHED</td>
                  <td>1 Audio Recording (Hindi), 1 Site Photo, 1 PDF Petition</td>
                </tr>
              </tbody>
            </table>

            <div style={{ background: "var(--col-panel)", padding: "16px", borderRadius: "6px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", color: "var(--col-navy)" }}>
                <input
                  type="checkbox"
                  checked={declaration}
                  onChange={(e) => setDeclaration(e.target.checked)}
                />
                <strong>I confirm that the information provided in this grievance is accurate to the best of my knowledge.</strong>
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn-outline" onClick={() => setStep(4)}>
                ← Back to Step 4
              </button>
              <button
                className="service-card-btn service-card-btn-orange"
                disabled={!declaration}
                style={{ opacity: declaration ? 1 : 0.5, cursor: declaration ? "pointer" : "not-allowed" }}
                onClick={handleSubmit}
              >
                Submit Grievance Officially →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
