import React from 'react';
import {
  PlusIcon,
  MinusIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PencilIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';

interface MapControlPanelProps {
  map: google.maps.Map | null;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onToggleDrawing?: () => void;
  onToggleMeasurement?: () => void;
  drawingMode?: boolean;
  measurementMode?: boolean;
}

const MapControlPanel: React.FC<MapControlPanelProps> = ({
  map,
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggleDrawing,
  onToggleMeasurement,
  drawingMode = false,
  measurementMode = false,
}) => {
  const handleFitToBounds = () => {
    if (map) {
      const bounds = new google.maps.LatLngBounds();
      // Add India's approximate bounds
      bounds.extend(new google.maps.LatLng(37.6, 68.1)); // North-West
      bounds.extend(new google.maps.LatLng(6.4, 97.25)); // South-East
      map.fitBounds(bounds);
    }
  };

  const handleMyLocation = () => {
    if (navigator.geolocation && map) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          map.setCenter(pos);
          map.setZoom(15);

          // Add a marker at user's location
          new google.maps.Marker({
            position: pos,
            map: map,
            title: 'Your Location',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" fill="white"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(24, 24),
              anchor: new google.maps.Point(12, 12),
            },
          });
        },
        () => {
          console.warn('Geolocation failed or was denied');
        }
      );
    }
  };

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col space-y-3">
      {/* Zoom Controls */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 p-1">
        <div className="flex flex-col">
          <button
            onClick={onZoomIn}
            className="p-3 hover:bg-blue-50 hover:text-blue-600 rounded-t-xl transition-all duration-200 border-b border-gray-100 group"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <PlusIcon className="h-5 w-5 text-gray-700 group-hover:text-blue-600 transition-colors" />
          </button>
          <button
            onClick={onZoomOut}
            className="p-3 hover:bg-blue-50 hover:text-blue-600 rounded-b-xl transition-all duration-200 group"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <MinusIcon className="h-5 w-5 text-gray-700 group-hover:text-blue-600 transition-colors" />
          </button>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 p-1">
        <div className="flex flex-col">
          <button
            onClick={onResetView}
            className="p-3 hover:bg-green-50 hover:text-green-600 rounded-t-xl transition-all duration-200 border-b border-gray-100 group"
            title="Reset to Default View"
            aria-label="Reset view"
          >
            <HomeIcon className="h-5 w-5 text-gray-700 group-hover:text-green-600 transition-colors" />
          </button>
          <button
            onClick={handleFitToBounds}
            className="p-3 hover:bg-purple-50 hover:text-purple-600 rounded-none transition-all duration-200 border-b border-gray-100 group"
            title="Fit to Bounds"
            aria-label="Fit to bounds"
          >
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-700 group-hover:text-purple-600 transition-colors" />
          </button>
          <button
            onClick={handleMyLocation}
            className="p-3 hover:bg-indigo-50 hover:text-indigo-600 rounded-b-xl transition-all duration-200 group"
            title="My Location"
            aria-label="Go to my location"
          >
            <MapPinIcon className="h-5 w-5 text-gray-700 group-hover:text-indigo-600 transition-colors" />
          </button>
        </div>
      </div>

      {/* Drawing and Measurement Tools */}
      {(onToggleDrawing || onToggleMeasurement) && (
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 p-1">
          <div className="flex flex-col">
            {onToggleDrawing && (
              <button
                onClick={onToggleDrawing}
                className={`p-3 rounded-xl transition-all duration-200 group ${
                  drawingMode
                    ? 'bg-orange-100 text-orange-600 shadow-inner'
                    : 'hover:bg-orange-50 hover:text-orange-600 text-gray-700'
                } ${onToggleMeasurement ? 'border-b border-gray-100 rounded-b-none' : ''}`}
                title="Drawing Tools"
                aria-label="Toggle drawing tools"
              >
                <PencilIcon className="h-5 w-5 transition-colors" />
              </button>
            )}
            {onToggleMeasurement && (
              <button
                onClick={onToggleMeasurement}
                className={`p-3 rounded-xl transition-all duration-200 group ${
                  measurementMode
                    ? 'bg-teal-100 text-teal-600 shadow-inner'
                    : 'hover:bg-teal-50 hover:text-teal-600 text-gray-700'
                } ${onToggleDrawing ? 'rounded-t-none' : ''}`}
                title="Measurement Tools"
                aria-label="Toggle measurement tools"
              >
                <ScaleIcon className="h-5 w-5 transition-colors" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Current Zoom Level Display */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 px-4 py-3">
        <div className="text-sm text-gray-700 font-semibold tracking-wide">
          Zoom: {map?.getZoom()?.toFixed(0) || '5'}
        </div>
      </div>
    </div>
  );
};

export default MapControlPanel;