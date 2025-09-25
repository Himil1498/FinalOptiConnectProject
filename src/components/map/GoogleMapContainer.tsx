import React, { useCallback, useRef, useEffect } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { setMapCenter, setMapZoom, setSelectedTower } from '../../store/slices/mapSlice';
import { createCompatibleMarker } from '../../utils/markerUtils';

interface GoogleMapProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  onMapReady?: (map: google.maps.Map) => void;
  onClick?: (event: google.maps.MapMouseEvent) => void;
}

const GoogleMap: React.FC<GoogleMapProps> = ({ center, zoom, onMapReady, onClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const { towers, layers } = useSelector((state: RootState) => state.map);
  const dispatch = useDispatch<AppDispatch>();
  const markersRef = useRef<google.maps.Marker[]>([]);
  const boundaryRef = useRef<google.maps.Data | null>(null);

  // Debounce refs for preventing excessive updates
  const centerUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const zoomUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load India boundary from GeoJSON file
  const loadIndiaBoundary = useCallback(async () => {
    if (!googleMapRef.current) return;

    try {
      const response = await fetch('/india-boundary.geojson');
      const geoJsonData = await response.json();

      // Add data layer for boundaries
      const dataLayer = new google.maps.Data();
      dataLayer.addGeoJson(geoJsonData);

      // Style the boundary
      dataLayer.setStyle({
        strokeColor: '#2563eb',
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: 'transparent',
        fillOpacity: 0,
      });

      dataLayer.setMap(googleMapRef.current);
      boundaryRef.current = dataLayer;
    } catch (error) {
      console.error('Error loading India boundary:', error);
    }
  }, []);

  // Memoize event handlers to prevent infinite re-renders
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
          }
        }
      }, 300); // 300ms debounce
    }
  }, [dispatch]);

  const handleZoomChanged = useCallback(() => {
    if (googleMapRef.current) {
      if (zoomUpdateTimeoutRef.current) {
        clearTimeout(zoomUpdateTimeoutRef.current);
      }

      zoomUpdateTimeoutRef.current = setTimeout(() => {
        if (googleMapRef.current) {
          const newZoom = googleMapRef.current.getZoom();
          if (newZoom) {
            dispatch(setMapZoom(newZoom));
          }
        }
      }, 200); // 200ms debounce
    }
  }, [dispatch]);

  // Initialize Google Map (only once)
  useEffect(() => {

    if (mapRef.current && !googleMapRef.current) {
      try {
        googleMapRef.current = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeId: google.maps.MapTypeId.HYBRID,
          disableDefaultUI: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: false,
        });

        // Google Map created successfully

        // Add event listeners
        googleMapRef.current.addListener('center_changed', handleCenterChanged);
        googleMapRef.current.addListener('zoom_changed', handleZoomChanged);

        // Add click event listener if onClick prop is provided
        if (onClick) {
          googleMapRef.current.addListener('click', onClick);
        }

        // Call onMapReady callback if provided
        if (onMapReady) {
          onMapReady(googleMapRef.current);
        }

        // Load India boundary GeoJSON
        loadIndiaBoundary();
      } catch (error) {
        console.error('Error creating Google Map:', error);
      }
    } else {
      // Map already exists or container not ready
    }

    // Cleanup timeouts on unmount
    return () => {
      if (centerUpdateTimeoutRef.current) {
        clearTimeout(centerUpdateTimeoutRef.current);
      }
      if (zoomUpdateTimeoutRef.current) {
        clearTimeout(zoomUpdateTimeoutRef.current);
      }
    };
  }, [handleCenterChanged, handleZoomChanged, loadIndiaBoundary]); // Include stable dependencies

  // Update map center and zoom when props change (but only if different)
  useEffect(() => {
    if (googleMapRef.current) {
      const currentCenter = googleMapRef.current.getCenter();
      const currentZoom = googleMapRef.current.getZoom();

      // Only update if values are actually different to prevent infinite loops
      if (currentCenter &&
          (Math.abs(currentCenter.lat() - center.lat) > 0.0001 ||
           Math.abs(currentCenter.lng() - center.lng) > 0.0001)) {
        googleMapRef.current.setCenter(center);
      }

      if (currentZoom !== zoom) {
        googleMapRef.current.setZoom(zoom);
      }
    }
  }, [center.lat, center.lng, zoom]);

  // Update towers on map
  useEffect(() => {
    if (!googleMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers for visible towers
    const towersLayer = layers.find(layer => layer.id === 'towers');
    if (towersLayer?.visible) {
      towers.forEach(tower => {
        const marker = createCompatibleMarker({
          position: { lat: tower.position[0], lng: tower.position[1] },
          map: googleMapRef.current!,
          title: tower.name,
          icon: {
            url: getTowerIcon(tower.type, tower.status),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 32),
          },
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: createInfoWindowContent(tower),
        });

        marker.addListener('click', () => {
          infoWindow.open(googleMapRef.current, marker);
          dispatch(setSelectedTower(tower));
        });

        // Add coverage circle
        if (layers.find(layer => layer.id === 'coverage')?.visible) {
          const circle = new google.maps.Circle({
            strokeColor: getStatusColor(tower.status),
            strokeOpacity: 0.6,
            strokeWeight: 2,
            fillColor: getStatusColor(tower.status),
            fillOpacity: 0.1,
            map: googleMapRef.current,
            center: { lat: tower.position[0], lng: tower.position[1] },
            radius: tower.coverage_radius * 1000, // Convert km to meters
          });
        }

        markersRef.current.push(marker);
      });
    }
  }, [towers, layers, dispatch]);

  // Toggle boundary visibility
  useEffect(() => {
    const boundariesLayer = layers.find(layer => layer.id === 'boundaries');
    if (boundaryRef.current) {
      boundaryRef.current.setMap(boundariesLayer?.visible ? googleMapRef.current : null);
    }
  }, [layers]);

  const getTowerIcon = (type: string, status: string): string => {
    // You can customize these icon URLs based on your assets
    const baseUrl = '/icons/';
    const statusColor = status === 'active' ? 'green' :
                       status === 'maintenance' ? 'yellow' :
                       status === 'critical' ? 'red' : 'gray';

    return `${baseUrl}tower-${type}-${statusColor}.png`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#6B7280';
      case 'maintenance': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const createInfoWindowContent = useCallback((tower: any): string => {
    return `
      <div style="padding: 10px; min-width: 200px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">${tower.name}</h3>
        <div style="font-size: 14px; line-height: 1.4;">
          <p><strong>Type:</strong> ${tower.type.toUpperCase()}</p>
          <p><strong>Status:</strong> <span style="color: ${getStatusColor(tower.status)}">${tower.status.charAt(0).toUpperCase() + tower.status.slice(1)}</span></p>
          <p><strong>Signal Strength:</strong> ${tower.signal_strength}%</p>
          <p><strong>Coverage Radius:</strong> ${tower.coverage_radius}km</p>
          <p><strong>Installed:</strong> ${new Date(tower.installed_date).toLocaleDateString()}</p>
          <p><strong>Last Maintenance:</strong> ${new Date(tower.last_maintenance).toLocaleDateString()}</p>
          <div style="margin-top: 8px;">
            <strong>Equipment:</strong><br>
            ${tower.equipment.map((item: string) => `<span style="display: inline-block; background: #e3f2fd; padding: 2px 6px; margin: 2px; border-radius: 3px; font-size: 12px;">${item}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
};

interface GoogleMapContainerProps {
  center?: [number, number];
  zoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
  onClick?: (event: google.maps.MapMouseEvent) => void;
}

const GoogleMapContainer: React.FC<GoogleMapContainerProps> = ({ center: propCenter, zoom: propZoom, onMapReady, onClick }) => {
  const { center: reduxCenter, zoom: reduxZoom } = useSelector((state: RootState) => state.map);

  // Use props if provided, otherwise fallback to Redux state
  const center = propCenter || reduxCenter;
  const zoom = propZoom || reduxZoom;

  const render = (status: any) => {
    // Google Maps status check

    if (status === 'LOADING') {
      return (
        <div className="flex items-center justify-center h-full bg-blue-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-primary-600">Loading Google Maps...</p>
          </div>
        </div>
      );
    }

    if (status === 'FAILURE') {
      return (
        <div className="flex items-center justify-center h-full bg-red-50">
          <div className="text-center p-6">
            <p className="text-red-600 text-lg font-semibold mb-2">Failed to load Google Maps</p>
            <p className="text-red-500 text-sm mb-4">Please check your API key configuration</p>
            <div className="text-xs text-gray-600 bg-gray-100 p-3 rounded">
              <p>Common issues:</p>
              <ul className="list-disc list-inside mt-2 text-left">
                <li>Invalid API key</li>
                <li>Maps JavaScript API not enabled</li>
                <li>Billing not enabled in Google Cloud</li>
                <li>Domain restrictions blocking localhost</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    // Rendering Google Map
    return (
      <GoogleMap
        center={{ lat: center[0], lng: center[1] }}
        zoom={zoom}
        onMapReady={onMapReady}
        onClick={onClick}
      />
    );
  };

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full bg-yellow-50">
        <div className="text-center p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Google Maps API Key Required</h3>
          <p className="text-yellow-700 text-sm mb-4">
            Please add your Google Maps API key to the .env file:
          </p>
          <code className="bg-yellow-100 px-3 py-1 rounded text-xs">
            REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
          </code>
        </div>
      </div>
    );
  }

  return (
    <Wrapper
      apiKey={apiKey}
      render={render}
      libraries={['geometry', 'places']}
    />
  );
};

export default GoogleMapContainer;