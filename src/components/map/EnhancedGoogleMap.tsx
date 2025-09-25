import React, { useCallback, useRef, useEffect, useState } from 'react';
import { convertMapTypeIdToString } from '../../utils/unifiedGeofencing';
import { Wrapper } from '@googlemaps/react-wrapper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { setMapCenter, setMapZoom } from '../../store/slices/mapSlice';
import {
  MapControls,
  MapSettings,
  CoordinateDisplay,
  MapEventHandlers,
  RegionRestriction
} from '../../types';
import MapControlPanel from './MapControlPanel';
import CoordinateDisplayWidget from './CoordinateDisplayWidget';
import MapTypeSelector from './MapTypeSelector';
import { convertStringToMapTypeId } from '../../utils/unifiedGeofencing';

interface EnhancedGoogleMapProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  controls?: MapControls;
  settings?: Partial<MapSettings>;
  coordinateDisplay?: Partial<CoordinateDisplay>;
  regionRestriction?: Partial<RegionRestriction>;
  eventHandlers?: MapEventHandlers;
  className?: string;
}

const EnhancedGoogleMap: React.FC<EnhancedGoogleMapProps> = ({
  center,
  zoom,
  controls = {
    zoom: false,
    mapType: false,
    fullscreen: false,
    streetView: false,
    scale: false,
  },
  settings = {},
  coordinateDisplay = {
    enabled: true,
    format: 'decimal',
    precision: 6,
  },
  regionRestriction,
  eventHandlers = {},
  className = 'h-full w-full',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  // State for coordinate display
  const [currentCoordinates, setCurrentCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [currentMapType, setCurrentMapType] = useState<string>(
    settings.mapTypeId || "roadmap"
  );

  // Debounce refs for preventing excessive updates
  const centerUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const zoomUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Default map styles for different themes
  const mapStyles = {
    default: [],
    satellite: [],
    terrain: [],
    hybrid: [],
    dark: [
      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
      {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }]
      },
      {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }]
      },
      {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#263c3f" }]
      },
      {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a76" }]
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#38414e" }]
      },
      {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }]
      },
      {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca5b3" }]
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#746855" }]
      },
      {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1f2835" }]
      },
      {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f3d19c" }]
      },
      {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f3948" }]
      },
      {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }]
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#17263c" }]
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515c6d" }]
      },
      {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#17263c" }]
      }
    ],
    retro: [
      { elementType: "geometry", stylers: [{ color: "#ebe3cd" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#523735" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#f5f1e6" }] },
      {
        featureType: "administrative",
        elementType: "geometry.stroke",
        stylers: [{ color: "#c9b2a6" }]
      },
      {
        featureType: "administrative.land_parcel",
        elementType: "geometry.stroke",
        stylers: [{ color: "#dcd2be" }]
      },
      {
        featureType: "administrative.land_parcel",
        elementType: "labels.text.fill",
        stylers: [{ color: "#ae9e90" }]
      },
      {
        featureType: "landscape.natural",
        elementType: "geometry",
        stylers: [{ color: "#dfd2ae" }]
      },
      {
        featureType: "poi",
        elementType: "geometry",
        stylers: [{ color: "#dfd2ae" }]
      },
      {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#93817c" }]
      },
      {
        featureType: "poi.park",
        elementType: "geometry.fill",
        stylers: [{ color: "#a5b076" }]
      },
      {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#447530" }]
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#f5f1e6" }]
      },
      {
        featureType: "road.arterial",
        elementType: "geometry",
        stylers: [{ color: "#fdfcf8" }]
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#f8c967" }]
      },
      {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#e9bc62" }]
      },
      {
        featureType: "road.highway.controlled_access",
        elementType: "geometry",
        stylers: [{ color: "#e98d58" }]
      },
      {
        featureType: "road.highway.controlled_access",
        elementType: "geometry.stroke",
        stylers: [{ color: "#db8555" }]
      },
      {
        featureType: "road.local",
        elementType: "labels.text.fill",
        stylers: [{ color: "#806b63" }]
      },
      {
        featureType: "transit.line",
        elementType: "geometry",
        stylers: [{ color: "#dfd2ae" }]
      },
      {
        featureType: "transit.line",
        elementType: "labels.text.fill",
        stylers: [{ color: "#8f7d77" }]
      },
      {
        featureType: "transit.line",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#ebe3cd" }]
      },
      {
        featureType: "transit.station",
        elementType: "geometry",
        stylers: [{ color: "#dfd2ae" }]
      },
      {
        featureType: "water",
        elementType: "geometry.fill",
        stylers: [{ color: "#b9d3c2" }]
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#92998d" }]
      }
    ]
  };

  // Event handlers with debouncing
  const handleCenterChanged = useCallback(() => {
    if (googleMapRef.current) {
      if (centerUpdateTimeoutRef.current) {
        clearTimeout(centerUpdateTimeoutRef.current);
      }

      centerUpdateTimeoutRef.current = setTimeout(() => {
        if (googleMapRef.current) {
          const newCenter = googleMapRef.current.getCenter();
          if (newCenter) {
            const lat = newCenter.lat();
            const lng = newCenter.lng();
            dispatch(setMapCenter([lat, lng]));
            eventHandlers.onCenterChanged?.({ lat, lng });
          }
        }
      }, 300);
    }
  }, [dispatch, eventHandlers]);

  const handleZoomChanged = useCallback(() => {
    if (googleMapRef.current) {
      if (zoomUpdateTimeoutRef.current) {
        clearTimeout(zoomUpdateTimeoutRef.current);
      }

      zoomUpdateTimeoutRef.current = setTimeout(() => {
        if (googleMapRef.current) {
          const newZoom = googleMapRef.current.getZoom();
          if (newZoom !== undefined) {
            dispatch(setMapZoom(newZoom));
            eventHandlers.onZoomChanged?.(newZoom);
          }
        }
      }, 200);
    }
  }, [dispatch, eventHandlers]);

  const handleMouseMove = useCallback((event: google.maps.MapMouseEvent) => {
    if (coordinateDisplay?.enabled && event.latLng) {
      setCurrentCoordinates({
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      });
    }
    eventHandlers.onMouseMove?.(event);
  }, [coordinateDisplay, eventHandlers]);

  const handleMapTypeChanged = useCallback(() => {
    if (googleMapRef.current) {
      const newMapType = googleMapRef.current.getMapTypeId();
      if (newMapType && typeof newMapType === 'string') {
        setCurrentMapType(newMapType as string);
        eventHandlers.onMapTypeChanged?.(newMapType as google.maps.MapTypeId);
      }
    }
  }, [eventHandlers]);

  // Initialize Google Map
  useEffect(() => {
    if (mapRef.current && !googleMapRef.current) {
      try {
        // Create map with all settings
        const mapOptions: google.maps.MapOptions = {
          center,
          zoom,
          mapTypeId: settings.mapTypeId || google.maps.MapTypeId.ROADMAP,
          styles: settings.styles || mapStyles.default,
          gestureHandling: settings.gestureHandling || 'auto',
          draggable: settings.draggable !== false,
          scrollwheel: settings.scrollwheel !== false,
          disableDoubleClickZoom: settings.disableDoubleClickZoom || false,
          keyboardShortcuts: settings.keyboardShortcuts !== false,

          // Control visibility
          zoomControl: controls.zoom,
          streetViewControl: controls.streetView,
          mapTypeControl: controls.mapType,
          fullscreenControl: controls.fullscreen,
          scaleControl: controls.scale,
          rotateControl: controls.rotate,

          // Position controls
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
          },
          mapTypeControlOptions: {
            position: google.maps.ControlPosition.TOP_RIGHT,
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          },
          fullscreenControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP,
          },
          streetViewControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
          },
        };

        // Add region restriction if provided
        if (regionRestriction?.enabled && regionRestriction.bounds) {
          mapOptions.restriction = {
            latLngBounds: regionRestriction.bounds,
            strictBounds: regionRestriction.strictBounds || false,
          };
        }

        googleMapRef.current = new google.maps.Map(mapRef.current, mapOptions);

        // Add event listeners
        googleMapRef.current.addListener('center_changed', handleCenterChanged);
        googleMapRef.current.addListener('zoom_changed', handleZoomChanged);
        googleMapRef.current.addListener('maptypeid_changed', handleMapTypeChanged);

        if (coordinateDisplay?.enabled) {
          googleMapRef.current.addListener('mousemove', handleMouseMove);
        }

        // Add click handlers
        if (eventHandlers.onClick) {
          googleMapRef.current.addListener('click', eventHandlers.onClick);
        }
        if (eventHandlers.onRightClick) {
          googleMapRef.current.addListener('rightclick', eventHandlers.onRightClick);
        }
        if (eventHandlers.onMouseOut) {
          googleMapRef.current.addListener('mouseout', eventHandlers.onMouseOut);
        }
        if (eventHandlers.onBoundsChanged) {
          googleMapRef.current.addListener('bounds_changed', () => {
            const bounds = googleMapRef.current?.getBounds();
            if (bounds) {
              eventHandlers.onBoundsChanged?.(bounds);
            }
          });
        }

      } catch (error) {
        console.error('Error creating Google Map:', error);
      }
    }

    return () => {
      if (centerUpdateTimeoutRef.current) {
        clearTimeout(centerUpdateTimeoutRef.current);
      }
      if (zoomUpdateTimeoutRef.current) {
        clearTimeout(zoomUpdateTimeoutRef.current);
      }
    };
  }, [
    center,
    zoom,
    settings,
    controls,
    coordinateDisplay,
    regionRestriction,
    eventHandlers,
    handleCenterChanged,
    handleZoomChanged,
    handleMapTypeChanged,
    handleMouseMove,
  ]);

  // Update map when props change
  useEffect(() => {
    if (googleMapRef.current) {
      const currentCenter = googleMapRef.current.getCenter();
      const currentZoom = googleMapRef.current.getZoom();

      if (
        currentCenter &&
        (Math.abs(currentCenter.lat() - center.lat) > 0.0001 ||
          Math.abs(currentCenter.lng() - center.lng) > 0.0001)
      ) {
        googleMapRef.current.setCenter(center);
      }

      if (currentZoom !== zoom) {
        googleMapRef.current.setZoom(zoom);
      }
    }
  }, [center.lat, center.lng, zoom]);

  // Helper functions for controls
  const handleZoomIn = useCallback(() => {
    if (googleMapRef.current) {
      const currentZoom = googleMapRef.current.getZoom();
      if (currentZoom !== undefined) {
        googleMapRef.current.setZoom(currentZoom + 1);
      }
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (googleMapRef.current) {
      const currentZoom = googleMapRef.current.getZoom();
      if (currentZoom !== undefined) {
        googleMapRef.current.setZoom(currentZoom - 1);
      }
    }
  }, []);

  const handleResetView = useCallback(() => {
    if (googleMapRef.current) {
      googleMapRef.current.setCenter({ lat: 20.5937, lng: 78.9629 }); // India center
      googleMapRef.current.setZoom(5);
    }
  }, []);

  const handleMapTypeChange = useCallback((mapTypeId: google.maps.MapTypeId) => {
    if (googleMapRef.current && window.google) {
      googleMapRef.current.setMapTypeId(mapTypeId);
      setCurrentMapType(convertMapTypeIdToString(mapTypeId));
    }
  }, []);


  const handleStyleChange = useCallback((styleId: string) => {
    if (googleMapRef.current && styleId in mapStyles) {
      const styleName = styleId as keyof typeof mapStyles;
      googleMapRef.current.setOptions({
        styles: mapStyles[styleName],
      });
    }
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="h-full w-full" />

      {/* Custom Controls */}
      <MapControlPanel
        map={googleMapRef.current}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
      />

      {/* Map Type Selector */}
      <MapTypeSelector
        currentMapType={currentMapType}
        onMapTypeChange={handleMapTypeChange}
        onStyleChange={handleStyleChange}
      />

      {/* Coordinate Display */}
      {coordinateDisplay?.enabled && currentCoordinates && (
        <CoordinateDisplayWidget
          coordinates={currentCoordinates}
          format={coordinateDisplay.format || 'decimal'}
          precision={coordinateDisplay.precision || 6}
        />
      )}
    </div>
  );
};

const EnhancedGoogleMapContainer: React.FC<Omit<EnhancedGoogleMapProps, 'center' | 'zoom'>> = (props) => {
  const { center, zoom } = useSelector((state: RootState) => state.map);

  const render = (status: any) => {
    if (status === 'LOADING') {
      return (
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center max-w-md p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">Loading Opti Connect Map</h3>
            <p className="text-blue-700 font-medium mb-3">Initializing Google Maps...</p>
            <div className="space-y-2 text-sm text-blue-600">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Loading Maps JavaScript API</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <span>Setting up interactive controls</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                <span>Preparing coordinate display</span>
              </div>
            </div>
            <div className="mt-6 p-3 bg-white/50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600">
                <strong>Note:</strong> If loading takes too long, check your Google Maps API key configuration.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (status === 'FAILURE') {
      return (
        <div className="flex items-center justify-center h-full bg-red-50">
          <div className="text-center p-6 max-w-md">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Google Maps Failed to Load</h3>
            <p className="text-red-600 text-sm mb-4">
              Unable to initialize the Google Maps JavaScript API
            </p>
            <div className="text-xs text-gray-600 bg-gray-100 p-3 rounded-lg text-left">
              <p className="font-medium mb-2">Common solutions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check your API key is valid</li>
                <li>Enable Maps JavaScript API in Google Cloud Console</li>
                <li>Verify billing is enabled</li>
                <li>Check domain restrictions</li>
                <li>Ensure API key has sufficient quota</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return (
      <EnhancedGoogleMap
        center={{ lat: center[0], lng: center[1] }}
        zoom={zoom}
        {...props}
      />
    );
  };

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full bg-yellow-50">
        <div className="text-center p-6 max-w-md">
          <div className="text-yellow-600 text-4xl mb-4">🔑</div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">API Key Required</h3>
          <p className="text-yellow-700 text-sm mb-4">
            Google Maps API key is required to display the map
          </p>
          <div className="text-xs text-gray-600 bg-yellow-100 p-3 rounded-lg">
            <p className="font-medium mb-2">Setup instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-left">
              <li>Get an API key from Google Cloud Console</li>
              <li>Enable Maps JavaScript API</li>
              <li>Add to .env file:</li>
            </ol>
            <code className="block mt-2 p-2 bg-yellow-200 rounded text-xs">
              REACT_APP_GOOGLE_MAPS_API_KEY=your_key_here
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Wrapper
      apiKey={apiKey}
      render={render}
      libraries={['geometry', 'places', 'drawing']}
      version="weekly"
    />
  );
};

export default EnhancedGoogleMapContainer;