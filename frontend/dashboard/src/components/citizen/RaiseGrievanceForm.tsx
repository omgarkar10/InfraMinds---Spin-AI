import React, { useState, useEffect } from "react";
import "../../styles/citizen.css";
import {
  submitRequestToBackend,
  uploadEvidenceToBackend,
  analyzeRequestWithGemini,
  SubmitRequestPayload,
} from "../../services/grievanceService";
import type { CitizenUser } from "../../types";

interface RaiseGrievanceFormProps {
  user: CitizenUser;
  onNavigate: (view: string, grievanceId?: string) => void;
}

// ── Canonical Categories & Issues ──────────────────────────────────────────
const CATEGORY_ISSUE_MAP: Record<string, string[]> = {
  "Water Supply": [
    "Pipeline leakage / burst",
    "No water supply",
    "Low pressure",
    "Contaminated water",
    "Irregular supply hours",
    "New piped drinking water connection needed",
    "Water storage tank required",
    "Other water issue",
  ],
  "Roads & Potholes": [
    "Pothole",
    "Damaged asphalt road",
    "Road blockage / debris",
    "Missing traffic signage",
    "Unsafe road condition",
    "All-weather paved road needed",
    "Pedestrian footpath / sidewalk needed",
    "Speed breaker installation needed",
    "Other road issue",
  ],
  "Drainage / Flooding": [
    "Clogged drainage pipe",
    "Overflowing sewer main",
    "Waterlogging on street",
    "Broken storm drain cover",
    "Covered stormwater drainage network needed",
    "Other drainage issue",
  ],
  "Electricity": [
    "Frequent load shedding",
    "Transformer failure / sparks",
    "High/Low voltage fluctuation",
    "Dangling power lines",
    "Agricultural power feeder line needed",
    "Substation capacity upgrade needed",
    "Other electrical issue",
  ],
  "Waste Management": [
    "Garbage dump not cleared",
    "Overflowing community bin",
    "Illegal waste dumping",
    "Hazardous waste on public land",
    "Door-to-door waste collection needed",
    "Community compost / recycling facility needed",
    "Other sanitation issue",
  ],
  "Street Lighting": [
    "Street light not working",
    "Flickering streetlight",
    "Dark stretch / No lights installed",
    "Damaged electric pole",
    "Solar street lights installation needed",
  ],
  "Public Transport": [
    "Irregular bus schedule",
    "Damaged bus shelter",
    "Overcrowded transit route",
    "Missing timetable board",
    "New public bus stop / route required",
    "Feeder service to railway station needed",
  ],
  "Healthcare & Hospitals": [
    "Primary Health Centre (PHC) building needed",
    "Hospital staff / doctor shortage",
    "Medicine unavailability",
    "Emergency ambulance delay",
    "Maternal and child wellness clinic needed",
    "Diagnostic testing laboratory needed",
  ],
  "Education": [
    "Government school classroom construction",
    "Drinking water & sanitation in school",
    "Digital classroom / computer lab needed",
    "Boundary wall and playground required",
    "Community library / study room needed",
  ],
  "Public Infrastructure": [
    "Community hall / Panchayat building needed",
    "Bridge or culvert construction required",
    "Public park / open gym installation",
    "Foot-overbridge for pedestrian crossing",
    "Public toilet / sanitation block needed",
  ],
  "Public Safety & Law Enforcement": [
    "Traffic signal installation needed",
    "CCTV surveillance cameras needed",
    "Police checkpost / beat patrol required",
    "Fire hydrant installation",
    "Public safety hazard",
  ],
  "Other": [
    "Other civic infrastructure problem",
    "Other community development proposal",
  ],
};

// ── Nationwide 36 States & UTs Geographic Dataset ──────────────────────────
export const STATE_DISTRICT_MAP: Record<string, string[]> = {
  "Andaman and Nicobar Islands": ["Nicobars", "North and Middle Andaman", "South Andaman", "Other / Not Listed"],
  "Andhra Pradesh": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa", "Tirupati", "Vijayawada", "Other / Not Listed"],
  "Arunachal Pradesh": ["Changlang", "East Kameng", "East Siang", "Itanagar", "Papum Pare", "Tawang", "West Kameng", "Other / Not Listed"],
  "Assam": ["Barpeta", "Cachar", "Dibrugarh", "Guwahati (Kamrup Metro)", "Jorhat", "Kamrup", "Nagaon", "Silchar", "Sonitpur", "Tezpur", "Other / Not Listed"],
  "Bihar": ["Bhagalpur", "Darbhanga", "Gaya", "Muzaffarpur", "Patna", "Purnia", "Rohtas", "Samastipur", "Saran", "Vaishali", "Other / Not Listed"],
  "Chandigarh": ["Chandigarh", "Other / Not Listed"],
  "Chhattisgarh": ["Bilaspur", "Durg", "Korba", "Raigarh", "Raipur", "Rajnandgaon", "Bastar", "Other / Not Listed"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli", "Daman", "Diu", "Other / Not Listed"],
  "Delhi (NCT)": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi", "Other / Not Listed"],
  "Goa": ["North Goa", "South Goa", "Panaji", "Margao", "Other / Not Listed"],
  "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Bhavnagar", "Gandhinagar", "Jamnagar", "Junagadh", "Kutch", "Mehsana", "Rajkot", "Surat", "Vadodara", "Valsad", "Other / Not Listed"],
  "Haryana": ["Ambala", "Faridabad", "Gurugram", "Hisar", "Karnal", "Panipat", "Panchkula", "Rohtak", "Sonipat", "Yamunanagar", "Other / Not Listed"],
  "Himachal Pradesh": ["Chamba", "Hamirpur", "Kangra", "Kullu", "Mandi", "Shimla", "Solan", "Other / Not Listed"],
  "Jammu and Kashmir": ["Anantnag", "Baramulla", "Jammu", "Kathua", "Pulwama", "Srinagar", "Udhampur", "Other / Not Listed"],
  "Jharkhand": ["Bokaro", "Deoghar", "Dhanbad", "East Singhbhum (Jamshedpur)", "Hazaribagh", "Ranchi", "Other / Not Listed"],
  "Karnataka": ["Belagavi", "Ballari", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Dakshina Kannada (Mangaluru)", "Davanagere", "Dharwad (Hubballi)", "Kalaburagi", "Mysuru", "Shivamogga", "Tumakuru", "Udupi", "Other / Not Listed"],
  "Kerala": ["Alappuzha", "Ernakulam (Kochi)", "Idukki", "Kannur", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Thiruvananthapuram", "Thrissur", "Other / Not Listed"],
  "Ladakh": ["Kargil", "Leh", "Other / Not Listed"],
  "Lakshadweep": ["Kavaratti", "Agatti", "Minicoy", "Other / Not Listed"],
  "Madhya Pradesh": ["Bhopal", "Gwalior", "Indore", "Jabalpur", "Rewa", "Sagar", "Satna", "Ujjain", "Other / Not Listed"],
  "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Chhatrapati Sambhajinagar", "Jalgaon", "Kolhapur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nashik", "Navi Mumbai", "Pimpri-Chinchwad", "Pune", "Sangli", "Satara", "Solapur", "Thane", "Other / Not Listed"],
  "Manipur": ["Bishnupur", "Churachandpur", "Imphal East", "Imphal West", "Thoubal", "Other / Not Listed"],
  "Meghalaya": ["East Khasi Hills (Shillong)", "West Garo Hills (Tura)", "Ri-Bhoi", "Other / Not Listed"],
  "Mizoram": ["Aizawl", "Champhai", "Lunglei", "Other / Not Listed"],
  "Nagaland": ["Dimapur", "Kohima", "Mokokchung", "Wokha", "Other / Not Listed"],
  "Odisha": ["Balasore", "Berhampur (Ganjam)", "Bhadrak", "Bhubaneswar (Khurda)", "Cuttack", "Puri", "Rourkela (Sundargarh)", "Sambalpur", "Other / Not Listed"],
  "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam", "Other / Not Listed"],
  "Punjab": ["Amritsar", "Bathinda", "Hoshiarpur", "Jalandhar", "Ludhiana", "Mohali (SAS Nagar)", "Patiala", "Other / Not Listed"],
  "Rajasthan": ["Ajmer", "Alwar", "Bikaner", "Bharatpur", "Bhilwara", "Jaipur", "Jodhpur", "Kota", "Sikar", "Udaipur", "Other / Not Listed"],
  "Sikkim": ["Gangtok (East Sikkim)", "Namchi (South Sikkim)", "Gyalshing (West Sikkim)", "Mangan (North Sikkim)", "Other / Not Listed"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Cuddalore", "Dindigul", "Erode", "Kanchipuram", "Madurai", "Salem", "Thanjavur", "Tiruchirappalli", "Tirunelveli", "Tiruppur", "Vellore", "Other / Not Listed"],
  "Telangana": ["Hyderabad", "Karimnagar", "Khammam", "Mahbubnagar", "Nalgonda", "Nizamabad", "Rangareddy", "Warangal", "Other / Not Listed"],
  "Tripura": ["Agartala (West Tripura)", "Dharmanagar (North Tripura)", "Gomati", "South Tripura", "Other / Not Listed"],
  "Uttar Pradesh": ["Agra", "Aligarh", "Ayodhya", "Bareilly", "Ghaziabad", "Gorakhpur", "Jhansi", "Kanpur", "Lucknow", "Mathura", "Meerut", "Moradabad", "Noida (Gautam Buddha Nagar)", "Prayagraj", "Varanasi", "Other / Not Listed"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Rishikesh", "Rudrapur (Udham Singh Nagar)", "Other / Not Listed"],
  "West Bengal": ["Asansol (Paschim Bardhaman)", "Darjeeling", "Durgapur", "Howrah", "Kolkata", "Malda", "North 24 Parganas", "Siliguri (Jalpaiguri)", "South 24 Parganas", "Other / Not Listed"],
};

export const RaiseGrievanceForm: React.FC<RaiseGrievanceFormProps> = ({ user, onNavigate }) => {
  const [step, setStep] = useState<number>(1);

  // ── Step 1 State ─────────────────────────────────────────────────────────
  const [requestType, setRequestType] = useState<"existing_problem" | "new_development">("existing_problem");
  const [category, setCategory] = useState<string>("Water Supply");
  const [specificIssue, setSpecificIssue] = useState<string>("Pipeline leakage / burst");
  const [description, setDescription] = useState<string>("");

  // Type A specific (Existing Problem)
  const [startDate, setStartDate] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("Continuous");

  // Type B specific (New Development)
  const [proposedFacility, setProposedFacility] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [intendedBeneficiaries, setIntendedBeneficiaries] = useState<string>("");

  // Speech Recognition & Voice Intake
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechTranscript, setSpeechTranscript] = useState<string>("");
  const [speechLanguage, setSpeechLanguage] = useState<string>("hi-IN");
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // AI Interpretation State
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<"success" | "unavailable" | "error" | null>(null);

  // ── Step 2 State (Location) ──────────────────────────────────────────────
  const [state, setState] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [landmark, setLandmark] = useState<string>("");
  const [pincode, setPincode] = useState<string>("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);
  const [gpsConfirmed, setGpsConfirmed] = useState<boolean>(false);

  // ── Step 3 State (Evidence Upload) ───────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedEvidenceUrls, setUploadedEvidenceUrls] = useState<string[]>([]);
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([]);

  // ── Step 4 State (Review & Submission) ───────────────────────────────────
  const [declaration, setDeclaration] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<{
    grievance_id: string;
    created_at: string;
    bigquery_synced: boolean;
  } | null>(null);

  // Initialize SpeechRecognition on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = speechLanguage;

        rec.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setSpeechTranscript((prev) => (prev ? `${prev} ${text}` : text));
          setIsListening(false);
        };

        rec.onerror = (e: any) => {
          setIsListening(false);
          setAiMessage(`Microphone input note: ${e.error || "unavailable"}. You can type directly below.`);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        setRecognitionInstance(rec);
        setSpeechSupported(true);
      } else {
        setSpeechSupported(false);
      }
    }
  }, [speechLanguage]);

  // Update speech recognition language when changed
  const handleLanguageChange = (lang: string) => {
    setSpeechLanguage(lang);
    if (recognitionInstance) {
      recognitionInstance.lang = lang;
    }
  };

  const toggleListening = () => {
    if (!recognitionInstance) {
      alert("Speech recognition is not supported in this browser. Please type your request.");
      return;
    }
    if (isListening) {
      recognitionInstance.stop();
      setIsListening(false);
    } else {
      try {
        recognitionInstance.start();
        setIsListening(true);
        setAiMessage(null);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const handleUseTranscriptAsDescription = () => {
    if (speechTranscript.trim()) {
      setDescription((prev) => (prev ? `${prev}\n${speechTranscript.trim()}` : speechTranscript.trim()));
      setSpeechTranscript("");
    }
  };

  // Category change handler
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const issues = CATEGORY_ISSUE_MAP[newCat] || ["Other"];
    setSpecificIssue(issues[0]);
    if (requestType === "new_development") {
      setProposedFacility(issues[0]);
    }
  };

  // Google AI Interpretation Trigger
  const handleAnalyzeWithGemini = async () => {
    const textToAnalyze = (description.trim() || speechTranscript.trim());
    if (textToAnalyze.length < 5) {
      setAiMessage("Please enter at least 5 characters in your request before requesting AI analysis.");
      setAiStatus("error");
      return;
    }

    setIsAiLoading(true);
    setAiMessage(null);
    setAiStatus(null);

    try {
      const res = await analyzeRequestWithGemini(textToAnalyze, requestType);
      setAiStatus(res.status);
      setAiMessage(res.message);

      if (res.status === "success" && res.data) {
        if (res.data.category && CATEGORY_ISSUE_MAP[res.data.category]) {
          setCategory(res.data.category);
        }
        if (res.data.specific_issue) {
          setSpecificIssue(res.data.specific_issue);
          if (requestType === "new_development") {
            setProposedFacility(res.data.specific_issue);
          }
        }
        if (res.data.description && !description) {
          setDescription(res.data.description);
        }
        if (res.data.state && STATE_DISTRICT_MAP[res.data.state]) {
          setState(res.data.state);
          if (res.data.district) {
            setDistrict(res.data.district);
          }
        }
        if (res.data.landmark && !landmark) {
          setLandmark(res.data.landmark);
        }
        if (res.data.reason && requestType === "new_development") {
          setReason(res.data.reason);
        }
        if (res.data.intended_beneficiaries && requestType === "new_development") {
          setIntendedBeneficiaries(res.data.intended_beneficiaries);
        }
      }
    } catch (err: any) {
      setAiStatus("unavailable");
      setAiMessage(err.message || "AI interpretation service unavailable. Please enter details manually.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // State dropdown change
  const handleStateChange = (selectedState: string) => {
    setState(selectedState);
    const districts = STATE_DISTRICT_MAP[selectedState] || [];
    setDistrict(districts.length > 0 ? districts[0] : "");
  };

  // Geolocation trigger (Optional, non-defaulting, requires explicit confirmation)
  const handleDetectCoordinates = () => {
    if (!navigator.geolocation) {
      setGpsMessage("GPS geolocation is not supported in this browser. Please select your location manually.");
      return;
    }
    setIsGpsLoading(true);
    setGpsMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        setLatitude(lat);
        setLongitude(lng);
        setIsGpsLoading(false);
        setGpsConfirmed(false);
        setGpsMessage(`Detected Coordinates: ${lat}, ${lng}. Please confirm if this is the actual site of the infrastructure need.`);

        // Reverse geocode via OpenStreetMap Nominatim
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
            headers: { "User-Agent": "SPIN-CitizenPortal/1.0" },
          });
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const rawState = addr.state || "";
            const rawDistrict = addr.city || addr.town || addr.county || addr.state_district || "";
            const rawPin = addr.postcode || "";

            const matchedState = Object.keys(STATE_DISTRICT_MAP).find(
              (s) => s.toLowerCase() === rawState.toLowerCase() || rawState.toLowerCase().includes(s.toLowerCase())
            );
            if (matchedState && !state) {
              setState(matchedState);
              const validDistricts = STATE_DISTRICT_MAP[matchedState];
              const matchedDistrict = validDistricts.find(
                (d) => d.toLowerCase() === rawDistrict.toLowerCase() || rawDistrict.toLowerCase().includes(d.toLowerCase())
              );
              if (matchedDistrict) {
                setDistrict(matchedDistrict);
              }
            }
            if (rawPin && /^\d{6}$/.test(rawPin.trim()) && !pincode) {
              setPincode(rawPin.trim());
            }
          }
        } catch {
          // Do nothing; preserve manual entry
        }
      },
      (error) => {
        setIsGpsLoading(false);
        setGpsMessage(`Location access denied or unavailable (${error.message}). Please enter your location manually.`);
      },
      { timeout: 10000 }
    );
  };

  // Evidence file upload handler
  const handleFileUpload = async () => {
    if (!selectedFile) return;

    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase();
    if (!allowed.includes(ext)) {
      setUploadError(`Unsupported format: ${ext}. Please choose a JPG, PNG, WEBP, or PDF file.`);
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setUploadError("File exceeds 5 MB limit. Please select a smaller file.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await uploadEvidenceToBackend(selectedFile);
      setUploadedEvidenceUrls((prev) => [...prev, res.url]);
      setUploadedFileNames((prev) => [...prev, res.filename]);
      setSelectedFile(null);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file to backend.");
    } finally {
      setIsUploading(false);
    }
  };

  // Step validation
  const validateStep = (s: number): boolean => {
    switch (s) {
      case 1:
        if (description.trim().length < 5) return false;
        if (!category) return false;
        return true;
      case 2:
        if (!state.trim()) return false;
        if (!district.trim()) return false;
        if (!address.trim()) return false;
        if (pincode && !/^\d{6}$/.test(pincode.trim())) return false;
        return true;
      case 3:
        return true; // Optional supporting evidence
      case 4:
        return declaration === true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep((prev) => Math.min(prev + 1, 4));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Final submission to authoritative backend
  const handleSubmitFinal = async () => {
    if (!validateStep(4)) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const payload: SubmitRequestPayload = {
      request_type: requestType,
      category,
      specific_issue: requestType === "existing_problem" ? specificIssue : proposedFacility || specificIssue,
      description: description.trim(),
      state: state || undefined,
      district: district || undefined,
      landmark: landmark.trim() || undefined,
      address: address.trim() || undefined,
      pincode: pincode.trim() || undefined,
      latitude: gpsConfirmed && latitude !== null ? latitude : null,
      longitude: gpsConfirmed && longitude !== null ? longitude : null,
      start_date: requestType === "existing_problem" ? startDate || undefined : undefined,
      frequency: requestType === "existing_problem" ? frequency || undefined : undefined,
      reason: requestType === "new_development" ? reason.trim() || undefined : undefined,
      intended_beneficiaries: requestType === "new_development" ? intendedBeneficiaries.trim() || undefined : undefined,
      evidence_urls: uploadedEvidenceUrls.length > 0 ? uploadedEvidenceUrls : undefined,
      source_language: speechLanguage.split("-")[0] || "auto",
    };

    try {
      const res = await submitRequestToBackend(payload);
      setSubmissionResult({
        grievance_id: res.grievance_id,
        created_at: res.created_at,
        bigquery_synced: res.bigquery_synced,
      });
      setStep(5);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit request to official backend. Please check your data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 5: Authoritative Success Screen ──────────────────────────────────
  if (step === 5 && submissionResult) {
    return (
      <div className="citizen-portal-container">
        <div className="container" style={{ maxWidth: "760px" }}>
          <div className="form-card" style={{ borderTop: "4px solid var(--col-green)", textAlign: "center" }}>
            <div style={{ fontSize: "44px", color: "var(--col-green)", marginBottom: "8px" }}>✓</div>
            <h2 className="portal-heading" style={{ color: "var(--col-green)", fontSize: "24px" }}>
              Request Registered Successfully
            </h2>
            <p className="portal-subtext" style={{ fontSize: "14px", maxWidth: "580px", margin: "0 auto 20px auto" }}>
              Your {requestType === "existing_problem" ? "infrastructure grievance" : "new infrastructure development request"} has been officially recorded in the authoritative SPIN registry.
            </p>

            <div style={{ background: "var(--col-panel)", padding: "20px", borderRadius: "8px", margin: "16px 0", border: "1px solid var(--col-border)" }}>
              <span className="label-eyebrow">OFFICIAL REQUEST ID</span>
              <div style={{ fontSize: "30px", fontWeight: "900", color: "var(--col-navy)", letterSpacing: "0.05em", margin: "8px 0" }}>
                {submissionResult.grievance_id}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "16px", textAlign: "left", fontSize: "13px" }}>
                <div><strong>Request Type:</strong> {requestType === "existing_problem" ? "Existing Problem" : "New Development Request"}</div>
                <div><strong>Category:</strong> {category}</div>
                <div><strong>State &amp; District:</strong> {district}, {state}</div>
                <div><strong>Status:</strong> <span className="status-pill SUBMITTED">SUBMITTED</span></div>
                <div><strong>Timestamp:</strong> {new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
                <div><strong>Cloud Warehouse Sync:</strong> {submissionResult.bigquery_synced ? "✓ Synchronized" : "Pending Scheduled Batch"}</div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--col-border)", paddingTop: "16px", textAlign: "left" }}>
              <span className="label-eyebrow">LIFECYCLE PROGRESSION</span>
              <div className="process-stepper-line" style={{ marginTop: "12px", flexWrap: "wrap", gap: "8px" }}>
                <span className="status-pill SUBMITTED">1. Registered</span>
                <span className="process-arrow">→</span>
                <span className="status-pill UNDER_REVIEW">2. Spatial Cluster Analysis</span>
                <span className="process-arrow">→</span>
                <span className="status-pill UNDER_REVIEW">3. Department Review</span>
                <span className="process-arrow">→</span>
                <span className="status-pill RESOLVED">4. Resolution &amp; Works</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "24px" }}>
              <button
                type="button"
                className="service-card-btn service-card-btn-orange"
                onClick={() => onNavigate("citizen-track", submissionResult.grievance_id)}
              >
                Track This Request →
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  setStep(1);
                  setDescription("");
                  setSpeechTranscript("");
                  setSelectedFile(null);
                  setUploadedEvidenceUrls([]);
                  setUploadedFileNames([]);
                  setSubmissionResult(null);
                  setDeclaration(false);
                }}
              >
                + Submit Another Request
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => onNavigate("citizen")}
              >
                Return to Citizen Dashboard
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
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <span className="portal-org">SPIN · CITIZEN INTAKE PORTAL</span>
            <h1 className="portal-heading" style={{ fontSize: "24px", marginTop: "4px" }}>
              Submit Infrastructure Demand
            </h1>
            <p className="portal-subtext" style={{ fontSize: "13px" }}>
              Report an existing breakdown or propose a new infrastructure development project.
            </p>
          </div>
          <button
            type="button"
            className="btn-outline"
            style={{ fontSize: "12px" }}
            onClick={() => onNavigate("citizen")}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="form-step-bar" style={{ marginBottom: "24px" }}>
          {[
            { num: 1, label: "STEP 1 · DESCRIBE NEED" },
            { num: 2, label: "STEP 2 · VERIFY LOCATION" },
            { num: 3, label: "STEP 3 · EVIDENCE (OPTIONAL)" },
            { num: 4, label: "STEP 4 · REVIEW & CONFIRM" },
          ].map((item) => (
            <div
              key={item.num}
              className={`step-indicator-item ${step === item.num ? "active" : step > item.num ? "completed" : ""}`}
              onClick={() => {
                if (item.num < step || validateStep(step)) {
                  setStep(item.num);
                }
              }}
              style={{ cursor: item.num <= step ? "pointer" : "default" }}
            >
              <span className="step-number-circle">{step > item.num ? "✓" : item.num}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* STEP 1: DESCRIBE YOUR NEED */}
        {step === 1 && (
          <div className="form-card">
            <h2 className="editorial-h3" style={{ fontSize: "18px", marginBottom: "16px" }}>
              Step 1 — Describe Your Infrastructure Need
            </h2>

            {/* Request Type Selector */}
            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                What type of submission are you making? <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setRequestType("existing_problem");
                    handleCategoryChange(category);
                  }}
                  style={{
                    padding: "16px",
                    borderRadius: "8px",
                    border: requestType === "existing_problem" ? "2px solid var(--col-orange)" : "1px solid var(--col-border)",
                    background: requestType === "existing_problem" ? "rgba(224, 90, 43, 0.08)" : "#fff",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "var(--col-navy)", fontSize: "14px" }}>
                    ⚠️ Existing Infrastructure Problem
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--col-text-muted)", marginTop: "4px" }}>
                    Report broken pipes, potholes, power cuts, waterlogging, or damaged public assets.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequestType("new_development");
                    handleCategoryChange(category);
                  }}
                  style={{
                    padding: "16px",
                    borderRadius: "8px",
                    border: requestType === "new_development" ? "2px solid var(--col-orange)" : "1px solid var(--col-border)",
                    background: requestType === "new_development" ? "rgba(224, 90, 43, 0.08)" : "#fff",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "var(--col-navy)", fontSize: "14px" }}>
                    🏗️ New Infrastructure Development Request
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--col-text-muted)", marginTop: "4px" }}>
                    Propose a new school room, clinic, paved road, water line, or community center.
                  </div>
                </button>
              </div>
            </div>

            {/* Voice Intake (Speak Your Request) */}
            <div style={{ background: "var(--col-panel)", padding: "16px", borderRadius: "8px", marginBottom: "20px", border: "1px solid var(--col-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span className="label-eyebrow">SPEAK YOUR REQUEST (MULTILINGUAL VOICE INTAKE)</span>
                <select
                  value={speechLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="form-input"
                  style={{ width: "auto", padding: "4px 8px", fontSize: "12px" }}
                >
                  <option value="hi-IN">Hindi (हिन्दी)</option>
                  <option value="en-IN">English (India)</option>
                  <option value="mr-IN">Marathi (मराठी)</option>
                  <option value="ta-IN">Tamil (தமிழ்)</option>
                  <option value="te-IN">Telugu (తెలుగు)</option>
                  <option value="bn-IN">Bengali (বাংলা)</option>
                  <option value="gu-IN">Gujarati (ગુજરાતી)</option>
                  <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
                  <option value="ml-IN">Malayalam (മലയാളം)</option>
                  <option value="pa-IN">Punjabi (ਪੰਜਾਬੀ)</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={toggleListening}
                  className="btn-primary"
                  style={{
                    background: isListening ? "#dc2626" : "var(--col-orange)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    fontSize: "13px",
                  }}
                >
                  <span>{isListening ? "⏹ Stop Speaking" : "🎙️ Speak Your Request"}</span>
                </button>
                <span style={{ fontSize: "12px", color: "var(--col-text-muted)" }}>
                  {isListening
                    ? "Listening... Speak clearly into your microphone."
                    : speechSupported
                    ? "Click to speak in your preferred regional language."
                    : "Browser speech recognition unavailable; please type your request."}
                </span>
              </div>

              {speechTranscript && (
                <div style={{ marginTop: "12px" }}>
                  <label className="form-label" style={{ fontSize: "12px" }}>
                    Recognized Voice Transcript (Editable):
                  </label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={speechTranscript}
                    onChange={(e) => setSpeechTranscript(e.target.value)}
                    style={{ fontSize: "13px", marginTop: "4px" }}
                  />
                  <div style={{ marginTop: "6px", display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={handleUseTranscriptAsDescription}
                      style={{ fontSize: "12px", padding: "4px 10px" }}
                    >
                      Use Transcript as Description ↓
                    </button>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => setSpeechTranscript("")}
                      style={{ fontSize: "12px", padding: "4px 10px" }}
                    >
                      Clear Transcript
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Description Text Area */}
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="form-label" htmlFor="description">
                  {requestType === "existing_problem" ? "Describe the Problem in Detail" : "Describe the Proposed Development Project"}{" "}
                  <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={handleAnalyzeWithGemini}
                  disabled={isAiLoading || description.trim().length < 5}
                  style={{
                    fontSize: "12px",
                    padding: "4px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {isAiLoading ? "Analyzing with Gemini..." : "✨ Auto-Classify with Google AI"}
                </button>
              </div>

              <textarea
                id="description"
                className="form-input"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  requestType === "existing_problem"
                    ? "e.g., The main drinking water pipeline on Station Road has ruptured near the community hospital. Water is flooding the road and 400 households have had no water for 2 days."
                    : "e.g., Our village needs an Anganwadi and primary study center. Currently, 250 children must walk 7 km along the highway to reach the nearest preschool facility."
                }
                required
                style={{ marginTop: "6px" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "11px", color: "var(--col-text-muted)" }}>
                <span>Minimum 5 characters required.</span>
                <span>{description.trim().length} characters</span>
              </div>
            </div>

            {/* AI Status / Notification Banner */}
            {aiMessage && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  fontSize: "12px",
                  background:
                    aiStatus === "success"
                      ? "rgba(16, 185, 129, 0.1)"
                      : aiStatus === "unavailable"
                      ? "rgba(245, 158, 11, 0.1)"
                      : "rgba(239, 68, 68, 0.1)",
                  border:
                    aiStatus === "success"
                      ? "1px solid #10b981"
                      : aiStatus === "unavailable"
                      ? "1px solid #f59e0b"
                      : "1px solid #ef4444",
                  color: "var(--col-navy)",
                }}
              >
                {aiStatus === "success" && <strong>✓ Google AI: </strong>}
                {aiStatus === "unavailable" && <strong>ℹ️ Notice: </strong>}
                {aiStatus === "error" && <strong>⚠️ Notice: </strong>}
                {aiMessage}
              </div>
            )}

            {/* Category and Specific Issue Selection */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="category">
                  Infrastructure Category <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <select
                  id="category"
                  className="form-input"
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  {Object.keys(CATEGORY_ISSUE_MAP).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="specificIssue">
                  {requestType === "existing_problem" ? "Specific Issue" : "Proposed Facility"}{" "}
                  <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                {requestType === "existing_problem" ? (
                  <select
                    id="specificIssue"
                    className="form-input"
                    value={specificIssue}
                    onChange={(e) => setSpecificIssue(e.target.value)}
                  >
                    {(CATEGORY_ISSUE_MAP[category] || ["Other"]).map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="specificIssue"
                    type="text"
                    className="form-input"
                    value={proposedFacility}
                    onChange={(e) => setProposedFacility(e.target.value)}
                    placeholder="e.g., Primary Health Sub-Centre or 2km All-Weather Road"
                    required
                  />
                )}
              </div>
            </div>

            {/* Conditional Type A Fields (Existing Problem) */}
            {requestType === "existing_problem" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="startDate">
                    When did this problem start? (Optional)
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    className="form-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="frequency">
                    Frequency of Occurrence (Optional)
                  </label>
                  <select
                    id="frequency"
                    className="form-input"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                  >
                    <option value="Continuous">Continuous / Persistent</option>
                    <option value="Daily">Daily during peak hours</option>
                    <option value="Occasional">Occasional / Recurring</option>
                    <option value="During Monsoon / Rain">During rain / monsoon</option>
                  </select>
                </div>
              </div>
            )}

            {/* Conditional Type B Fields (New Development) */}
            {requestType === "new_development" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="reason">
                    Civic Justification / Need for Proposal
                  </label>
                  <input
                    id="reason"
                    type="text"
                    className="form-input"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., No healthcare facility within 12 km radius."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="intendedBeneficiaries">
                    Intended Beneficiaries (Target Population)
                  </label>
                  <input
                    id="intendedBeneficiaries"
                    type="text"
                    className="form-input"
                    value={intendedBeneficiaries}
                    onChange={(e) => setIntendedBeneficiaries(e.target.value)}
                    placeholder="e.g., 650 rural families, school children, daily commuters"
                  />
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button
                type="button"
                className="service-card-btn service-card-btn-orange"
                onClick={handleNext}
                disabled={!validateStep(1)}
              >
                Next: Verify Location →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: VERIFY LOCATION */}
        {step === 2 && (
          <div className="form-card">
            <h2 className="editorial-h3" style={{ fontSize: "18px", marginBottom: "8px" }}>
              Step 2 — Verify Location Across India
            </h2>
            <p className="portal-subtext" style={{ fontSize: "13px", marginBottom: "16px" }}>
              Please specify the precise geographic location where this infrastructure is needed.
            </p>

            {/* GPS Geolocation Trigger (Optional) */}
            <div style={{ background: "var(--col-panel)", padding: "14px", borderRadius: "8px", marginBottom: "20px", border: "1px solid var(--col-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <span className="label-eyebrow">OPTIONAL GPS PINPOINT</span>
                  <div style={{ fontSize: "13px", color: "var(--col-navy)", marginTop: "2px" }}>
                    Are you currently at the infrastructure site?
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={handleDetectCoordinates}
                  disabled={isGpsLoading}
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  {isGpsLoading ? "Detecting GPS..." : "📍 Detect My Coordinates"}
                </button>
              </div>

              {gpsMessage && (
                <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--col-navy)", background: "#fff", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--col-border)" }}>
                  {gpsMessage}
                  {latitude !== null && (
                    <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="checkbox"
                        id="gpsConfirm"
                        checked={gpsConfirmed}
                        onChange={(e) => setGpsConfirmed(e.target.checked)}
                        style={{ accentColor: "var(--col-orange)" }}
                      />
                      <label htmlFor="gpsConfirm" style={{ fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                        I confirm these coordinates ({latitude}, {longitude}) represent the actual infrastructure site.
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Nationwide State & District Dropdowns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="state">
                  State / Union Territory <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <select
                  id="state"
                  className="form-input"
                  value={state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  required
                >
                  <option value="">-- Select State or UT --</option>
                  {Object.keys(STATE_DISTRICT_MAP).sort().map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="district">
                  District <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <select
                  id="district"
                  className="form-input"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={!state}
                  required
                >
                  <option value="">-- Select District --</option>
                  {(STATE_DISTRICT_MAP[state] || []).map((dst) => (
                    <option key={dst} value={dst}>
                      {dst}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address and Landmark */}
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label" htmlFor="address">
                Street Address / Locality / Village <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <input
                id="address"
                type="text"
                className="form-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., Near Primary School, Rampur Village, Ward 4"
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="landmark">
                  Nearest Landmark (Optional)
                </label>
                <input
                  id="landmark"
                  type="text"
                  className="form-input"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g., Adjacent to Community Health Centre"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pincode">
                  Postal PIN Code (6 digits)
                </label>
                <input
                  id="pincode"
                  type="text"
                  maxLength={6}
                  className="form-input"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g., 570001"
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
              <button type="button" className="btn-outline" onClick={handleBack}>
                ← Back
              </button>
              <button
                type="button"
                className="service-card-btn service-card-btn-orange"
                onClick={handleNext}
                disabled={!validateStep(2)}
              >
                Next: Supporting Evidence →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUPPORTING EVIDENCE */}
        {step === 3 && (
          <div className="form-card">
            <h2 className="editorial-h3" style={{ fontSize: "18px", marginBottom: "8px" }}>
              Step 3 — Supporting Evidence (Optional)
            </h2>
            <p className="portal-subtext" style={{ fontSize: "13px", marginBottom: "16px" }}>
              Upload photographic proof or relevant documentation to substantiate your request.
            </p>

            <div style={{ background: "var(--col-panel)", padding: "20px", borderRadius: "8px", border: "2px dashed var(--col-border)", textAlign: "center", marginBottom: "20px" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>📎</div>
              <div style={{ fontWeight: 600, color: "var(--col-navy)", fontSize: "14px" }}>
                Select Photo or Document to Upload
              </div>
              <div style={{ fontSize: "12px", color: "var(--col-text-muted)", marginTop: "4px" }}>
                Supported formats: JPG, PNG, WEBP, PDF (Maximum 5 MB per file)
              </div>

              <div style={{ marginTop: "16px", display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <input
                  type="file"
                  id="evidenceFile"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                      setUploadError(null);
                    }
                  }}
                  style={{ fontSize: "12px" }}
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleFileUpload}
                  disabled={!selectedFile || isUploading}
                  style={{ fontSize: "12px", padding: "6px 14px" }}
                >
                  {isUploading ? "Uploading..." : "Upload File"}
                </button>
              </div>

              {uploadError && (
                <div style={{ color: "#dc2626", fontSize: "12px", marginTop: "10px" }}>
                  ⚠️ {uploadError}
                </div>
              )}
            </div>

            {/* List of successfully uploaded files */}
            {uploadedFileNames.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <span className="label-eyebrow">UPLOADED ATTACHMENTS ({uploadedFileNames.length})</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                  {uploadedFileNames.map((name, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "8px 12px",
                        background: "rgba(16, 185, 129, 0.08)",
                        border: "1px solid #10b981",
                        borderRadius: "6px",
                        fontSize: "13px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>✓ {name}</span>
                      <span style={{ fontSize: "11px", color: "var(--col-green)" }}>Stored on Server</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
              <button type="button" className="btn-outline" onClick={handleBack}>
                ← Back
              </button>
              <button
                type="button"
                className="service-card-btn service-card-btn-orange"
                onClick={handleNext}
              >
                Next: Review &amp; Confirm →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & CONFIRM */}
        {step === 4 && (
          <div className="form-card">
            <h2 className="editorial-h3" style={{ fontSize: "18px", marginBottom: "8px" }}>
              Step 4 — Review Your Submission
            </h2>
            <p className="portal-subtext" style={{ fontSize: "13px", marginBottom: "16px" }}>
              Please review your details carefully before submitting to the official government registry.
            </p>

            {submitError && (
              <div className="error-banner" style={{ marginBottom: "16px" }}>
                {submitError}
              </div>
            )}

            {/* Summary Review Grid */}
            <div style={{ background: "var(--col-panel)", padding: "16px", borderRadius: "8px", border: "1px solid var(--col-border)", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--col-border)", paddingBottom: "8px", marginBottom: "12px" }}>
                <span className="label-eyebrow">1. REQUEST PARTICULARS</span>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setStep(1)}
                  style={{ fontSize: "11px", padding: "2px 8px" }}
                >
                  Edit
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", marginBottom: "12px" }}>
                <div><strong>Submitting Citizen:</strong> {user.name || "Authenticated Citizen"} {user.phone ? `(${user.phone})` : ""}</div>
                <div><strong>Submission Type:</strong> {requestType === "existing_problem" ? "Existing Infrastructure Problem" : "New Infrastructure Development"}</div>
                <div><strong>Category:</strong> {category}</div>
                <div><strong>{requestType === "existing_problem" ? "Specific Issue" : "Proposed Facility"}:</strong> {requestType === "existing_problem" ? specificIssue : proposedFacility || specificIssue}</div>
                {requestType === "existing_problem" && (
                  <>
                    <div><strong>Start Date:</strong> {startDate || "Not specified"}</div>
                    <div><strong>Frequency:</strong> {frequency || "Not specified"}</div>
                  </>
                )}
                {requestType === "new_development" && (
                  <>
                    <div><strong>Civic Reason:</strong> {reason || "Not specified"}</div>
                    <div><strong>Intended Beneficiaries:</strong> {intendedBeneficiaries || "Not specified"}</div>
                  </>
                )}
              </div>

              <div style={{ fontSize: "13px", marginTop: "8px", borderTop: "1px dashed var(--col-border)", paddingTop: "8px" }}>
                <strong>Description:</strong>
                <p style={{ margin: "4px 0 0 0", color: "var(--col-navy)", whiteSpace: "pre-wrap" }}>
                  {description}
                </p>
              </div>
            </div>

            {/* Location Summary */}
            <div style={{ background: "var(--col-panel)", padding: "16px", borderRadius: "8px", border: "1px solid var(--col-border)", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--col-border)", paddingBottom: "8px", marginBottom: "12px" }}>
                <span className="label-eyebrow">2. CONFIRMED LOCATION</span>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setStep(2)}
                  style={{ fontSize: "11px", padding: "2px 8px" }}
                >
                  Edit
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                <div><strong>State / UT:</strong> {state}</div>
                <div><strong>District:</strong> {district}</div>
                <div><strong>Address:</strong> {address}</div>
                <div><strong>Landmark:</strong> {landmark || "None"}</div>
                <div><strong>PIN Code:</strong> {pincode || "None"}</div>
                <div><strong>Coordinates:</strong> {gpsConfirmed && latitude ? `${latitude}, ${longitude} (Confirmed)` : "Manual Selection"}</div>
              </div>
            </div>

            {/* Evidence Summary */}
            <div style={{ background: "var(--col-panel)", padding: "16px", borderRadius: "8px", border: "1px solid var(--col-border)", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--col-border)", paddingBottom: "8px", marginBottom: "12px" }}>
                <span className="label-eyebrow">3. ATTACHED EVIDENCE</span>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setStep(3)}
                  style={{ fontSize: "11px", padding: "2px 8px" }}
                >
                  Edit
                </button>
              </div>

              <div style={{ fontSize: "13px" }}>
                {uploadedFileNames.length > 0 ? (
                  uploadedFileNames.map((f, i) => (
                    <div key={i} style={{ color: "var(--col-navy)", padding: "2px 0" }}>
                      📎 {f}
                    </div>
                  ))
                ) : (
                  <span style={{ color: "var(--col-text-muted)" }}>No supporting evidence attached (optional).</span>
                )}
              </div>
            </div>

            {/* Mandatory Declaration Checkbox */}
            <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px", background: "rgba(224, 90, 43, 0.05)", padding: "12px", borderRadius: "6px", border: "1px solid var(--col-border)" }}>
              <input
                type="checkbox"
                id="declaration"
                checked={declaration}
                onChange={(e) => setDeclaration(e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: "var(--col-orange)", cursor: "pointer" }}
              />
              <label htmlFor="declaration" style={{ fontSize: "13px", color: "var(--col-navy)", cursor: "pointer", fontWeight: 600 }}>
                I hereby declare that this infrastructure demand represents a genuine civic need and the details provided are accurate to the best of my knowledge. <span style={{ color: "#e53e3e" }}>*</span>
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
              <button type="button" className="btn-outline" onClick={handleBack} disabled={isSubmitting}>
                ← Back
              </button>
              <button
                type="button"
                className="service-card-btn service-card-btn-orange"
                onClick={handleSubmitFinal}
                disabled={isSubmitting || !declaration}
                style={{ opacity: isSubmitting || !declaration ? 0.6 : 1 }}
              >
                {isSubmitting ? "Submitting to Official Registry..." : "Confirm & Submit Request →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
