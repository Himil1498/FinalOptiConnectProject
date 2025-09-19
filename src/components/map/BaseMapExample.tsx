import React, { useState, useCallback } from "react";
import BaseMap from "./BaseMap";
import BaseMapProvider, { useBaseMap } from "./BaseMapProvider";
import { Coordinates } from "../../types";

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
  const { setMapClickHandler, clearMarkers } = useBaseMap();

  // Handle map clicks
  const handleMapClick = useCallback((coordinates: Coordinates) => {
    setClickedLocations(prev => [...prev, coordinates]);

    // Show notification
    const notificationEvent = new CustomEvent('showNotification', {
      detail: {
        type: 'info',
        title: 'Location Clicked',
        message: `Lat: ${coordinates.lat.toFixed(6)}, Lng: ${coordinates.lng.toFixed(6)}`,
        duration: 3000
      }
    });
    window.dispatchEvent(notificationEvent);
  }, []);

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