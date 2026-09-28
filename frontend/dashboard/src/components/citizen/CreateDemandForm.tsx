import React, { useState, useEffect, useRef, useCallback } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import "../../styles/citizen.css";
import {
  submitRequestToBackend,
  uploadEvidenceToBackend,
  analyzeRequestWithGemini,
  SubmitRequestPayload,
} from "../../services/demandService";
import { translateText, speechToText } from "../../services/bhashiniService";
import type { CitizenUser } from "../../types";

interface CreateDemandFormProps {
  user: CitizenUser;
  onNavigate: (view: string, DemandId?: string) => void;
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
    "Other civic infrastructure need",
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

export const CreateDemandForm: React.FC<CreateDemandFormProps> = ({ user, onNavigate }) => {
  const [step, setStep] = useState<number>(1);

  // ── Pre-Step / Intake Choice State ───────────────────────────────────────
  const [intakeMode, setIntakeMode] = useState<"choose" | "voice" | "manual">("choose");
  const [detectedLanguage, setDetectedLanguage] = useState<string>("");
  const [isVoiceConfirmCardVisible, setIsVoiceConfirmCardVisible] = useState<boolean>(false);

  const placesLibrary = useMapsLibrary("places");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!placesLibrary || !containerRef.current) return;
    
    // Clear container to prevent duplicate elements in React StrictMode
    containerRef.current.innerHTML = '';
    
    // Programmatically instantiate the custom web component
    const autocompleteEl = new placesLibrary.PlaceAutocompleteElement();
    autocompleteEl.id = "address";
    autocompleteEl.setAttribute("style", "width: 100%; padding: 12px; border: 1px solid var(--col-border); border-radius: 6px; box-sizing: border-box; display: block;");
    
    const handlePlaceSelect = (e: any) => {
      const place = e.place; // or autocompleteEl.place
      if (place) {
        place.fetchFields({ fields: ['formattedAddress', 'location'] }).then(() => {
          const addr = place.formattedAddress || "";
          setAddress(addr);
          if (place.location) {
            setLatitude(place.location.lat());
            setLongitude(place.location.lng());
            setGpsConfirmed(true);
            setGpsMessage(`Location set to ${addr}.`);
          }
        });
      }
    };

    const handleInput = () => {
      // @ts-ignore
      setAddress(autocompleteEl.inputValue || "");
    };

    autocompleteEl.addEventListener('gmp-placeselect', handlePlaceSelect);
    autocompleteEl.addEventListener('input', handleInput);
    
    containerRef.current.appendChild(autocompleteEl);
    
    return () => {
      autocompleteEl.removeEventListener('gmp-placeselect', handlePlaceSelect);
      autocompleteEl.removeEventListener('input', handleInput);
      autocompleteEl.remove();
    };
  }, [placesLibrary, step]);


  // Calculate today's LOCAL date in YYYY-MM-DD format (avoids UTC offset shift)
  const getTodayLocalDateStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };
  const localTodayStr = getTodayLocalDateStr();

  // ── Step 1 State ─────────────────────────────────────────────────────────
  const [requestType, setRequestType] = useState<"existing_problem" | "new_development">("existing_problem");
  const [category, setCategory] = useState<string>("Water Supply");
  const [specificIssue, setSpecificIssue] = useState<string>("Pipeline leakage / burst");
  const [description, setDescription] = useState<string>("");

  // Type A specific (Current Need)
  const [startDate, setStartDate] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("Continuous");

  // Type B specific (New Development)
  const [proposedFacility, setProposedFacility] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [intendedBeneficiaries, setIntendedBeneficiaries] = useState<string>("");

  // Voice Recording & Bhashini ASR
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [speechTranscript, setSpeechTranscript] = useState<string>("");
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [spokenLanguage, setSpokenLanguage] = useState<string>("mr"); // Bhashini language code
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Bhashini translation state
  const [detectedLangCode, setDetectedLangCode] = useState<string>("");
  const [detectedLangName, setDetectedLangName] = useState<string>("");
  const [bhashiniTranslatedText, setBhashiniTranslatedText] = useState<string>("");
  const [isBhashiniLoading, setIsBhashiniLoading] = useState<boolean>(false);
  const [bhashiniError, setBhashiniError] = useState<string | null>(null);

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
    Demand_id: string;
    created_at: string;
    bigquery_synced: boolean;
  } | null>(null);

  // Check if microphone is available
  useEffect(() => {
    if (typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia) {
      setSpeechSupported(true);
    } else {
      setSpeechSupported(false);
    }
  }, []);

  // Re-translate when user manually edits the transcript text
  const runBhashiniTranslate = useCallback(async (text: string, langCode: string) => {
    if (!text || text.trim().length < 3) return;
    setIsBhashiniLoading(true);
    setBhashiniError(null);
    try {
      const result = await translateText(text, langCode, "en");
      setDetectedLangCode(langCode);
      const nameMap: Record<string, string> = { hi: "Hindi", bn: "Bengali", te: "Telugu", mr: "Marathi", ta: "Tamil", gu: "Gujarati", kn: "Kannada", ml: "Malayalam", pa: "Punjabi", or: "Odia", as: "Assamese", ur: "Urdu", en: "English", mai: "Maithili", mni: "Manipuri", sat: "Santali", kok: "Konkani", doi: "Dogri", sa: "Sanskrit", brx: "Bodo", ks: "Kashmiri", ne: "Nepali", sd: "Sindhi", raj: "Rajasthani", si: "Sinhala" };
      setDetectedLangName(nameMap[langCode] || langCode);
      setBhashiniTranslatedText(result.translated_text);
    } catch (err: any) {
      setBhashiniError("Translation unavailable. Proceeding with raw text.");
    } finally {
      setIsBhashiniLoading(false);
    }
  }, []);

  // Debounce — re-translate when the user manually edits the transcript
  useEffect(() => {
    const timer = setTimeout(() => {
      if (speechTranscript.trim().length >= 3) {
        runBhashiniTranslate(speechTranscript, spokenLanguage);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [speechTranscript, runBhashiniTranslate, spokenLanguage]);

  // ── Bhashini ASR: Record audio → send to server → get transcription ────
  const toggleRecording = async () => {
    if (isRecording) {
      // ── STOP recording ────────────────────────────────────────────────
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      // The onstop handler below will process the audio
    } else {
      // ── START recording ───────────────────────────────────────────────
      try {
        setBhashiniError(null);
        setAiMessage(null);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
        audioChunksRef.current = [];

        recorder.ondataavailable = (event: BlobEvent) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          // Release microphone
          stream.getTracks().forEach((track) => track.stop());
          setIsRecording(false);

          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          if (audioBlob.size < 1000) {
            setBhashiniError("Recording too short. Please speak for at least 1-2 seconds.");
            return;
          }

          // Convert to base64
          setIsTranscribing(true);
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(",")[1];
            try {
              const result = await speechToText(base64Audio, spokenLanguage, "en");
              if (result.transcribed_text) {
                // Show the native-script transcription
                setSpeechTranscript((prev) =>
                  prev ? `${prev} ${result.transcribed_text}` : result.transcribed_text
                );
                setDetectedLangCode(result.source_language);
                setDetectedLangName(result.source_language_name);
                // Show the English translation
                if (result.translated_text && result.translated_text !== result.transcribed_text) {
                  setBhashiniTranslatedText(result.translated_text);
                }
              } else {
                setBhashiniError("Could not understand speech. Please speak louder or try again.");
              }
            } catch (err: any) {
              setBhashiniError(err.message || "Speech recognition failed. Please try again.");
            } finally {
              setIsTranscribing(false);
            }
          };
          reader.readAsDataURL(audioBlob);
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecording(true);
      } catch (err: any) {
        setBhashiniError("Could not access microphone. Please allow microphone access and try again.");
        setIsRecording(false);
      }
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

  // SPIN AI Interpretation Trigger
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
      const res = await analyzeRequestWithGemini(textToAnalyze, requestType) as any;
      setAiStatus(res.status);
      setAiMessage(res.message);

      if (res.status === "success" && res.data) {
        if (res.data.request_type) {
          const cleanReqType = res.data.request_type.toLowerCase().includes("new") ? "new_development" : "existing_problem";
          setRequestType(cleanReqType);
        }
        if (res.data.detected_language) {
          setDetectedLanguage(res.data.detected_language);
        }
        if (res.data.category && CATEGORY_ISSUE_MAP[res.data.category]) {
          setCategory(res.data.category);
        }
        if (res.data.specific_issue) {
          setSpecificIssue(res.data.specific_issue);
          setProposedFacility(res.data.specific_issue);
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
        if (res.data.reason) {
          setReason(res.data.reason);
        }
        if (res.data.intended_beneficiaries) {
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
      source_language: detectedLangCode !== "auto" ? detectedLangCode : "auto",
      // Include the translated text for staff members!
      bhashini_translated_text: bhashiniTranslatedText || undefined,
    };

    try {
      const res = await submitRequestToBackend(payload);
      setSubmissionResult({
        Demand_id: res.Demand_id,
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
              Your {requestType === "existing_problem" ? "infrastructure proposal" : "new infrastructure development request"} has been officially recorded in the authoritative SPIN registry.
            </p>

            <div style={{ background: "var(--col-panel)", padding: "20px", borderRadius: "8px", margin: "16px 0", border: "1px solid var(--col-border)" }}>
              <span className="label-eyebrow">OFFICIAL REQUEST ID</span>
              <div style={{ fontSize: "30px", fontWeight: "900", color: "var(--col-navy)", letterSpacing: "0.05em", margin: "8px 0" }}>
                {submissionResult.Demand_id}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "16px", textAlign: "left", fontSize: "13px" }}>
                <div><strong>Request Type:</strong> {requestType === "existing_problem" ? "Current Need" : "New Development Request"}</div>
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
                <span className="status-pill RESOLVED">4. Adoption Stage &amp; Works</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "24px" }}>
              <button
                type="button"
                className="service-card-btn service-card-btn-orange"
                onClick={() => onNavigate("citizen-track", submissionResult.Demand_id)}
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
              Report an existing service gap or propose a new infrastructure development project.
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
          <>
            {/* PRE-STEP: INTAKE CHOICE */}
            {intakeMode === "choose" && (
              <div className="form-card" style={{ textAlign: "center", padding: "32px 24px" }}>
                <span className="label-eyebrow">INTAKE OPTION SELECTION</span>
                <h2 className="portal-heading" style={{ fontSize: "22px", marginTop: "6px", marginBottom: "8px" }}>
                  How would you like to describe your infrastructure need?
                </h2>
                <p className="portal-subtext" style={{ fontSize: "14px", maxWidth: "580px", margin: "0 auto 28px auto" }}>
                  Select your preferred way to provide details. Both paths lead to the same official SPIN request registry.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", maxWidth: "740px", margin: "0 auto" }}>
                  {/* OPTION A: Describe by Voice */}
                  <div
                    onClick={() => {
                      setIntakeMode("voice");
                      setSpeechTranscript("");
                      setAiMessage(null);
                      setIsVoiceConfirmCardVisible(false);
                      if (!isRecording) {
                        toggleRecording();
                      }
                    }}
                    style={{
                      padding: "24px",
                      borderRadius: "12px",
                      border: "2px solid var(--col-orange)",
                      background: "rgba(224, 90, 43, 0.04)",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div style={{ fontSize: "36px", marginBottom: "12px" }}>🎙️</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--col-navy)", marginBottom: "6px" }}>
                      Describe by Voice
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--col-text-muted)", lineHeight: "1.5" }}>
                      Speak naturally in Hindi, English, Marathi, Tamil, or any regional language. Speech is converted to text and structured automatically.
                    </div>
                    <div style={{ marginTop: "16px", color: "var(--col-orange)", fontWeight: 700, fontSize: "13px" }}>
                      Select Voice Intake →
                    </div>
                  </div>

                  {/* OPTION B: Enter Details Manually */}
                  <div
                    onClick={() => {
                      setIntakeMode("manual");
                    }}
                    style={{
                      padding: "24px",
                      borderRadius: "12px",
                      border: "1px solid var(--col-border)",
                      background: "#ffffff",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div style={{ fontSize: "36px", marginBottom: "12px" }}>✍️</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--col-navy)", marginBottom: "6px" }}>
                      Enter Details Manually
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--col-text-muted)", lineHeight: "1.5" }}>
                      Standard step-by-step form. Select request type, infrastructure category, and enter details using text or optional dictation.
                    </div>
                    <div style={{ marginTop: "16px", color: "var(--col-navy)", fontWeight: 700, fontSize: "13px" }}>
                      Select Manual Entry →
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* OPTION A FLOW: DESCRIBE BY VOICE */}
            {intakeMode === "voice" && (
              <div className="form-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => setIntakeMode("choose")}
                    style={{ fontSize: "12px", padding: "4px 10px" }}
                  >
                    ← Change Intake Choice
                  </button>
                  <span className="label-eyebrow">OPTION A · VOICE-FIRST INTAKE</span>
                </div>

                <h2 className="editorial-h3" style={{ fontSize: "18px", marginBottom: "8px" }}>
                  Describe Your Infrastructure Need by Voice
                </h2>
                <p className="portal-subtext" style={{ fontSize: "13px", marginBottom: "20px" }}>
                  Speak naturally into your device's microphone in any supported Indian language.
                </p>

                {/* Voice Recording Control */}
                <div style={{ background: "var(--col-panel)", padding: "20px", borderRadius: "10px", marginBottom: "20px", border: "1px solid var(--col-border)", textAlign: "center" }}>
                  {/* Bhashini Auto-Detection Badge — replaces manual language dropdown */}
                  <div style={{ marginBottom: "16px", textAlign: "left", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--col-text-muted)" }}>🧠 Translation:</span>
                    {isBhashiniLoading ? (
                      <span style={{ fontSize: "12px", color: "var(--col-orange)", fontStyle: "italic" }}>Detecting language...</span>
                    ) : detectedLangName ? (
                      <span style={{ fontSize: "12px", background: "rgba(224, 90, 43, 0.1)", border: "1px solid var(--col-orange)", borderRadius: "20px", padding: "2px 12px", fontWeight: 700, color: "var(--col-orange)" }}>
                        ✓ {detectedLangName} ({detectedLangCode})
                      </span>
                    ) : (
                      <span style={{ fontSize: "12px", color: "var(--col-text-muted)", fontStyle: "italic" }}>Auto-detected via Bhashini</span>
                    )}
                    {bhashiniError && (
                      <span style={{ fontSize: "11px", color: "#ef4444" }}>{bhashiniError}</span>
                    )}
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "12px", alignItems: "center", flexWrap: "wrap" }}>
                    <select
                      className="form-input"
                      value={spokenLanguage}
                      onChange={(e) => setSpokenLanguage(e.target.value)}
                      disabled={isRecording || isTranscribing}
                      style={{ width: "auto", fontSize: "13px", padding: "8px 12px", borderRadius: "8px" }}
                    >
                      <option value="as">Assamese (অসমীয়া)</option>
                      <option value="bn">Bengali (বাংলা)</option>
                      <option value="brx">Bodo (बड़ो)</option>
                      <option value="doi">Dogri (डोगरी)</option>
                      <option value="en">English</option>
                      <option value="gu">Gujarati (ગુજરાતી)</option>
                      <option value="hi">Hindi (हिंदी)</option>
                      <option value="kn">Kannada (ಕನ್ನಡ)</option>
                      <option value="ks">Kashmiri (कॉशुर)</option>
                      <option value="kok">Konkani (कोंकणी)</option>
                      <option value="mai">Maithili (मैथिली)</option>
                      <option value="ml">Malayalam (മലയാളം)</option>
                      <option value="mni">Manipuri (মৈতৈলোন্)</option>
                      <option value="mr">Marathi (मराठी)</option>
                      <option value="ne">Nepali (नेपाली)</option>
                      <option value="or">Odia (ଓଡ଼ିଆ)</option>
                      <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
                      <option value="raj">Rajasthani (राजस्थानी)</option>
                      <option value="sa">Sanskrit (संस्कृतम्)</option>
                      <option value="sat">Santali (ᱥᱟᱱᱛᱟᱲᱤ)</option>
                      <option value="sd">Sindhi (सिन्धी)</option>
                      <option value="si">Sinhala (සිංහල)</option>
                      <option value="ta">Tamil (தமிழ்)</option>
                      <option value="te">Telugu (తెలుగు)</option>
                      <option value="ur">Urdu (اردو)</option>
                    </select>

                    <button
                      type="button"
                      onClick={toggleRecording}
                      disabled={isTranscribing}
                      className="btn-primary"
                      style={{
                        background: isTranscribing ? "#9ca3af" : isRecording ? "#dc2626" : "var(--col-orange)",
                        padding: "10px 24px",
                        fontSize: "14px",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        cursor: isTranscribing ? "wait" : "pointer",
                      }}
                    >
                      <span>
                        {isTranscribing
                          ? "⏳ Transcribing..."
                          : isRecording
                          ? "⏹ Stop Recording"
                          : "🎙️ Start Speaking"}
                      </span>
                    </button>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--col-text-muted)" }}>
                    {isTranscribing
                      ? "Processing your audio with Bhashini ASR... Please wait."
                      : isRecording
                      ? "🔴 Recording... Speak clearly, then click Stop when done."
                      : speechSupported
                      ? "Select your language, then click to record. Bhashini will transcribe in the correct script."
                      : "Microphone unavailable in this browser; please type in the box below."}
                  </div>

                  <div style={{ marginTop: "16px", textAlign: "left" }}>
                    <label className="form-label" style={{ fontSize: "12px", fontWeight: 700 }}>
                      Your Voice Transcript (Editable):
                    </label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={speechTranscript}
                      onChange={(e) => setSpeechTranscript(e.target.value)}
                      placeholder="Your spoken transcript will appear here automatically. You can also type or edit it directly..."
                      style={{ fontSize: "14px", marginTop: "4px" }}
                    />
                  </div>

                  {/* Bhashini Live Translation Preview */}
                  {bhashiniTranslatedText && speechTranscript && (
                    <div style={{
                      marginTop: "12px",
                      textAlign: "left",
                      background: "rgba(224, 90, 43, 0.05)",
                      border: "1px solid rgba(224, 90, 43, 0.3)",
                      borderRadius: "8px",
                      padding: "12px 14px",
                    }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--col-orange)", marginBottom: "4px", letterSpacing: "0.05em" }}>
                        🌐 BHASHINI TRANSLATION PREVIEW (English)
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--col-navy)", lineHeight: "1.5" }}>
                        {bhashiniTranslatedText}
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => {
                        setSpeechTranscript("");
                        setIsVoiceConfirmCardVisible(false);
                      }}
                      style={{ fontSize: "12px" }}
                    >
                      Clear Transcript
                    </button>
                    <button
                      type="button"
                      className="service-card-btn service-card-btn-orange"
                      onClick={async () => {
                        if (speechTranscript.trim().length < 5) {
                          setAiMessage("Please provide at least 5 characters in your spoken transcript before analyzing.");
                          setAiStatus("error");
                          return;
                        }
                        setDescription(speechTranscript.trim());
                        await handleAnalyzeWithGemini();
                        setIsVoiceConfirmCardVisible(true);
                      }}
                      disabled={isAiLoading || speechTranscript.trim().length < 5}
                      style={{ fontSize: "13px", padding: "8px 16px" }}
                    >
                      {isAiLoading ? "Analyzing Voice Input..." : "Analyze Transcript with SPIN AI →"}
                    </button>
                  </div>
                </div>

                {/* AI Notification Banner */}
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
                    {aiStatus === "success" && <strong>✓ SPIN AI Analysis: </strong>}
                    {aiStatus === "unavailable" && <strong>ℹ️ Notice: </strong>}
                    {aiStatus === "error" && <strong>⚠️ Notice: </strong>}
                    {aiMessage}
                  </div>
                )}

                {/* "We understood this as:" Confirmation Card */}
                {isVoiceConfirmCardVisible && (
                  <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "10px", border: "2px solid var(--col-orange)", marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span className="label-eyebrow" style={{ color: "var(--col-orange)" }}>AI CLASSIFICATION SUMMARY</span>
                      {detectedLanguage && (
                        <span style={{ fontSize: "11px", background: "#e2e8f0", padding: "2px 8px", borderRadius: "4px", color: "var(--col-navy)", fontWeight: 600 }}>
                          Language: {detectedLanguage}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--col-navy)", marginBottom: "16px" }}>
                      We understood your request as:
                    </h3>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                      <div>
                        <label className="form-label" style={{ fontSize: "12px" }}>Request Type:</label>
                        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                          <button
                            type="button"
                            onClick={() => setRequestType("existing_problem")}
                            style={{
                              flex: 1,
                              padding: "8px",
                              fontSize: "12px",
                              borderRadius: "6px",
                              border: requestType === "existing_problem" ? "2px solid var(--col-orange)" : "1px solid var(--col-border)",
                              background: requestType === "existing_problem" ? "rgba(224, 90, 43, 0.1)" : "#fff",
                              fontWeight: requestType === "existing_problem" ? 700 : 400,
                              cursor: "pointer",
                            }}
                          >
                            ⚠️ Current Need
                          </button>
                          <button
                            type="button"
                            onClick={() => setRequestType("new_development")}
                            style={{
                              flex: 1,
                              padding: "8px",
                              fontSize: "12px",
                              borderRadius: "6px",
                              border: requestType === "new_development" ? "2px solid var(--col-orange)" : "1px solid var(--col-border)",
                              background: requestType === "new_development" ? "rgba(224, 90, 43, 0.1)" : "#fff",
                              fontWeight: requestType === "new_development" ? 700 : 400,
                              cursor: "pointer",
                            }}
                          >
                            🏗️ New Development
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: "12px" }}>Infrastructure Category:</label>
                        <select
                          className="form-input"
                          value={category}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          style={{ marginTop: "4px", fontSize: "13px" }}
                        >
                          {Object.keys(CATEGORY_ISSUE_MAP).map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <label className="form-label" style={{ fontSize: "12px" }}>
                        {requestType === "existing_problem" ? "Proposed Improvement:" : "Proposed Facility / Development:"}
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={requestType === "existing_problem" ? specificIssue : proposedFacility}
                        onChange={(e) => {
                          setSpecificIssue(e.target.value);
                          setProposedFacility(e.target.value);
                        }}
                        style={{ marginTop: "4px", fontSize: "13px" }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => setIntakeMode("manual")}
                        style={{ fontSize: "12px" }}
                      >
                        Edit Details Manually
                      </button>
                      <button
                        type="button"
                        className="service-card-btn service-card-btn-orange"
                        onClick={handleNext}
                        style={{ fontSize: "13px", padding: "8px 20px" }}
                      >
                        Confirm &amp; Proceed to Location (Step 2) →
                      </button>
                    </div>
                  </div>
                )}

                {!isVoiceConfirmCardVisible && (
                  <div style={{ textAlign: "center", marginTop: "16px" }}>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => setIntakeMode("manual")}
                      style={{ fontSize: "12px" }}
                    >
                      Switch to Standard Form Entry →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* OPTION B FLOW: ENTER DETAILS MANUALLY */}
            {intakeMode === "manual" && (
              <div className="form-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h2 className="editorial-h3" style={{ fontSize: "18px", margin: 0 }}>
                    Step 1 — Describe Your Infrastructure Need
                  </h2>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => setIntakeMode("choose")}
                    style={{ fontSize: "12px", padding: "4px 10px" }}
                  >
                    ← Change Intake Choice
                  </button>
                </div>

                {/* Request Type Selector */}
                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    What type of infrastructure need are you reporting? <span style={{ color: "#e53e3e" }}>*</span>
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
                        ⚠️ Current Infrastructure Need
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

                {/* Description Text Area with Dictation Microphone */}
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className="form-label" htmlFor="description">
                      {requestType === "existing_problem" ? "Describe the Need in Detail" : "Describe the Proposed Development Project"}{" "}
                      <span style={{ color: "#e53e3e" }}>*</span>
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
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
                        {isAiLoading ? "Analyzing..." : "✨ Analyze with SPIN AI"}
                      </button>
                    </div>
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

                {/* AI Status Banner */}
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
                    {aiStatus === "success" && <strong>✓ SPIN AI: </strong>}
                    {aiStatus === "unavailable" && <strong>ℹ️ Notice: </strong>}
                    {aiStatus === "error" && <strong>⚠️ Notice: </strong>}
                    {aiMessage}
                  </div>
                )}

                {/* Category and Proposed Improvement / Proposed Facility Selection */}
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
                      {requestType === "existing_problem" ? "Proposed Improvement" : "Proposed Facility"}{" "}
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

                {/* Conditional Type A Fields (Current Need Only) */}
                {requestType === "existing_problem" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="startDate">
                        When did this need arise? (Optional)
                      </label>
                      <input
                        id="startDate"
                        type="date"
                        className="form-input"
                        value={startDate}
                        max={localTodayStr}
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

                {/* Conditional Type B Fields (New Development Only) */}
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

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => onNavigate("citizen")}
                  >
                    ← Go Back to Dashboard
                  </button>
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
          </>
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
              <div ref={containerRef} style={{ width: "100%" }}>
                {!placesLibrary && (
                  <input
                    id="address"
                    type="text"
                    className="form-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Loading Google Maps Autocomplete..."
                    required
                  />
                )}
              </div>

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
                Next: Supporting Photos / Context →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUPPORTING EVIDENCE */}
        {step === 3 && (
          <div className="form-card">
            <h2 className="editorial-h3" style={{ fontSize: "18px", marginBottom: "8px" }}>
              Step 3 — Supporting Photos / Context (Optional)
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
                <div><strong>Submission Type:</strong> {requestType === "existing_problem" ? "Current Infrastructure Need" : "New Infrastructure Development"}</div>
                <div><strong>Category:</strong> {category}</div>
                <div><strong>{requestType === "existing_problem" ? "Proposed Improvement" : "Proposed Facility"}:</strong> {requestType === "existing_problem" ? specificIssue : proposedFacility || specificIssue}</div>
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
                {isSubmitting ? "Submitting to Official Registry..." : "Confirm & Submit Proposal →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
