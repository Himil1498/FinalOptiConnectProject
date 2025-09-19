import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { convertStringToMapTypeId } from '../utils/mapRestrictions';

interface GoogleMapsConfig {
  center: { lat: number; lng: number };
  zoom: number;
  mapTypeId?: google.maps.MapTypeId | string;
  restriction?: {
    latLngBounds: google.maps.LatLngBounds;
    strictBounds: boolean;
  };
}

interface IndiaGeometry {
  type: string;
  coordinates: number[][][] | number[][][][];
}

interface IndiaFeature {
  type: string;
  properties: { st_nm: string };
  geometry: IndiaGeometry;
}

interface IndiaGeoJSON {
  type: string;
  features: IndiaFeature[];
}

export const useGoogleMaps = (config: GoogleMapsConfig) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ lat: number; lng: number } | null>(null);
  const [indiaBounds, setIndiaBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [indiaPolygons, setIndiaPolygons] = useState<google.maps.Polygon[]>([]);


  // Load India boundary data
  const loadIndiaBoundary = useCallback(async (): Promise<IndiaGeoJSON | null> => {
    try {
      const response = await fetch('/india.json');
      if (!response.ok) {
        throw new Error('Failed to load India boundary data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading India boundary:', error);
      return null;
    }
  }, []);

  // Calculate bounds from GeoJSON coordinates
  const calculateBounds = useCallback((features: IndiaFeature[]): google.maps.LatLngBounds => {
    const bounds = new google.maps.LatLngBounds();

    features.forEach(feature => {
      if (feature.geometry.type === 'MultiPolygon') {
        // MultiPolygon: coordinates is number[][][][]
        (feature.geometry.coordinates as number[][][][]).forEach(polygon => {
          polygon.forEach(ring => {
            ring.forEach(([lng, lat]) => {
              bounds.extend(new google.maps.LatLng(lat, lng));
            });
          });
        });
      } else if (feature.geometry.type === 'Polygon') {
        // Polygon: coordinates is number[][][]
        (feature.geometry.coordinates as number[][][]).forEach(ring => {
          ring.forEach(([lng, lat]) => {
            bounds.extend(new google.maps.LatLng(lat, lng));
          });
        });
      }
    });

    return bounds;
  }, []);

  // Create polygons from GeoJSON data
  const createIndiaPolygons = useCallback((
    geoData: IndiaGeoJSON,
    mapInstance: google.maps.Map
  ): google.maps.Polygon[] => {
    const polygons: google.maps.Polygon[] = [];

    geoData.features.forEach(feature => {
      if (feature.geometry.type === 'MultiPolygon') {
        // MultiPolygon: coordinates is number[][][][]
        (feature.geometry.coordinates as number[][][][]).forEach(polygon => {
          const paths = polygon.map(ring =>
            ring.map(([lng, lat]) => ({ lat, lng }))
          );

          const polygonInstance = new google.maps.Polygon({
            paths,
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: 'transparent',
            fillOpacity: 0,
            clickable: false,
            zIndex: 1
          });

          polygonInstance.setMap(mapInstance);
          polygons.push(polygonInstance);
        });
      } else if (feature.geometry.type === 'Polygon') {
        // Polygon: coordinates is number[][][]
        const paths = (feature.geometry.coordinates as number[][][]).map(ring =>
          ring.map(([lng, lat]) => ({ lat, lng }))
        );

        const polygonInstance = new google.maps.Polygon({
          paths,
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: 'transparent',
          fillOpacity: 0,
          clickable: false,
          zIndex: 1
        });

        polygonInstance.setMap(mapInstance);
        polygons.push(polygonInstance);
      }
    });

    return polygons;
  }, []);

  // Check if point is inside India boundary
  const isPointInIndia = useCallback((lat: number, lng: number): boolean => {
    if (!map || indiaPolygons.length === 0) return true; // Allow if boundary not loaded

    const point = new google.maps.LatLng(lat, lng);

    return indiaPolygons.some(polygon => {
      return google.maps.geometry.poly.containsLocation(point, polygon);
    });
  }, [map, indiaPolygons]);

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        const loader = new Loader({
          apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
          libraries: ['geometry', 'places']
        });

        await loader.load();

        // Load India boundary data
        const indiaData = await loadIndiaBoundary();
        let mapBounds: google.maps.LatLngBounds | undefined;

        if (indiaData) {
          mapBounds = calculateBounds(indiaData.features);
          setIndiaBounds(mapBounds);
        }

        // Create map instance
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: config.center,
          zoom: config.zoom,
          mapTypeId: config.mapTypeId
            ? (typeof config.mapTypeId === 'string' ? convertStringToMapTypeId(config.mapTypeId) : config.mapTypeId)
            : google.maps.MapTypeId.ROADMAP,
          restriction: mapBounds ? {
            latLngBounds: mapBounds,
            strictBounds: true
          } : config.restriction,
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
          gestureHandling: 'cooperative',
          styles: [
            {
              featureType: 'poi',
              stylers: [{ visibility: 'simplified' }]
            },
            {
              featureType: 'road',
              elementType: 'labels',
              stylers: [{ visibility: 'simplified' }]
            }
          ]
        });

        // Add India boundary polygons
        if (indiaData) {
          const polygons = createIndiaPolygons(indiaData, mapInstance);
          setIndiaPolygons(polygons);
        }

        // Add mouse move listener for coordinate tracking
        const mouseMoveListener = mapInstance.addListener('mousemove', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            setMousePosition({
              lat: event.latLng.lat(),
              lng: event.latLng.lng()
            });
          }
        });

        // Add mouse leave listener
        const mouseLeaveListener = mapInstance.addListener('mouseleave', () => {
          setMousePosition(null);
        });

        // Add bounds changed listener to enforce India restriction
        const boundsChangedListener = mapInstance.addListener('bounds_changed', () => {
          if (mapBounds && mapInstance.getBounds()) {
            const currentBounds = mapInstance.getBounds()!;

            // Check if current view is completely outside India
            if (!mapBounds.intersects(currentBounds)) {
              // Reset to India center
              mapInstance.panTo({ lat: 20.5937, lng: 78.9629 });
              mapInstance.setZoom(5);
            }
          }
        });

        setMap(mapInstance);
        setIsLoaded(true);

        // Cleanup function
        return () => {
          google.maps.event.removeListener(mouseMoveListener);
          google.maps.event.removeListener(mouseLeaveListener);
          google.maps.event.removeListener(boundsChangedListener);
        };

      } catch (error) {
        console.error('Error initializing Google Maps:', error);
        setError(error instanceof Error ? error.message : 'Failed to load Google Maps');
      }
    };

    initializeMap();
  }, [config, loadIndiaBoundary, calculateBounds, createIndiaPolygons]);

  // Add click restriction
  useEffect(() => {
    if (!map) return;

    const clickListener = map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        if (!isPointInIndia(lat, lng)) {
          // Show notification that click is outside India
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('showNotification', {
              detail: {
                type: 'warning',
                title: 'Location Restricted',
                message: 'You can only interact with locations within India.',
                duration: 3000
              }
            }));
          }
          return false;
        }
      }
    });

    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [map, isPointInIndia]);

  // Map control functions
  const panTo = useCallback((lat: number, lng: number) => {
    if (map && isPointInIndia(lat, lng)) {
      map.panTo({ lat, lng });
    }
  }, [map, isPointInIndia]);

  const setZoom = useCallback((zoom: number) => {
    if (map) {
      map.setZoom(zoom);
    }
  }, [map]);

  const setMapType = useCallback((mapTypeId: string | google.maps.MapTypeId) => {
    if (map) {
      map.setMapTypeId(typeof mapTypeId === 'string' ? convertStringToMapTypeId(mapTypeId) : mapTypeId);
    }
  }, [map]);

  const fitToBounds = useCallback((bounds: google.maps.LatLngBounds) => {
    if (map) {
      map.fitBounds(bounds);
    }
  }, [map]);

  const addMarker = useCallback((position: { lat: number; lng: number }, options?: google.maps.MarkerOptions) => {
    if (map && isPointInIndia(position.lat, position.lng)) {
      return new google.maps.Marker({
        position,
        map,
        ...options
      });
    }
    return null;
  }, [map, isPointInIndia]);

  const addPolygon = useCallback((paths: google.maps.LatLng[] | google.maps.LatLng[][], options?: google.maps.PolygonOptions) => {
    if (map) {
      // Validate that all points are within India
      let allPointsInIndia = false;

      if (Array.isArray(paths) && paths.length > 0) {
        if (Array.isArray(paths[0])) {
          // paths is google.maps.LatLng[][]
          allPointsInIndia = (paths as google.maps.LatLng[][]).every(path =>
            path.every(point => isPointInIndia(point.lat(), point.lng()))
          );
        } else {
          // paths is google.maps.LatLng[]
          allPointsInIndia = (paths as google.maps.LatLng[]).every(point =>
            isPointInIndia(point.lat(), point.lng())
          );
        }
      }

      if (allPointsInIndia) {
        return new google.maps.Polygon({
          paths,
          map,
          ...options
        });
      }
    }
    return null;
  }, [map, isPointInIndia]);

  const getCurrentBounds = useCallback(() => {
    return map?.getBounds() || null;
  }, [map]);

  return {
    mapRef,
    map,
    isLoaded,
    error,
    mousePosition,
    indiaBounds,
    isPointInIndia,
    // Control functions
    panTo,
    setZoom,
    setMapType,
    fitToBounds,
    addMarker,
    addPolygon,
    getCurrentBounds
  };
};