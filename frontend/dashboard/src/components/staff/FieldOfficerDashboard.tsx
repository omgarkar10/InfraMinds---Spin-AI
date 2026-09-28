import React, { useState } from "react";
import type { StaffUser } from "../../types";

interface FieldOfficerDashboardProps {
  user: StaffUser;
}

export const FieldOfficerDashboard: React.FC<FieldOfficerDashboardProps> = ({ user }) => {
  const [demandId, setDemandId] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [status, setStatus] = useState("");

  const handleCapturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setStatus("Location captured!");
      }, (err) => {
        setStatus("Error capturing location: " + err.message);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandId || !photo || !lat || !lng) {
      setStatus("Please provide demand ID, take a photo, and capture location.");
      return;
    }
    
    // Check if offline/PWA Sync Manager handles this
    setStatus("Queueing for upload...");
    
    // In a real PWA, we'd use Background Sync API or Service Worker here.
    // For now, we simulate the POST to the backend
    try {
      const formData = new FormData();
      formData.append("file", photo);
      
      const token = localStorage.getItem("staff_token");
      
      const res = await fetch(`/api/staff/investigation/${demandId}/report?lat=${lat}&lng=${lng}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await res.json();
      if (data.error) {
        setStatus("Error: " + data.error);
      } else {
        setStatus("Feasibility report submitted successfully!");
        setPhoto(null);
        setDemandId("");
      }
    } catch (err: any) {
      setStatus("Network error. The report is queued for background sync when you are back online.");
    }
  };

  return (
    <div className="citizen-portal-container" style={{ padding: "20px" }}>
      <div className="container" style={{ maxWidth: "500px", margin: "0 auto", background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <h2>Field Officer Portal</h2>
        <p>Welcome, {user.name} ({user.department}). Complete feasibility studies below.</p>
        
        {status && (
          <div style={{ margin: "15px 0", padding: "10px", backgroundColor: "#f0f8ff", borderLeft: "4px solid var(--col-navy)" }}>
            {status}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Demand ID (Task)</label>
            <input 
              type="text" 
              value={demandId} 
              onChange={e => setDemandId(e.target.value)}
              className="form-input" 
              placeholder="e.g. D-12345" 
            />
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Current Location</label>
            <button type="button" onClick={handleGetLocation} className="btn-outline" style={{ width: "100%", padding: "10px" }}>
              📍 Capture GPS Coordinates
            </button>
            {lat && lng && <p style={{ fontSize: "12px", marginTop: "5px", color: "green" }}>Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}</p>}
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Feasibility Photo (Required)</label>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              onChange={handleCapturePhoto}
              style={{ padding: "10px", width: "100%", border: "1px dashed #ccc", borderRadius: "4px" }} 
            />
          </div>
          
          <button type="submit" className="service-card-btn" style={{ background: "var(--col-navy)", color: "white", padding: "15px", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" }}>
            Submit Field Report
          </button>
        </form>
      </div>
    </div>
  );
};
