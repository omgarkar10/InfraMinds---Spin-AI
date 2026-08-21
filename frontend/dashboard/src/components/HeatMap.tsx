import { GoogleMap, HeatmapLayer, useJsApiLoader } from "@react-google-maps/api";
import type { RedZone } from "../types";

const MAP_CENTER = { lat: 20.5937, lng: 78.9629 }; // India centroid
const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1d1d2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c2c3e" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
];

interface HeatMapProps {
  redZones: RedZone[];
  selectedDistrict?: string;
  onZoneClick?: (zone: RedZone) => void;
}

export function HeatMap({ redZones, selectedDistrict, onZoneClick }: HeatMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ["visualization"],
    version: "3.64"
  });

  const filtered = selectedDistrict
    ? redZones.filter((z) => z.district === selectedDistrict)
    : redZones;

  // 1. Wait for Google Maps script to finish loading first
  if (!isLoaded) {
    return <div className="map-placeholder">Loading map…</div>;
  }

  // 2. Safely create LatLng objects now that google.maps is loaded
  const heatmapData = filtered.map((zone) => ({
    location: new google.maps.LatLng(zone.lat, zone.lng),
    weight: zone.density,
  }));

  return (
    <GoogleMap
      mapContainerClassName="heatmap-container"
      center={filtered[0] ? { lat: filtered[0].lat, lng: filtered[0].lng } : MAP_CENTER}
      zoom={filtered.length === 1 ? 11 : 5}
      options={{
        styles: DARK_MAP_STYLE,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
      }}
      onClick={() => { }}
    >
      <HeatmapLayer
        data={heatmapData}
        options={{
          radius: 40,
          opacity: 0.75,
          gradient: [
            "rgba(0, 255, 255, 0)",
            "rgba(255, 200, 0, 0.5)",
            "rgba(255, 80, 0, 0.8)",
            "rgba(255, 0, 0, 1)",
          ],
        }}
      />
      {filtered.map((zone, i) => (
        <ZoneMarker key={`${zone.lat}-${zone.lng}-${i}`} zone={zone} onClick={onZoneClick} />
      ))}
    </GoogleMap>
  );
}

function ZoneMarker({
  zone,
  onClick,
}: {
  zone: RedZone;
  onClick?: (zone: RedZone) => void;
}) {
  void zone;
  void onClick;
  return null;
}