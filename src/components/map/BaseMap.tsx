import React, { useState, useCallback, useRef, useEffect } from "react";
import { Wrapper } from "@googlemaps/react-wrapper";
import MapControlsPanel from "./MapControlsPanel";
import LiveCoordinateDisplay from "./LiveCoordinateDisplay";
import LoadingSpinner from "../common/LoadingSpinner";
import { Coordinates } from "../../types";
import { validateGeofence } from '../../utils/unifiedGeofencing';

interface BaseMapProps {
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  mapTypeId?: google.maps.MapTypeId;
  onMapReady?: (map: google.maps.Map) => void;
  onMapClick?: (coordinates: Coordinates) => void;
  showControls?: boolean;
  showCoordinates?: boolean;
  restrictToIndia?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface GoogleMapComponentProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  mapTypeId: google.maps.MapTypeId;
  onMapReady?: (map: google.maps.Map) => void;
  onMapClick?: (coordinates: Coordinates) => void;
  restrictToIndia?: boolean;
  children?: React.ReactNode;
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  center,
  zoom,
  mapTypeId,
  onMapReady,
  onMapClick,
  restrictToIndia = true,
  children
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const boundaryRef = useRef<google.maps.Data | null>(null);

  // India bounds for restriction
  const indiaBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(6.4, 68.2), // Southwest corner
    new google.maps.LatLng(37.1, 97.4) // Northeast corner
  );

  // Load India boundary from GeoJSON
  const loadIndiaBoundary = useCallback(async () => {
    if (!googleMapRef.current) return;

    try {
      const response = await fetch("/india-boundary.geojson");
      if (!response.ok) {
        console.warn("India boundary GeoJSON not found, skipping boundary display");
        return;
      }

      const geoJsonData = await response.json();

      // Add data layer for boundaries
      const dataLayer = new google.maps.Data();
      dataLayer.addGeoJson(geoJsonData);

      // Style the boundary
      dataLayer.setStyle({
        strokeColor: "#2563eb",
        strokeWeight: 2,
        strokeOpacity: 0.6,
        fillColor: "transparent",
        fillOpacity: 0,
        clickable: false
      });

      dataLayer.setMap(googleMapRef.current);
      boundaryRef.current = dataLayer;
    } catch (error) {
      console.warn("Could not load India boundary:", error);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || googleMapRef.current) return;

    const mapOptions: google.maps.MapOptions = {
      center,
      zoom,
      mapTypeId,
      // Enhanced map controls
      zoomControl: false, // We'll use custom controls
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
      // Better UX options
      gestureHandling: "greedy",
      backgroundColor: "#e5e7eb",
      clickableIcons: true,
      // Restrict to India if enabled
      ...(restrictToIndia && {
        restriction: {
          latLngBounds: indiaBounds,
          strictBounds: false
        }
      }),
      // Enhanced styling
      styles: [
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#e3f2fd" }]
        },
        {
          featureType: "landscape",
          elementType: "geometry",
          stylers: [{ color: "#f5f5f5" }]
        }
      ]
    };

    const map = new google.maps.Map(mapRef.current, mapOptions);
    googleMapRef.current = map;

    // Add click listener with geofencing validation
    if (onMapClick) {
      map.addListener("click", async (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();

          console.log('🎯 Base Map - Map clicked', { lat, lng });

          // Validate coordinates are within India - STRICT ENFORCEMENT
          const validation = await validateGeofence(lat, lng);
          if (!validation.isValid) {
            const notificationEvent = new CustomEvent("showNotification", {
              detail: {
                type: "error",
                title: "Access Restricted",
                message: validation.message || "Base map interactions can only be used within India boundaries.",
                duration: 5000
              }
            });
            window.dispatchEvent(notificationEvent);
            return; // BLOCK base map interaction outside India
          }

          const coordinates: Coordinates = { lat, lng };
          onMapClick(coordinates);
        }
      });
    }

    // Load India boundary
    loadIndiaBoundary();

    // Notify parent component
    if (onMapReady) {
      onMapReady(map);
    }

    // Cleanup function
    return () => {
      if (boundaryRef.current) {
        boundaryRef.current.setMap(null);
      }
    };
  }, [center, zoom, mapTypeId, onMapReady, onMapClick, restrictToIndia, loadIndiaBoundary]);

  return (
    <div ref={mapRef} className="w-full h-full">
      {children}
    </div>
  );
};

const BaseMap: React.FC<BaseMapProps> = ({
  center = { lat: 20.5937, lng: 78.9629 }, // Center of India
  zoom = 5,
  mapTypeId = google.maps.MapTypeId.HYBRID,
  onMapReady,
  onMapClick,
  showControls = true,
  showCoordinates = true,
  restrictToIndia = true,
  className = "",
  children
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [currentMapType, setCurrentMapType] = useState("hybrid");
  const [isLoading, setIsLoading] = useState(true);

  const handleMapReady = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setIsLoading(false);

    // Add idle listener to ensure map is fully loaded
    mapInstance.addListener("idle", () => {
      setIsLoading(false);
    });

    if (onMapReady) {
      onMapReady(mapInstance);
    }
  }, [onMapReady]);

  const handleMapTypeChange = useCallback((newMapType: string) => {
    setCurrentMapType(newMapType);
  }, []);

  const render = (status: string) => {
    if (status === "LOADING") {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <LoadingSpinner size="xl" text="Loading Google Maps..." />
        </div>
      );
    }

    if (status === "FAILURE") {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Loading Failed</h3>
            <p className="text-gray-600 mb-4">
              Could not load Google Maps. Please check your internet connection and API key.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative w-full h-full ${className}`}>
        <GoogleMapComponent
          center={center}
          zoom={zoom}
          mapTypeId={mapTypeId}
          onMapReady={handleMapReady}
          onMapClick={onMapClick}
          restrictToIndia={restrictToIndia}
        >
          {children}
        </GoogleMapComponent>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <LoadingSpinner size="lg" text="Initializing map..." />
          </div>
        )}

        {/* Map Controls */}
        {showControls && map && (
          <MapControlsPanel
            map={map}
            currentMapType={currentMapType}
            onMapTypeChange={handleMapTypeChange}
          />
        )}

        {/* Live Coordinates */}
        {showCoordinates && map && (
          <LiveCoordinateDisplay map={map} />
        )}
      </div>
    );
  };

  return (
    <Wrapper
      apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ""}
      render={render}
      libraries={["places", "geometry", "drawing"]}
    />
  );
};

export default BaseMap;