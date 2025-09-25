import React, { useState, useCallback } from 'react';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';
import { useTheme } from '../../hooks/useTheme';
import { convertStringToMapTypeId } from '../../utils/unifiedGeofencing';
import {
  MapIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  GlobeAltIcon,
  MapPinIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface GoogleMapsComponentProps {
  activeTool: string | null;
  onToolComplete?: (toolType: string, data: any) => void;
}

export const GoogleMapsComponent: React.FC<GoogleMapsComponentProps> = ({
  activeTool,
  onToolComplete
}) => {
  const [currentZoom, setCurrentZoom] = useState(5);
  const [currentMapType, setCurrentMapType] = useState<string>("roadmap");
  const [showMapTypeMenu, setShowMapTypeMenu] = useState(false);
  const { addNotification } = useTheme();

  const mapConfig = {
    center: { lat: 20.5937, lng: 78.9629 }, // India center
    zoom: currentZoom,
    mapTypeId: convertStringToMapTypeId(currentMapType)
  };

  const {
    mapRef,
    map,
    isLoaded,
    error,
    mousePosition,
    indiaBounds,
    isPointInIndia,
    panTo,
    setZoom,
    setMapType,
    addMarker,
    addPolygon,
    getCurrentBounds
  } = useGoogleMaps(mapConfig);

  const handleZoomIn = useCallback(() => {
    if (map) {
      const newZoom = Math.min(currentZoom + 1, 20);
      setZoom(newZoom);
      setCurrentZoom(newZoom);
    }
  }, [map, currentZoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    if (map) {
      const newZoom = Math.max(currentZoom - 1, 1);
      setZoom(newZoom);
      setCurrentZoom(newZoom);
    }
  }, [map, currentZoom, setZoom]);

  const handleMapTypeChange = useCallback((mapType: google.maps.MapTypeId) => {
    setMapType(mapType);
    setCurrentMapType(mapType);
    setShowMapTypeMenu(false);

    addNotification({
      type: 'info',
      title: 'Map Type Changed',
      message: `Switched to ${mapType.charAt(0).toUpperCase() + mapType.slice(1)} view`,
      duration: 2000
    });
  }, [setMapType, addNotification]);

  const handleFitToIndia = useCallback(() => {
    if (map && indiaBounds) {
      map.fitBounds(indiaBounds);
      addNotification({
        type: 'success',
        title: 'View Reset',
        message: 'Map centered on India',
        duration: 2000
      });
    }
  }, [map, indiaBounds, addNotification]);

  const mapTypeOptions = [
    { id: google.maps.MapTypeId.ROADMAP, label: 'Roadmap', icon: MapIcon },
    { id: google.maps.MapTypeId.SATELLITE, label: 'Satellite', icon: GlobeAltIcon },
    { id: google.maps.MapTypeId.HYBRID, label: 'Hybrid', icon: MapPinIcon },
    { id: google.maps.MapTypeId.TERRAIN, label: 'Terrain', icon: MapIcon }
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50">
        <div className="text-center p-8">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Google Maps Error
          </div>
          <div className="text-red-600 text-sm">
            {error}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Please check your API key configuration
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-100">
      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />

      {/* Loading Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-lg font-semibold text-gray-700">
              Loading Google Maps...
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Initializing India boundary restrictions
            </div>
          </div>
        </div>
      )}

      {/* Map Controls */}
      {isLoaded && (
        <>
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <button
              onClick={handleZoomIn}
              className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-2 shadow-lg transition-all duration-200 hover:shadow-xl"
              title="Zoom In"
              disabled={currentZoom >= 20}
            >
              <MagnifyingGlassPlusIcon className="h-5 w-5 text-gray-700" />
            </button>

            <button
              onClick={handleZoomOut}
              className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-2 shadow-lg transition-all duration-200 hover:shadow-xl"
              title="Zoom Out"
              disabled={currentZoom <= 1}
            >
              <MagnifyingGlassMinusIcon className="h-5 w-5 text-gray-700" />
            </button>

            <div className="text-xs text-center text-gray-600 bg-white border border-gray-300 rounded px-2 py-1 shadow-lg">
              {currentZoom}x
            </div>
          </div>

          {/* Map Type Switcher */}
          <div className="absolute top-4 left-4 z-10">
            <div className="relative">
              <button
                onClick={() => setShowMapTypeMenu(!showMapTypeMenu)}
                className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 shadow-lg transition-all duration-200 hover:shadow-xl flex items-center gap-2"
              >
                <MapIcon className="h-5 w-5 text-gray-700" />
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {currentMapType}
                </span>
                <ChevronDownIcon
                  className={`h-4 w-4 text-gray-500 transition-transform duration-200
                             ${showMapTypeMenu ? 'rotate-180' : ''}`}
                />
              </button>

              {showMapTypeMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl min-w-[150px] py-1 z-20">
                  {mapTypeOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleMapTypeChange(option.id)}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors duration-150 hover:bg-gray-100 ${
                                   currentMapType === option.id
                                     ? 'bg-blue-50 text-blue-700'
                                     : 'text-gray-700'
                                   }`}
                      >
                        <IconComponent className="h-4 w-4" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Fit to India Button */}
          <div className="absolute bottom-20 right-4 z-10">
            <button
              onClick={handleFitToIndia}
              className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 shadow-lg transition-all duration-200 hover:shadow-xl flex items-center gap-2"
              title="Fit to India"
            >
              <GlobeAltIcon className="h-5 w-5 text-gray-700" />
              <span className="text-sm font-medium text-gray-700">
                Fit to India
              </span>
            </button>
          </div>

          {/* Live Coordinates Display */}
          {mousePosition && (
            <div className="absolute bottom-4 left-4 z-10">
              <div className="bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-lg">
                <div className="text-xs font-medium text-gray-600 mb-1">
                  Live Coordinates
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="text-gray-700">
                    <span className="font-medium">Lat:</span> {mousePosition.lat.toFixed(6)}
                  </div>
                  <div className="text-gray-700">
                    <span className="font-medium">Lng:</span> {mousePosition.lng.toFixed(6)}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {isPointInIndia(mousePosition.lat, mousePosition.lng)
                    ? '✓ Within India'
                    : '⚠ Outside India (Restricted)'}
                </div>
              </div>
            </div>
          )}

          {/* Active Tool Status */}
          {activeTool && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
                <div className="text-sm font-medium">
                  {activeTool === 'distance' && 'Distance Measurement Active'}
                  {activeTool === 'polygon' && 'Polygon Drawing Active'}
                  {activeTool === 'elevation' && 'Elevation Analysis Active'}
                </div>
                <div className="text-xs opacity-90 mt-1">
                  Click on the map to use this tool
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};