import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchDemands } from "../../services/demandService";
import "./HeroSection.css";

// Helper component to add heat layer to map
function HeatmapLayer({ data }: { data: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || data.length === 0) return;
    
    // Ensure L is on window for leaflet.heat
    (window as any).L = L;
    let heat: any;

    // @ts-ignore
    import("leaflet.heat/dist/leaflet-heat.js").then(() => {
      // @ts-ignore - leaflet.heat adds L.heatLayer
      if (!L.heatLayer) return;
      
      // @ts-ignore
      heat = L.heatLayer(data, {
        radius: 25,
        blur: 15,
        maxZoom: 15,
        gradient: { 0.4: 'blue', 0.65: 'yellow', 1: 'red' }
      }).addTo(map);
    }).catch(err => console.error("Failed to load leaflet.heat", err));

    return () => {
      if (heat && map) {
        map.removeLayer(heat);
      }
    };
  }, [map, data]);

  return null;
}

// Helper to center map
function ChangeMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

interface HeroSectionProps {
  onViewChange?: (view: "landing" | "dashboard" | "citizen" | "citizen-raise" | "citizen-track", id?: string) => void;
}

export function HeroSection({ onViewChange }: HeroSectionProps) {
  const [heatData, setHeatData] = useState<[number, number, number][]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchDemands();
        const data = res.demands || (Array.isArray(res) ? res : []);
        const heatPoints = data
          .filter((d: any) => d.latitude && d.longitude)
          .map((d: any) => [d.latitude, d.longitude, Math.min((d.vote_count || 1) / 10, 1)] as [number, number, number]);
        setHeatData(heatPoints);
      } catch (err) {
        console.error("Failed to fetch demands for heatmap", err);
      }
    }
    load();

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn("Geolocation denied or error", error);
        }
      );
    }
  }, []);

  const center = userLocation || [20.5937, 78.9629];
  const zoom = userLocation ? 13 : 5;

  return (
    <section className="hero-section" id="overview">
      <div className="hero-container container">
        {/* Left Column: Hero Headline & Citizen Actions */}
        <div className="hero-left">
          <div className="hero-eyebrow-group">
            <span className="label-eyebrow tag-navy">SPIN · PUBLIC INFRASTRUCTURE NETWORK</span>
          </div>

          <h1 className="editorial-h1 hero-headline">
            Shape your city's future through <span className="text-highlight">Public Demand</span>
          </h1>

          <p className="body-lg hero-supporting-text">
            Propose public infrastructure projects, rally community votes, and help authorities measure the demand for civic improvements.
          </p>

          {/* Primary Action Buttons for Citizens */}
          <div className="hero-actions">
            <button className="hero-btn-primary" onClick={() => onViewChange?.("citizen-raise")}>
              Start a Public Demand →
            </button>
            <button className="hero-btn-secondary" onClick={() => onViewChange?.("citizen-track")}>
              Vote on Local Demands
            </button>

          </div>

          {/* Citizen Benefit Highlights */}
          <div className="hero-highlights">
            <div className="highlight-item">
              <span className="highlight-check">✓</span> Simple 1-minute reporting
            </div>
            <div className="highlight-item">
              <span className="highlight-check">✓</span> Speak in your local language
            </div>
            <div className="highlight-item">
              <span className="highlight-check">✓</span> Track status with live updates
            </div>
          </div>
        </div>

        {/* Right Column: Visual Signal Map */}
        <div className="hero-right">
          <div className="hero-map-frame">
            <div className="hero-map-header">
              <span className="label-eyebrow">COMMUNITY INFRASTRUCTURE MAP</span>
              <span className="status-live">● LIVE SIGNALS</span>
            </div>

            <div className="canvas-wrapper leaflet-hero-wrapper" style={{ height: "400px", width: "100%", zIndex: 1, borderRadius: "12px", overflow: "hidden" }}>
              <MapContainer 
                center={center} 
                zoom={zoom} 
                style={{ height: "100%", width: "100%", zIndex: 1 }}
                dragging={false}
                zoomControl={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                touchZoom={false}
                boxZoom={false}
                keyboard={false}
                attributionControl={false}
              >
                <ChangeMapView center={center} zoom={zoom} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <HeatmapLayer data={heatData} />
              </MapContainer>
            </div>

            {/* Map Legend */}
            <div className="map-legend">
              <span className="legend-title">HEATMAP DENSITY:</span>
              <div className="legend-items">
                <span className="legend-item"><span className="dot blue" /> Low Demand</span>
                <span className="legend-item"><span className="dot" style={{ backgroundColor: 'yellow' }} /> Medium Demand</span>
                <span className="legend-item"><span className="dot red" /> High Demand / Trending</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
