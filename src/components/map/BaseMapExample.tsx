import React, { useState, useCallback } from "react";
import BaseMap from "./BaseMap";
import BaseMapProvider, { useBaseMap } from "./BaseMapProvider";
import DistanceMeasurementTool from "./DistanceMeasurementTool";
import { Coordinates } from "../../types";
import { validateGeofence } from '../../utils/unifiedGeofencing';

interface MapMarkerProps {
  position: google.maps.LatLngLiteral;
  title: string;
  icon?: string;
}

const MapMarker: React.FC<MapMarkerProps> = ({ position, title, icon }) => {
  const { map, addMarker } = useBaseMap();

  React.useEffect(() => {
    if (!map) return;

    const marker = new google.maps.Marker({
      position,
      map,
      title,
      icon: icon ? {
        url: icon,
        scaledSize: new google.maps.Size(32, 32)
      } : undefined
    });

    addMarker(marker);

    return () => {
      marker.setMap(null);
    };
  }, [map, position, title, icon, addMarker]);

  return null;
};

const BaseMapContent: React.FC = () => {
  const [clickedLocations, setClickedLocations] = useState<Coordinates[]>([]);
  const [isDistanceMeasuring, setIsDistanceMeasuring] = useState(false);
  const { map, setMapClickHandler, clearMarkers } = useBaseMap();

  // Handle distance tool activation
  const handleDistanceToolToggle = useCallback(() => {
    setIsDistanceMeasuring(prev => !prev);
  }, []);

  // Handle map clicks with geofencing validation
  const handleMapClick = useCallback(async (coordinates: Coordinates) => {
    // If distance tool is active, let it handle clicks
    if (isDistanceMeasuring) {
      return;
    }

    console.log('🎯 Base Map Example - Map clicked', coordinates);

    // Validate coordinates are within India - STRICT ENFORCEMENT
    const validation = await validateGeofence(coordinates.lat, coordinates.lng);
    if (!validation.isValid) {
      const notificationEvent = new CustomEvent("showNotification", {
        detail: {
          type: "error",
          title: "Access Restricted",
          message: validation.message || "Map interactions can only be used within India boundaries.",
          duration: 5000
        }
      });
      window.dispatchEvent(notificationEvent);
      return; // BLOCK map interaction outside India
    }

    setClickedLocations(prev => [...prev, coordinates]);

    // Show success notification
    const notificationEvent = new CustomEvent('showNotification', {
      detail: {
        type: 'success',
        title: 'Location Added',
        message: `Lat: ${coordinates.lat.toFixed(6)}, Lng: ${coordinates.lng.toFixed(6)}`,
        duration: 2000
      }
    });
    window.dispatchEvent(notificationEvent);
  }, [isDistanceMeasuring]);

  React.useEffect(() => {
    setMapClickHandler(handleMapClick);
  }, [handleMapClick, setMapClickHandler]);

  const clearAllMarkers = useCallback(() => {
    clearMarkers();
    setClickedLocations([]);
  }, [clearMarkers]);

  // Sample tower locations in India
  const sampleTowers = [
    { id: 1, position: { lat: 28.6139, lng: 77.2090 }, title: "New Delhi Tower", status: "active" },
    { id: 2, position: { lat: 19.0760, lng: 72.8777 }, title: "Mumbai Tower", status: "active" },
    { id: 3, position: { lat: 13.0827, lng: 80.2707 }, title: "Chennai Tower", status: "maintenance" },
    { id: 4, position: { lat: 22.5726, lng: 88.3639 }, title: "Kolkata Tower", status: "active" },
    { id: 5, position: { lat: 12.9716, lng: 77.5946 }, title: "Bangalore Tower", status: "active" }
  ];

  return (
    <div className="relative w-full h-full">
      <BaseMap
        showControls={true}
        showCoordinates={true}
        restrictToIndia={true}
        className="rounded-lg shadow-lg"
      >
        {/* Sample tower markers */}
        {sampleTowers.map(tower => (
          <MapMarker
            key={tower.id}
            position={tower.position}
            title={tower.title}
            icon={tower.status === 'active'
              ? "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
              : "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
            }
          />
        ))}

        {/* Clicked location markers */}
        {clickedLocations.map((location, index) => (
          <MapMarker
            key={`clicked-${index}`}
            position={location}
            title={`Clicked Location ${index + 1}`}
            icon="https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
          />
        ))}
      </BaseMap>

      {/* Control Panel */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 z-10">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Base Map Demo</h3>
        <div className="space-y-2">
          <div className="text-xs text-gray-600">
            • Click anywhere on the map to add markers
            • Use map controls to zoom and change view
            • {clickedLocations.length} locations clicked
          </div>

          {/* Distance Tool Button */}
          <button
            onClick={handleDistanceToolToggle}
            className={`w-full text-xs px-3 py-1 rounded transition-colors ${
              isDistanceMeasuring
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            📏 {isDistanceMeasuring ? "Stop" : "Start"} Distance Tool
          </button>

          {clickedLocations.length > 0 && (
            <button
              onClick={clearAllMarkers}
              className="w-full text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
            >
              Clear All Markers
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10">
        <h4 className="text-xs font-semibold text-gray-900 mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Active Towers</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span>Maintenance</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>Clicked Locations</span>
          </div>
        </div>
      </div>

      {/* Distance Measurement Tool */}
      <DistanceMeasurementTool
        isActive={isDistanceMeasuring}
        onToggle={handleDistanceToolToggle}
        map={map}
        mapWidth={800}
        mapHeight={600}
      />
    </div>
  );
};

const BaseMapExample: React.FC = () => {
  return (
    <div className="w-full h-screen bg-gray-100">
      <BaseMapProvider>
        <BaseMapContent />
      </BaseMapProvider>
    </div>
  );
};

export default BaseMapExample;