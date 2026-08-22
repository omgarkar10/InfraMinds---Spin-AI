import { GoogleMap, HeatmapLayer, useJsApiLoader } from "@react-google-maps/api";
import type { RedZone } from "../types";

const MAP_CENTER = { lat: 20.5937, lng: 78.9629 }; // India centroid

const LIGHT_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#F8FAFC" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#334155" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#CBD5E1" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#BAE6FD" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#0284C7" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#94A3B8" }] },
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

  if (!isLoaded) {
    return <div className="map-placeholder">Loading GIS Infrastructure Map…</div>;
  }

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
        styles: LIGHT_MAP_STYLE,
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
          radius: 45,
          opacity: 0.85,
          gradient: [
            "rgba(2, 132, 199, 0)",
            "rgba(217, 119, 6, 0.6)",
            "rgba(232, 89, 12, 0.85)",
            "rgba(220, 38, 38, 1)",
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