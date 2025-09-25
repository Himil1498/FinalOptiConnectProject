import React, { useRef, useEffect, useState, useCallback } from 'react';

interface StreetViewPanelProps {
  position?: google.maps.LatLngLiteral;
  onClose?: () => void;
  isVisible: boolean;
  onPositionChange?: (position: google.maps.LatLngLiteral) => void;
}

const StreetViewPanel: React.FC<StreetViewPanelProps> = ({
  position,
  onClose,
  isVisible,
  onPositionChange
}) => {
  const streetViewRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [heading, setHeading] = useState<number>(0);
  const [pitch, setPitch] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);

  // Use a simple dark mode detection - can be improved with proper theme management
  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Initialize Street View
  const initializeStreetView = useCallback(async () => {
    if (!streetViewRef.current || !position || !window.google) return;

    setIsLoading(true);

    try {
      // Create Street View service to check availability
      const streetViewService = new google.maps.StreetViewService();

      // Check if Street View is available at this location
      streetViewService.getPanorama({
        location: position,
        radius: 50,
        source: google.maps.StreetViewSource.DEFAULT
      }, (data, status) => {
        if (status === google.maps.StreetViewStatus.OK && data?.location?.latLng) {
          setIsAvailable(true);

          // Create the panorama
          const panorama = new google.maps.StreetViewPanorama(streetViewRef.current!, {
            position: data.location.latLng,
            pov: {
              heading: heading,
              pitch: pitch
            },
            zoom: zoom,
            visible: true,
            addressControl: true,
            linksControl: true,
            panControl: true,
            enableCloseButton: false,
            fullscreenControl: true,
            motionTracking: false,
            motionTrackingControl: false,
            showRoadLabels: true,
            clickToGo: true,
            scrollwheel: true,
            disableDefaultUI: false,
            zoomControl: true
          });

          panoramaRef.current = panorama;

          // Add event listeners
          panorama.addListener('position_changed', () => {
            const newPosition = panorama.getPosition();
            if (newPosition && onPositionChange) {
              onPositionChange({
                lat: newPosition.lat(),
                lng: newPosition.lng()
              });
            }
          });

          panorama.addListener('pov_changed', () => {
            const pov = panorama.getPov();
            if (pov) {
              setHeading(pov.heading || 0);
              setPitch(pov.pitch || 0);
            }
          });

          panorama.addListener('zoom_changed', () => {
            setZoom(panorama.getZoom() || 1);
          });

        } else {
          setIsAvailable(false);
        }
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Error initializing Street View:', error);
      setIsAvailable(false);
      setIsLoading(false);
    }
  }, [position, heading, pitch, zoom, onPositionChange]);

  // Update Street View position when position prop changes
  useEffect(() => {
    if (isVisible && position) {
      initializeStreetView();
    }
  }, [isVisible, position, initializeStreetView]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (panoramaRef.current) {
        panoramaRef.current = null;
      }
    };
  }, []);

  // Reset view controls
  const resetView = useCallback(() => {
    if (panoramaRef.current) {
      panoramaRef.current.setPov({
        heading: 0,
        pitch: 0
      });
      panoramaRef.current.setZoom(1);
    }
  }, []);

  // Move to new location
  const moveToLocation = useCallback((newPosition: google.maps.LatLngLiteral) => {
    if (panoramaRef.current) {
      panoramaRef.current.setPosition(newPosition);
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed right-0 top-0 h-full w-96 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl border-l ${isDark ? 'border-gray-700' : 'border-gray-200'} z-40 transform transition-transform duration-300 ease-in-out`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Street View</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {position ? `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}` : 'No location selected'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
          title="Close Street View"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Controls */}
      <div className={`p-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Heading: {Math.round(heading)}°
            </span>
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Pitch: {Math.round(pitch)}°
            </span>
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Zoom: {zoom.toFixed(1)}x
            </span>
          </div>
          <button
            onClick={resetView}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
            title="Reset View"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Street View Container */}
      <div className="relative flex-1 h-[calc(100%-140px)]">
        {isLoading && (
          <div className={`absolute inset-0 flex items-center justify-center z-10 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex flex-col items-center space-y-3">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-600'}`}></div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading Street View...</p>
            </div>
          </div>
        )}

        {!isLoading && !isAvailable && position && (
          <div className={`absolute inset-0 flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="text-center space-y-4 p-6">
              <div className={`p-4 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} mx-auto w-16 h-16 flex items-center justify-center`}>
                <svg className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              </div>
              <div>
                <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Street View Unavailable</h4>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Street View imagery is not available for this location.
                </p>
                <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Try clicking on a different location on the map.
                </p>
              </div>
            </div>
          </div>
        )}

        {!position && (
          <div className={`absolute inset-0 flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="text-center space-y-4 p-6">
              <div className={`p-4 rounded-full ${isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-600'} mx-auto w-16 h-16 flex items-center justify-center`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Click on Map</h4>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Click anywhere on the map to view Street View imagery.
                </p>
                <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Street View shows 360° panoramic views of streets and locations.
                </p>
              </div>
            </div>
          </div>
        )}

        <div
          ref={streetViewRef}
          className={`w-full h-full ${(!isAvailable || !position) ? 'hidden' : ''}`}
          style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}
        />
      </div>

      {/* Info Footer */}
      {isAvailable && position && (
        <div className={`p-3 border-t ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Street View Active</span>
              </div>
            </div>
            <div className={`text-right ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <div>Click and drag to look around</div>
              <div>Use controls to navigate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreetViewPanel;