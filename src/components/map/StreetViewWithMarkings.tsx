import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Z_INDEX } from '../../constants/zIndex';
import { XMarkIcon, EyeIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

interface Point {
  id: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  label?: string;
}

interface StreetViewWithMarkingsProps {
  isOpen: boolean;
  onClose: () => void;
  centerPoint: Point;
  points: Point[];
  lines: { start: Point; end: Point; distance: number }[];
  title?: string;
}

const StreetViewWithMarkings: React.FC<StreetViewWithMarkingsProps> = ({
  isOpen,
  onClose,
  centerPoint,
  points,
  lines,
  title = 'Street View with Distance Markings'
}) => {
  const streetViewRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const markersRef = useRef<(google.maps.Marker | google.maps.InfoWindow)[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [streetViewAvailable, setStreetViewAvailable] = useState(true);
  const [panoramaLoaded, setPanoramaLoaded] = useState(false);

  // Clear all existing markers, polylines, and info windows
  const clearMarkings = useCallback(() => {
    markersRef.current.forEach(item => {
      if (item instanceof google.maps.Marker) {
        item.setMap(null);
      } else if (item instanceof google.maps.InfoWindow) {
        item.close();
      }
    });
    polylinesRef.current.forEach(polyline => polyline.setMap(null));
    markersRef.current = [];
    polylinesRef.current = [];
  }, []);

  // Initialize Street View panorama
  const initializeStreetView = useCallback(async () => {
    if (!streetViewRef.current || !isOpen) return;

    setIsLoading(true);
    clearMarkings();

    try {
      // Create Street View service to check availability
      const streetViewService = new google.maps.StreetViewService();

      // Check if Street View is available at the center point with larger radius
      streetViewService.getPanorama(
        {
          location: { lat: centerPoint.lat, lng: centerPoint.lng },
          radius: 100, // Increased radius for better coverage
          source: google.maps.StreetViewSource.OUTDOOR
        },
        (data, status) => {
          if (status === google.maps.StreetViewStatus.OK && data?.location?.latLng) {
            setStreetViewAvailable(true);

            // Use the actual panorama position for more accurate placement
            const panoramaPosition = data.location.latLng;

            // Create panorama at the closest available position
            const panorama = new google.maps.StreetViewPanorama(streetViewRef.current!, {
              position: panoramaPosition,
              pov: {
                heading: 0,
                pitch: 0
              },
              zoom: 1,
              panControl: true,
              panControlOptions: {
                position: google.maps.ControlPosition.RIGHT_CENTER
              },
              zoomControl: true,
              zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_CENTER
              },
              addressControl: true,
              linksControl: true,
              motionTracking: true,
              motionTrackingControl: true,
              showRoadLabels: true
            });

            panoramaRef.current = panorama;

            // Wait for panorama to be ready
            google.maps.event.addListenerOnce(panorama, 'pano_changed', () => {
              setPanoramaLoaded(true);
              setIsLoading(false);
              addMarkingsToStreetView();
            });

          } else {
            setStreetViewAvailable(false);
            setIsLoading(false);
          }
        }
      );
    } catch (error) {
      console.error('Error initializing Street View:', error);
      setStreetViewAvailable(false);
      setIsLoading(false);
    }
  }, [centerPoint, isOpen, clearMarkings]);

  // Add markings to Street View using Google Maps overlays
  const addMarkingsToStreetView = useCallback(() => {
    if (!panoramaRef.current || !panoramaLoaded) return;

    clearMarkings();

    try {
      // Add point markers to Street View
      points.forEach((point, index) => {
        const marker = new google.maps.Marker({
          position: { lat: point.lat, lng: point.lng },
          map: panoramaRef.current as google.maps.StreetViewPanorama,
          title: `Point ${index + 1}${point.label ? `: ${point.label}` : ''}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: index === 0 ? '#10B981' : index === points.length - 1 ? '#EF4444' : '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          },
          label: {
            text: (index + 1).toString(),
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 'bold'
          }
        });
        markersRef.current.push(marker);
      });

      // For Street View, we can't add polylines directly, but we can add markers at line midpoints
      // to show distance information
      lines.forEach((line, index) => {
        // Add distance marker at the midpoint
        const midLat = (line.start.lat + line.end.lat) / 2;
        const midLng = (line.start.lng + line.end.lng) / 2;

        const distanceMarker = new google.maps.Marker({
          position: { lat: midLat, lng: midLng },
          map: panoramaRef.current as google.maps.StreetViewPanorama,
          title: `Distance: ${(line.distance / 1000).toFixed(2)} km`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: '#F59E0B',
            fillOpacity: 0.9,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          },
          label: {
            text: `${(line.distance / 1000).toFixed(1)}km`,
            color: '#FFFFFF',
            fontSize: '10px',
            fontWeight: 'bold'
          }
        });
        markersRef.current.push(distanceMarker);
      });

    } catch (error) {
      console.error('Error adding markings to Street View:', error);
    }
  }, [points, lines, panoramaLoaded, clearMarkings]);

  // Initialize Street View when dialog opens
  useEffect(() => {
    if (isOpen && window.google?.maps) {
      initializeStreetView();
    }

    return () => {
      if (!isOpen) {
        clearMarkings();
        panoramaRef.current = null;
        setPanoramaLoaded(false);
      }
    };
  }, [isOpen, initializeStreetView, clearMarkings]);

  // Update markings when points or lines change
  useEffect(() => {
    if (panoramaLoaded && isOpen) {
      addMarkingsToStreetView();
    }
  }, [points, lines, panoramaLoaded, isOpen, addMarkingsToStreetView]);

  // Open Street View in new tab with correct format
  const openInGoogleMaps = () => {
    // Simple and reliable Google Maps Street View URL format
    const streetViewUrl = `https://www.google.com/maps/@${centerPoint.lat},${centerPoint.lng},3a,75y,0h,90t`;

    // Fallback to regular map view
    const mapUrl = `https://www.google.com/maps/@${centerPoint.lat},${centerPoint.lng},15z`;

    try {
      // Try to open Street View first
      window.open(streetViewUrl, '_blank');
    } catch (error) {
      console.error('Failed to open Street View URL, opening map view:', error);
      // Fallback to regular map view
      window.open(mapUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ zIndex: Z_INDEX.MODAL }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[80vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-100 border-b-2 border-orange-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <EyeIcon className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                360° View
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={openInGoogleMaps}
                className="p-2 hover:bg-orange-100 rounded-lg transition-colors duration-200 group"
                title="Open in Google Maps"
              >
                <ArrowsPointingOutIcon className="w-5 h-5 text-orange-600 group-hover:text-orange-700" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-orange-100 rounded-lg transition-colors duration-200 group"
                title="Close Street View"
              >
                <XMarkIcon className="w-5 h-5 text-orange-600 group-hover:text-orange-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="h-full relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading Street View...</p>
              </div>
            </div>
          )}

          {!streetViewAvailable && !isLoading && (
            <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
              <div className="text-center max-w-md">
                <EyeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Street View Not Available
                </h4>
                <p className="text-gray-600 mb-4">
                  Street View imagery is not available at this location. Try a nearby location or use the regular map view.
                </p>
                <button
                  onClick={openInGoogleMaps}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Open in Google Maps
                </button>
              </div>
            </div>
          )}

          <div
            ref={streetViewRef}
            className="w-full h-full"
            style={{ minHeight: '400px' }}
          />

          {/* Street View Controls Info - Enhanced with distance data */}
          {panoramaLoaded && (
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-sm max-h-96 overflow-y-auto border border-gray-200">
              <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="text-lg">📏</span>
                <span className="ml-2">Distance Measurements</span>
                <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Live View</span>
              </h5>

              {/* Points List */}
              <div className="mb-4">
                <h6 className="text-sm font-medium text-gray-700 mb-2">Measurement Points ({points.length})</h6>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {points.map((point, index) => (
                    <div key={point.id} className="flex items-center space-x-2 text-xs">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-green-500' :
                          index === points.length - 1 ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}
                      ></div>
                      <span className="font-medium">
                        {index === 0 ? 'Start' : index === points.length - 1 ? 'End' : `Point ${index + 1}`}
                      </span>
                      <span className="text-gray-500">
                        ({point.lat.toFixed(4)}, {point.lng.toFixed(4)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Distance Lines */}
              {lines.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-sm font-medium text-gray-700 mb-2">Distance Segments ({lines.length})</h6>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {lines.map((line, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-0.5 bg-amber-500"></div>
                          <span>Segment {index + 1}</span>
                        </div>
                        <span className="font-medium text-amber-600">
                          {line.distance.toFixed(2)}m
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total Distance */}
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span className="text-gray-900">Total Distance:</span>
                      <span className="text-orange-600">
                        {lines.reduce((sum, line) => sum + line.distance, 0).toFixed(2)}m
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-2 rounded">
                <p className="flex items-center"><span className="mr-1">🎯</span> <strong>Center:</strong> {centerPoint.lat.toFixed(4)}, {centerPoint.lng.toFixed(4)}</p>
                <p className="flex items-center"><span className="mr-1">🔄</span> Use Street View controls to look around</p>
                <p className="flex items-center"><span className="mr-1">📍</span> Colored markers show measurement points</p>
                <p className="flex items-center"><span className="mr-1">📏</span> Orange markers show distance segments</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreetViewWithMarkings;