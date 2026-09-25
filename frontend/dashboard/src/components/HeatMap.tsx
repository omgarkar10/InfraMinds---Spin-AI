import { useState } from "react";
import { Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import type { RedZone } from "../types";

const MAP_CENTER = { lat: 20.5937, lng: 78.9629 };

interface HeatMapProps {
  redZones: RedZone[];
  selectedDistrict?: string;
  onZoneClick?: (zone: RedZone) => void;
}

export function HeatMap({ redZones, selectedDistrict, onZoneClick }: HeatMapProps) {
  const [isEarthMode, setIsEarthMode] = useState(false);

  const filtered = selectedDistrict
    ? redZones.filter((z) => z.district === selectedDistrict)
    : redZones;

  const center = filtered[0] ? { lat: filtered[0].lat, lng: filtered[0].lng } : MAP_CENTER;
  const zoom = filtered.length === 1 ? 11 : 5;

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
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
        }}
      >
        {isEarthMode ? "🌍 Switch to 2D Map" : "🛰️ Switch to 3D Earth"}
      </button>

      <Map
        defaultCenter={center}
        defaultZoom={zoom}
        mapTypeId={isEarthMode ? "satellite" : "roadmap"}
        defaultTilt={isEarthMode ? 45 : 0}
        mapId="DEMO_MAP_ID" // Required for AdvancedMarker
        disableDefaultUI={false}
      >
        {filtered.map((zone, i) => (
          <AdvancedMarker
            key={`${zone.lat}-${zone.lng}-${i}`}
            position={{ lat: zone.lat, lng: zone.lng }}
            onClick={() => onZoneClick?.(zone)}
          >
            <Pin 
              background={"#DC2626"} 
              borderColor={"#991B1B"} 
              glyphColor={"white"}
              scale={zone.density > 50 ? 1.5 : 1}
            />
          </AdvancedMarker>
        ))}
      </Map>
    </div>
  );
}