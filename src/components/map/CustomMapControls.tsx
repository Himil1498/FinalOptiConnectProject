import React from 'react';
import { PlusIcon, MinusIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import FullscreenToggle from '../common/FullscreenToggle';
import EnhancedTooltip from '../common/EnhancedTooltip';
import { useFullscreen } from '../../hooks/useFullscreen';

interface CustomMapControlsProps {
  map: google.maps.Map | null;
  currentMapType: string;
  onMapTypeChange: (mapType: string) => void;
}

const CustomMapControls: React.FC<CustomMapControlsProps> = ({
  map,
  currentMapType,
  onMapTypeChange
}) => {
  const { isFullscreen } = useFullscreen();
  const handleZoomIn = () => {
    if (map) {
      const currentZoom = map.getZoom() || 10;
      // Smooth zoom transition
      map.setZoom(Math.min(currentZoom + 1, 20));
    }
  };

  const handleZoomOut = () => {
    if (map) {
      const currentZoom = map.getZoom() || 10;
      // Smooth zoom transition
      map.setZoom(Math.max(currentZoom - 1, 2));
    }
  };

  const toggleMapType = () => {
    const newMapType = currentMapType === "hybrid" ? "roadmap" : "hybrid";

    if (map && window.google) {
      const mapTypeId = newMapType === "hybrid"
        ? google.maps.MapTypeId.HYBRID
        : google.maps.MapTypeId.ROADMAP;
      map.setMapTypeId(mapTypeId);
    }
    onMapTypeChange(newMapType);
  };

  return (
    <div className={`absolute z-[70] flex flex-col space-y-2 transition-all duration-300 ${
      isFullscreen ? 'top-2 right-2' : 'top-4 right-4'
    }`}>
      {/* Zoom Controls */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 backdrop-blur-sm bg-opacity-95">
        <EnhancedTooltip content="Zoom In" position="left" delay={300}>
          <button
            onClick={handleZoomIn}
            className="flex items-center justify-center w-12 h-12 hover:bg-blue-50 text-gray-700 transition-all duration-200 rounded-t-xl border-b border-gray-200 hover:scale-105 active:scale-95"
            aria-label="Zoom In"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </EnhancedTooltip>
        <EnhancedTooltip content="Zoom Out" position="left" delay={300}>
          <button
            onClick={handleZoomOut}
            className="flex items-center justify-center w-12 h-12 hover:bg-blue-50 text-gray-700 transition-all duration-200 rounded-b-xl hover:scale-105 active:scale-95"
            aria-label="Zoom Out"
          >
            <MinusIcon className="h-5 w-5" />
          </button>
        </EnhancedTooltip>
      </div>

      {/* Map Type Toggle */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 backdrop-blur-sm bg-opacity-95">
        <EnhancedTooltip
          content={`Switch to ${currentMapType === "hybrid" ? 'Road' : 'Satellite'} view`}
          position="left"
          delay={300}
        >
          <button
            onClick={toggleMapType}
            className="flex items-center justify-center w-12 h-12 hover:bg-green-50 text-gray-700 transition-all duration-200 rounded-xl hover:scale-105 active:scale-95"
            aria-label={`Switch to ${currentMapType === "hybrid" ? 'Road' : 'Satellite'} view`}
          >
            <GlobeAltIcon className="h-5 w-5" />
          </button>
        </EnhancedTooltip>
      </div>

      {/* Fullscreen Toggle */}
      <FullscreenToggle />

      {/* Map Type Indicator */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 px-3 py-2 backdrop-blur-sm bg-opacity-95">
        <span className="text-xs font-semibold text-gray-700 tracking-wide">
          {currentMapType === "hybrid" ? '🗺️ Hybrid' : '🛣️ Road'}
        </span>
      </div>
    </div>
  );
};

export default CustomMapControls;