import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { logger } from '@/lib/logger';

interface MapProps {
  address?: string;
  className?: string;
}

// Lightweight Mapbox map with optional geocoding by address
const ClinicMap: React.FC<MapProps> = ({ address, className }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const envToken = (import.meta as any).env?.VITE_MAPBOX_PUBLIC_TOKEN as string | undefined;
    const storedToken = localStorage.getItem("MAPBOX_PUBLIC_TOKEN") || localStorage.getItem("mapbox_public_token");
    const finalToken = envToken || storedToken || null;
    setToken(finalToken);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !token) return;

    mapboxgl.accessToken = token;

    // Initialize map
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [0, 20],
      zoom: 1.5,
      pitch: 0,
    });

    // Navigation
    mapRef.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "top-right");

    // Geocode address if present
    const geocode = async () => {
      if (!address || address.trim().length === 0) return;
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}`
        );
        const json = await res.json();
        const feature = json?.features?.[0];
        const coords: [number, number] | undefined = feature?.center;
        if (coords && mapRef.current) {
          mapRef.current.easeTo({ center: coords, zoom: 12, duration: 800 });
          new mapboxgl.Marker().setLngLat(coords).addTo(mapRef.current);
        }
      } catch (e) {
        // Fail silently; keep base map
        console.warn("Mapbox geocoding failed", e);
      }
    };

    geocode();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [address, token]);

  if (!token) {
    // Fallback: privacy-friendly Google Maps embed without API key
    const q = encodeURIComponent(address || "");
    return (
      <iframe
        title="Clinic location"
        referrerPolicy="no-referrer-when-downgrade"
        loading="lazy"
        className={`w-full h-full rounded border ${className || ""}`}
        src={`https://www.google.com/maps?q=${q}&output=embed`}
      />
    );
  }

  return <div ref={containerRef} className={`w-full h-full rounded ${className || ""}`} />;
};

export default ClinicMap;

