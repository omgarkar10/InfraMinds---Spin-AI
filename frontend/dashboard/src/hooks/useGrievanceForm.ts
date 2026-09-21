/**
 * useGrievanceForm — state management and validation for RaiseGrievanceForm.
 *
 * Extracted from RaiseGrievanceForm.tsx to:
 *   1. Keep the view file focused on rendering only
 *   2. Allow step validation logic to be unit-testable in isolation
 *   3. Centralize the GPS reverse-geocoding logic
 */
import { useState, useRef } from "react";
import type { GrievanceCategory, LocationData } from "../types";

export const CATEGORY_ISSUE_MAP: Record<GrievanceCategory, string[]> = {
  "Water Supply": ["No water supply", "Low pressure", "Contaminated water", "Pipeline leakage / burst", "Irregular supply hours", "Other water issue"],
  "Roads & Potholes": ["Pothole", "Damaged asphalt road", "Road blockage / debris", "Missing traffic signage", "Unsafe road condition", "Other road issue"],
  "Drainage / Flooding": ["Clogged drainage pipe", "Overflowing sewer main", "Waterlogging on street", "Broken storm drain cover", "Other drainage issue"],
  "Electricity": ["Frequent load shedding", "Transformer failure / sparks", "High/Low voltage fluctuation", "Dangling power lines", "Other electrical issue"],
  "Waste Management": ["Garbage dump not cleared", "Overflowing community bin", "Illegal waste dumping", "Hazardous waste on public land", "Other sanitation issue"],
  "Street Lighting": ["Street light not working", "Flickering streetlight", "Dark stretch / No lights installed", "Damaged electric pole"],
  "Public Transport": ["Irregular bus schedule", "Damaged bus shelter", "Overcrowded transit route", "Missing timetable board"],
  "Sanitation": ["Public toilet unhygienic", "Lack of water in public washroom", "Open sewage discharge"],
  "Public Infrastructure": ["Damaged public park facility", "Footpath blockage", "Encroachment on public land", "Broken bridge/culvert guardrail"],
  "Healthcare & Hospitals": ["Hospital staff shortage", "Medicine/service unavailability", "Unsanitary hospital environment", "Emergency ambulance delay"],
  "Public Safety & Law Enforcement": ["Traffic signal not working", "Illegal encroachment", "Nuisance/noise complaint", "Public safety hazard"],
  "Other": ["Other public infrastructure grievance"],
};

export const STATE_DISTRICT_MAP: Record<string, string[]> = {
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

const INITIAL_LOCATION: LocationData = {
  lat: 20.5937, lng: 78.9629, address: "", district: "", state: "", pinCode: "", isVerified: false,
};

export function useGrievanceForm() {
  const [step, setStep] = useState<number>(1);
  const [category, setCategory] = useState<GrievanceCategory | "">("");
  const [issueType, setIssueType] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [frequency, setFrequency] = useState<"One time" | "Occasional" | "Daily" | "Continuous" | "">("");
  const [description, setDescription] = useState<string>("");
  const [location, setLocation] = useState<LocationData>(INITIAL_LOCATION);
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string>("");
  const [voiceText, setVoiceText] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string>("");
  const [declaration, setDeclaration] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  const handleCategoryChange = (cat: GrievanceCategory) => {
    setCategory(cat);
    const available = CATEGORY_ISSUE_MAP[cat];
    if (available?.length > 0) setIssueType(available[0]);
  };

  const handleStateChange = (selectedState: string) => {
    const validDistricts = STATE_DISTRICT_MAP[selectedState] || [];
    setLocation((prev) => ({
      ...prev,
      state: selectedState,
      district: validDistricts.includes(prev.district) ? prev.district : "",
    }));
  };

  /** Pure validation — can be unit tested independently. */
  const validateStep = (stepNum: number): boolean => {
    switch (stepNum) {
      case 1: return category !== "" && issueType !== "" && startDate !== "" && frequency !== "";
      case 2: return (
        location.state !== "" &&
        location.district !== "" &&
        location.address.trim() !== "" &&
        /^\d{6}$/.test(location.pinCode.trim())
      );
      case 3: return true; // Evidence is optional
      case 4: return declaration === true;
      default: return false;
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
    if (canNavigateToStep(targetStep)) setStep(targetStep);
  };

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
              detectedDistrict = matchedDistrict ?? validDistricts[0] ?? detectedDistrict;
            }
            if (rawPin && /^\d{6}$/.test(rawPin.trim())) detectedPin = rawPin.trim();
          }
        } catch {
          if (lat > 28 && lat < 29 && lng > 76 && lng < 78) {
            detectedState = "Delhi (NCT)"; detectedDistrict = "New Delhi"; detectedPin = "110001";
          } else if (lat > 12 && lat < 14 && lng > 77 && lng < 78) {
            detectedState = "Karnataka"; detectedDistrict = "Bengaluru"; detectedPin = "560001";
          } else if (lat > 18.8 && lat < 19.3 && lng > 72.7 && lng < 73.1) {
            detectedState = "Maharashtra"; detectedDistrict = "Mumbai"; detectedPin = "400001";
          }
        }
        setLocation((prev) => ({ ...prev, lat, lng, state: detectedState, district: detectedDistrict, pinCode: detectedPin, isVerified: true }));
        setIsGpsLoading(false);
      },
      () => {
        setIsGpsLoading(false);
        setGpsError("GPS location access denied or unavailable. Please select your State and District manually.");
      },
      { timeout: 10000 }
    );
  };

  const handleToggleRecord = () => {
    setVoiceError("");
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setVoiceError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "hi-IN";
      recognition.maxAlternatives = 1;
      let finalTranscript = "";
      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTranscript += t + " ";
          else interim += t;
        }
        setVoiceText((finalTranscript + interim).trim());
      };
      recognition.onerror = (event: any) => {
        setVoiceError(`Voice recognition notice: ${event.error || "Microphone access issue"}. Please check microphone permissions.`);
        setIsRecording(false);
      };
      recognition.onend = () => {
        setIsRecording(false);
        if (finalTranscript.trim()) setVoiceText(finalTranscript.trim());
      };
      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      setVoiceError(`Could not start voice recording: ${e?.message || "Unknown error"}`);
      setIsRecording(false);
    }
  };

  const clearVoiceText = () => setVoiceText("");

  return {
    step, setStep,
    category, issueType, setIssueType, startDate, setStartDate, frequency, setFrequency, description, setDescription,
    location, setLocation,
    isGpsLoading, gpsError,
    voiceText, isRecording, voiceError,
    declaration, setDeclaration,
    isCurrentStepValid,
    validateStep, canNavigateToStep, handleNextStep,
    handleCategoryChange, handleStateChange, handleUseCurrentLocation, handleToggleRecord,
    clearVoiceText,
    STATE_DISTRICT_MAP,
  };
}
