import { useState } from "react";
import { Map, Marker } from "@vis.gl/react-google-maps";
import type { RedZone } from "../types";

interface HeatMapProps {
  redZones: RedZone[];
  selectedDistrict?: string;
  selectedState?: string;
  onZoneClick?: (zone: RedZone) => void;
}

export function HeatMap({
  redZones,
  selectedDistrict,
  onZoneClick,
}: HeatMapProps) {
  const [isEarthMode, setIsEarthMode] = useState(false);

  // Filter markers by selected district — map camera stays fixed at all-India view
  const filtered = selectedDistrict
    ? redZones.filter((z) => z.district?.toLowerCase() === selectedDistrict.toLowerCase())
    : redZones;

  return (
    <div className="heatmap-container" style={{ position: "relative", width: "100%", height: "100%" }}>
      <button
        onClick={() => setIsEarthMode(!isEarthMode)}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 10,
          padding: "8px 12px",
          background: "#1E293B",
          color: "white",
          border: "1px solid #334155",
          borderRadius: 4,
          cursor: "pointer",
          fontWeight: "bold",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        }}
      >
        {isEarthMode ? "🌍 Switch to 2D Map" : "🛰️ Switch to 3D Earth"}
      </button>

      <Map
        defaultCenter={{ lat: 20.5937, lng: 78.9629 }}
        defaultZoom={5}
        mapTypeId={isEarthMode ? "satellite" : "roadmap"}
        disableDefaultUI={false}
        gestureHandling="greedy"
      >
        {filtered.map((zone, i) => (
          <Marker
            key={`${zone.lat}-${zone.lng}-${i}`}
            position={{ lat: zone.lat, lng: zone.lng }}
            onClick={() => onZoneClick?.(zone)}
            title={`${zone.district || "Zone"} [${zone.domain}] — Severity: ${zone.density}`}
          />
        ))}
      </Map>
    </div>
  );
}