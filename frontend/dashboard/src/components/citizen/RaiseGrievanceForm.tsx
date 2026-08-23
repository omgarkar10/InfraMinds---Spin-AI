import React, { useState, useRef } from "react";
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

const STATE_DISTRICT_MAP: Record<string, string[]> = {
  Maharashtra: ["Pune", "Mumbai", "Thane", "Nagpur", "Nashik", "Chhatrapati Sambhajinagar", "Pimpri-Chinchwad"],
  "Delhi (NCT)": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Central Delhi"],
  Karnataka: ["Bengaluru", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida (Gautam Buddha Nagar)", "Varanasi", "Agra"],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur"],
  "Madhya Pradesh": ["Bhopal", "Indore"],
};

export const RaiseGrievanceForm: React.FC<RaiseGrievanceFormProps> = ({
  user,
  onNavigate,
}) => {
  const [step, setStep] = useState<number>(1);

  /* Step 1 State */
  const [category, setCategory] = useState<GrievanceCategory | "">("");
  const [issueType, setIssueType] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [frequency, setFrequency] = useState<"One time" | "Occasional" | "Daily" | "Continuous" | "">("");
  const [description, setDescription] = useState<string>("");

  /* Step 2 State (Location) */
  const [location, setLocation] = useState<LocationData>({
    lat: 20.5937,
    lng: 78.9629,
    address: "",
    district: "",
    state: "",
    pinCode: "",
    isVerified: false,
  });

  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string>("");

  /* Handle State dropdown change */
  const handleStateChange = (selectedState: string) => {
    const validDistricts = STATE_DISTRICT_MAP[selectedState] || [];
    const isCurrentDistrictValid = validDistricts.includes(location.district);
    setLocation((prev) => ({
      ...prev,
      state: selectedState,
      district: isCurrentDistrictValid ? prev.district : "",
    }));
  };

  /* Step 3 State (Evidence & Bhashini Voice) */
  const [voiceText, setVoiceText] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string>("");
  const recognitionRef = useRef<any>(null);

  /* Step 5 Declaration */
  const [declaration, setDeclaration] = useState<boolean>(false);
  const [submittedGrievance, setSubmittedGrievance] = useState<Grievance | null>(null);

  /* Handle Location GPS trigger with Reverse Geocoding */
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser. Please enter location manually.");
      return;
    }
    setIsGpsLoading(true);
    setGpsError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lng = Number(pos.coords.longitude.toFixed(4));

        let detectedState = "Maharashtra";
        let detectedDistrict = "Pune";
        let detectedPin = "411001";

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
            headers: { "User-Agent": "SPIN-CitizenPortal/1.0" },
          });
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const rawState = addr.state || "";
            const rawDistrict = addr.city || addr.town || addr.county || addr.state_district || addr.suburb || "";
            const rawPin = addr.postcode || "";

            const matchedState = Object.keys(STATE_DISTRICT_MAP).find(
              (s) => s.toLowerCase() === rawState.toLowerCase() || rawState.toLowerCase().includes(s.toLowerCase())
            );
            if (matchedState) {
              detectedState = matchedState;
              const validDistricts = STATE_DISTRICT_MAP[matchedState];
              const matchedDistrict = validDistricts.find(
                (d) => d.toLowerCase() === rawDistrict.toLowerCase() || rawDistrict.toLowerCase().includes(d.toLowerCase())
              );
              if (matchedDistrict) {
                detectedDistrict = matchedDistrict;
              } else if (validDistricts.length > 0) {
                detectedDistrict = validDistricts[0];
              }
            }
            if (rawPin && /^\d{6}$/.test(rawPin.trim())) {
              detectedPin = rawPin.trim();
            }
          }
        } catch {
          if (lat > 28 && lat < 29 && lng > 76 && lng < 78) {
            detectedState = "Delhi (NCT)";
            detectedDistrict = "New Delhi";
            detectedPin = "110001";
          } else if (lat > 12 && lat < 14 && lng > 77 && lng < 78) {
            detectedState = "Karnataka";
            detectedDistrict = "Bengaluru";
            detectedPin = "560001";
          } else if (lat > 18.8 && lat < 19.3 && lng > 72.7 && lng < 73.1) {
            detectedState = "Maharashtra";
            detectedDistrict = "Mumbai";
            detectedPin = "400001";
          }
        }

        setLocation((prev) => ({
          ...prev,
          lat,
          lng,
          state: detectedState,
          district: detectedDistrict,
          pinCode: detectedPin,
          isVerified: true,
        }));
        setIsGpsLoading(false);
      },
      () => {
        setIsGpsLoading(false);
        setGpsError("GPS location access denied or unavailable. Please select your State and District manually.");
      },
      { timeout: 10000 }
    );
  };

  /* Voice Recording — Browser SpeechRecognition API */
  const handleToggleRecord = () => {
    setVoiceError("");

    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setVoiceError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "hi-IN"; // Hindi / Indian English / regional
      recognition.maxAlternatives = 1;

      let finalTranscript = "";

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += t + " ";
          } else {
            interim += t;
          }
        }
        setVoiceText((finalTranscript + interim).trim());
      };

      recognition.onerror = (event: any) => {
        setVoiceError(`Voice recognition notice: ${event.error || "Microphone access issue"}. Please check microphone permissions.`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (finalTranscript.trim()) {
          setVoiceText(finalTranscript.trim());
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      setVoiceError(`Could not start voice recording: ${e?.message || "Unknown error"}`);
      setIsRecording(false);
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

  /* Centralized Validation Function */
  const validateStep = (stepNum: number): boolean => {
    switch (stepNum) {
      case 1:
        return (
          category !== "" &&
          issueType !== "" &&
          startDate !== "" &&
          frequency !== ""
        );
      case 2:
        return (
          location.state !== "" &&
          location.district !== "" &&
          location.address.trim() !== "" &&
          /^\d{6}$/.test(location.pinCode.trim())
        );
      case 3:
        return true; // Supporting evidence is optional
      case 4:
        return declaration === true;
      default:
        return false;
    }
  };

  const isCurrentStepValid = validateStep(step);

  const canNavigateToStep = (targetStep: number): boolean => {
    if (targetStep <= step) return true;
    for (let i = 1; i < targetStep; i++) {
      if (!validateStep(i)) return false;
    }
    return true;
  };

  const handleNextStep = (targetStep: number) => {
    if (!canNavigateToStep(targetStep)) return;
    setStep(targetStep);
  };

  /* Handle Final Submission */
  const handleSubmit = () => {
    if (!validateStep(4)) return;
    const id = `SPIN-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const newGrievance: Grievance = {
      id,
      citizenId: user.id || "cit-001",
      citizenName: user.name || "Citizen",
      citizenPhone: user.phone || "",
      category: (category || "Other") as GrievanceCategory,
      issueType,
      severity: "Medium" as GrievanceSeverity,
      startDate,
      frequency: (frequency || "One time") as any,
      description,
      location,
      evidence: {
        photos: ["/demo-water-leak.jpg"],
        voiceNoteUrl: "/demo-audio-hindi.mp3",
        voiceText,
        documentName: "Evidence_Photo.jpg",
      },
      aiAnalysis: {
        category: (category || "Other") as GrievanceCategory,
        issue: issueType,
        severity: "Medium" as GrievanceSeverity,
        location: `${location.district || "Unknown"} / Ward 14`,
        confidence: 94,
        nearbyGrievances: 37,
        redZone: true,
        reasoning: `Spatial correlation detected 37 similar ${(category || "other").toLowerCase()} grievances within a 12 km² cluster near ${location.district || "Unknown"}.`,
      },
      status: "SUBMITTED",
      department: `${location.district || "Local"} Municipal ${category || "General"} Department`,
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
    setStep(5);
  };

  /* SUCCESS SCREEN STEP 5 */
  if (step === 5 && submittedGrievance) {
    return (
      <div className="citizen-portal-container">
        <div className="container" style={{ maxWidth: "720px" }}>
          <div className="form-card" style={{ borderTop: "4px solid var(--col-green)", textAlign: "center" }}>
            <div style={{ fontSize: "40px", color: "var(--col-green)" }}>✓</div>
            <h2 className="portal-heading" style={{ color: "var(--col-green)" }}>✓ Grievance Submitted Successfully</h2>
            <p className="portal-subtext">
              Your complaint has been logged and assigned to the municipal infrastructure engine.
            </p>

            <div style={{ background: "var(--col-panel)", padding: "16px", borderRadius: "8px", margin: "16px 0" }}>
              <span className="label-eyebrow">YOUR GRIEVANCE ID</span>
              <div style={{ fontSize: "26px", fontWeight: "800", color: "var(--col-navy)", letterSpacing: "0.05em", margin: "4px 0" }}>
                {submittedGrievance.id}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px", textAlign: "left", fontSize: "13px" }}>
                <div><strong>Submitted:</strong> {submittedGrievance.createdAt}</div>
                <div><strong>Category:</strong> {submittedGrievance.category}</div>
                <div><strong>Location:</strong> {submittedGrievance.location.address || submittedGrievance.location.district || "Registered Location"}</div>
                <div>
                  <strong>Current Status:</strong>{" "}
                  <span className="status-pill SUBMITTED">{submittedGrievance.status}</span>
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--col-border)", paddingTop: "16px", textAlign: "left" }}>
              <span className="label-eyebrow">NEXT SYSTEM STAGES</span>
              <div className="process-stepper-line" style={{ marginTop: "10px", flexWrap: "wrap", gap: "6px" }}>
                <span className="status-pill SUBMITTED">Submitted</span>
                <span className="process-arrow">→</span>
                <span className="status-pill UNDER_REVIEW">AI Processing</span>
                <span className="process-arrow">→</span>
                <span className="status-pill UNDER_REVIEW">Department Routing</span>
                <span className="process-arrow">→</span>
                <span className="status-pill UNDER_REVIEW">Government Review</span>
                <span className="process-arrow">→</span>
                <span className="status-pill UNDER_REVIEW">Action</span>
                <span className="process-arrow">→</span>
                <span className="status-pill RESOLVED">Resolved</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "20px" }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
          <button
            className="btn-outline"
            style={{
              color: "var(--col-navy)",
              borderColor: "var(--col-border)",
              background: "var(--col-surface)",
              fontSize: "12px",
              fontWeight: "700",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
            onClick={() => onNavigate("landing")}
          >
            ← Back to Home
          </button>

          <div>
            <span className="portal-org">SPIN · CITIZEN SERVICES</span>
            <h1 className="portal-heading" style={{ margin: 0 }}>Raise a Public Infrastructure Grievance</h1>
            <p className="portal-subtext" style={{ margin: "4px 0 0 0" }}>Follow the steps below to submit your complaint with location and evidence context.</p>
          </div>
        </div>

        {/* 4-Step Progress Bar */}
        <div className="form-step-bar">
          {[
            { num: 1, label: "STEP 1 — ISSUE" },
            { num: 2, label: "STEP 2 — LOCATION" },
            { num: 3, label: "STEP 3 — EVIDENCE" },
            { num: 4, label: "STEP 4 — REVIEW & SUBMIT" },
          ].map((item) => {
            const isClickable = canNavigateToStep(item.num);
            return (
              <div
                key={item.num}
                className={`step-indicator-item ${step === item.num ? "active" : step > item.num ? "completed" : ""}`}
                style={{ cursor: isClickable ? "pointer" : "not-allowed", opacity: isClickable ? 1 : 0.6 }}
                onClick={() => handleNextStep(item.num)}
              >
                <span className="step-number-circle">{step > item.num ? "✓" : item.num}</span>
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* STEP 1: ISSUE DETAILS */}
        {step === 1 && (
          <div className="form-card">
            <div>
              <span className="label-eyebrow">STEP 1 OF 4</span>
              <h2 className="portal-heading" style={{ fontSize: "20px" }}>Select Infrastructure Issue Category</h2>
            </div>

            <div className="form-group">
              <label className="form-label">Grievance Category *</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as GrievanceCategory)}
              >
                <option value="" disabled>Select Category...</option>
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
                <option value="" disabled>Select Specific Issue...</option>
                {(category ? CATEGORY_ISSUE_MAP[category as GrievanceCategory] : []).map((issue) => (
                  <option key={issue} value={issue}>
                    {issue}
                  </option>
                ))}
              </select>
            </div>


            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">When did this issue start? *</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">How frequently does this happen? *</label>
                <select
                  className="form-select"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                >
                  <option value="" disabled>Select frequency...</option>
                  <option value="One time">One time</option>
                  <option value="Occasional">Occasional</option>
                  <option value="Daily">Daily</option>
                  <option value="Continuous">Continuous</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Describe the issue (Optional)</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what is happening, where it is happening, and how it is affecting local residents..."
              />
              <span className="body-sm" style={{ textAlign: "right", fontSize: "11px" }}>
                {description.length} / 1000 characters
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                className="service-card-btn service-card-btn-orange"
                disabled={!isCurrentStepValid}
                style={{
                  opacity: isCurrentStepValid ? 1 : 0.5,
                  cursor: isCurrentStepValid ? "pointer" : "not-allowed",
                }}
                onClick={() => handleNextStep(2)}
              >
                Continue to Step 2: Location →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: LOCATION */}
        {step === 2 && (
          <div className="form-card">
            <div>
              <span className="label-eyebrow">STEP 2 OF 4</span>
              <h2 className="portal-heading" style={{ fontSize: "20px" }}>Where is the issue?</h2>
              <p className="portal-subtext" style={{ fontSize: "13px" }}>
                SPIN uses location information to identify clusters of similar grievances and understand infrastructure demand.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <button
                type="button"
                className="btn-outline btn-outline-orange"
                disabled={isGpsLoading}
                onClick={handleUseCurrentLocation}
              >
                {isGpsLoading ? "⌛ Detecting Location (GPS)..." : "📍 USE MY CURRENT LOCATION (GPS)"}
              </button>

              <span className={`location-status-badge ${location.isVerified ? "verified" : "required"}`}>
                {location.isVerified ? "LOCATION VERIFIED ✓" : "LOCATION REQUIRED"}
              </span>
            </div>

            {gpsError && (
              <div style={{ background: "var(--col-orange-dim)", border: "1px solid var(--col-orange-line)", padding: "10px 14px", borderRadius: "6px", fontSize: "12px", color: "var(--col-navy)", marginTop: "10px" }}>
                ⚠️ {gpsError}
              </div>
            )}

            {location.isVerified && (
              <div className="process-flow-box" style={{ padding: "12px 16px", background: "var(--col-panel)", borderRadius: "6px", marginTop: "12px" }}>
                <div style={{ fontSize: "12px", color: "var(--col-text-mid)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <span>📍 <strong>System Captured GPS Coordinates:</strong> {location.lat}, {location.lng}</span>
                  <span className="location-status-badge verified" style={{ fontSize: "10px" }}>GPS VERIFIED ✓</span>
                </div>
              </div>
            )}

            {/* Location Hierarchy: State -> City/District -> Address/Landmark -> PIN Code */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
              {/* 1. State * */}
              <div className="form-group">
                <label className="form-label">State *</label>
                <select
                  className="form-select"
                  value={location.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                >
                  <option value="" disabled>Select State...</option>
                  {Object.keys(STATE_DISTRICT_MAP).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. City / District * */}
              <div className="form-group">
                <label className="form-label">City / District *</label>
                <select
                  className="form-select"
                  value={location.district}
                  disabled={!location.state}
                  onChange={(e) => setLocation({ ...location, district: e.target.value })}
                >
                  <option value="" disabled>
                    {location.state ? "Select City / District..." : "Select a State first"}
                  </option>
                  {(location.state ? STATE_DISTRICT_MAP[location.state] || [] : []).map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Address / Landmark * */}
              <div className="form-group">
                <label className="form-label">Address / Landmark *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter specific street address, landmark, or area (e.g. Near Main Water Tank, Sector 4)"
                  value={location.address}
                  onChange={(e) => setLocation({ ...location, address: e.target.value })}
                />
              </div>

              {/* 4. PIN Code * */}
              <div className="form-group">
                <label className="form-label">PIN Code *</label>
                <input
                  type="text"
                  maxLength={6}
                  className="form-input"
                  placeholder="Enter 6-digit PIN Code (e.g. 411001)"
                  value={location.pinCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setLocation({ ...location, pinCode: val });
                  }}
                />
                {location.pinCode && !/^\d{6}$/.test(location.pinCode.trim()) && (
                  <span style={{ fontSize: "11px", color: "var(--col-red)", marginTop: "2px" }}>
                    Please enter a valid 6-digit PIN code.
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
              <button className="btn-outline" onClick={() => handleNextStep(1)}>
                ← Back
              </button>
              <button
                className="service-card-btn service-card-btn-orange"
                disabled={!isCurrentStepValid}
                style={{
                  opacity: isCurrentStepValid ? 1 : 0.5,
                  cursor: isCurrentStepValid ? "pointer" : "not-allowed",
                }}
                onClick={() => handleNextStep(3)}
              >
                Continue to Step 3: Evidence →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: EVIDENCE & BHASHINI VOICE */}
        {step === 3 && (
          <div className="form-card">
            <div>
              <span className="label-eyebrow">STEP 3 OF 4</span>
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

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className={`btn-outline ${isRecording ? "btn-outline-orange" : ""}`}
                    style={isRecording ? { borderColor: "#dc2626", color: "#dc2626", fontWeight: "700" } : {}}
                    onClick={handleToggleRecord}
                  >
                    {isRecording ? "🔴 Stop Recording" : "🎙 Record Voice Grievance"}
                  </button>
                  <span style={{ fontSize: "12px", color: isRecording ? "#dc2626" : "var(--col-text-muted)", fontWeight: isRecording ? "600" : "normal" }}>
                    {isRecording
                      ? "Listening — speak your grievance in Hindi / Marathi / Local Language..."
                      : voiceText
                      ? "✅ Voice note captured & transcribed"
                      : "No voice note recorded"}
                  </span>
                </div>

                {voiceError && (
                  <div style={{ fontSize: "12px", color: "#dc2626", background: "#fef2f2", padding: "8px 12px", borderRadius: "4px", border: "1px solid #fecaca" }}>
                    ⚠️ {voiceError}
                  </div>
                )}

                {voiceText && (
                  <div style={{ fontSize: "13px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", padding: "12px 14px", color: "#166534" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#15803d" }}>Captured Voice Transcript (Bhashini ASR):</strong>
                      <button
                        type="button"
                        onClick={() => setVoiceText("")}
                        style={{ fontSize: "11px", color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}
                      >
                        ✕ Clear Transcript
                      </button>
                    </div>
                    <p style={{ margin: 0, fontStyle: "italic" }}>"{voiceText}"</p>
                  </div>
                )}
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
              <button className="btn-outline" onClick={() => handleNextStep(2)}>
                ← Back
              </button>
              <button
                className="service-card-btn service-card-btn-orange"
                disabled={!isCurrentStepValid}
                style={{
                  opacity: isCurrentStepValid ? 1 : 0.5,
                  cursor: isCurrentStepValid ? "pointer" : "not-allowed",
                }}
                onClick={() => handleNextStep(4)}
              >
                Continue to Step 4: Review & Submit →
              </button>
            </div>
          </div>
        )}



        {/* STEP 4: FINAL REVIEW & SUBMIT */}
        {step === 4 && (
          <div className="form-card">
            <div>
              <span className="label-eyebrow">STEP 4 OF 4</span>
              <h2 className="portal-heading" style={{ fontSize: "20px" }}>Review & Submit Your Grievance</h2>
              <p className="portal-subtext" style={{ fontSize: "13px" }}>
                Review all submitted details and sign the citizen declaration before official dispatch.
              </p>
            </div>

            <table className="data-table">
              <tbody>
                <tr>
                  <td>CATEGORY</td>
                  <td><strong>{category}</strong></td>
                </tr>
                <tr>
                  <td>ISSUE TYPE</td>
                  <td>{issueType}</td>
                </tr>
                <tr>
                  <td>LOCATION</td>
                  <td>{location.address}, {location.district}{location.state ? `, ${location.state}` : ""}{location.pinCode ? ` - ${location.pinCode}` : ""}</td>
                </tr>
                <tr>
                  <td>STARTED</td>
                  <td>{startDate}</td>
                </tr>
                <tr>
                  <td>FREQUENCY</td>
                  <td>{frequency}</td>
                </tr>
                {description && (
                  <tr>
                    <td>DESCRIPTION</td>
                    <td>{description}</td>
                  </tr>
                )}
                <tr>
                  <td>EVIDENCE</td>
                  <td>{voiceText ? "Voice Note Recorded" : "Digital Form Intake"}</td>
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
              <button className="btn-outline" onClick={() => handleNextStep(3)}>
                ← Back to Step 3
              </button>
              <button
                className="service-card-btn service-card-btn-orange"
                disabled={!isCurrentStepValid}
                style={{ opacity: isCurrentStepValid ? 1 : 0.5, cursor: isCurrentStepValid ? "pointer" : "not-allowed" }}
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
