import { useState, useCallback, useRef, useEffect } from "react";
import { Coordinates } from "../types";

export interface BaseMapConfig {
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  mapTypeId?: google.maps.MapTypeId;
  restrictToIndia?: boolean;
  enableClickHandler?: boolean;
}

export interface MarkerConfig {
  position: google.maps.LatLngLiteral;
  title?: string;
  icon?: string | google.maps.Icon | google.maps.Symbol;
  draggable?: boolean;
  animation?: google.maps.Animation;
  onClick?: () => void;
}

export interface UseBaseMapReturn {
  // Map instance
  map: google.maps.Map | null;
  isMapReady: boolean;

  // Map state
  center: google.maps.LatLngLiteral;
  zoom: number;
  mapType: string;

  // Map actions
  setMapInstance: (map: google.maps.Map) => void;
  panTo: (coordinates: Coordinates) => void;
  setZoom: (zoom: number) => void;
  setMapType: (mapType: string) => void;
  fitBounds: (bounds: google.maps.LatLngBounds) => void;

  // Marker management
  markers: google.maps.Marker[];
  addMarker: (config: MarkerConfig) => google.maps.Marker;
  removeMarker: (marker: google.maps.Marker) => void;
  clearMarkers: () => void;

  // Click handling
  clickedLocations: Coordinates[];
  onMapClick: (coordinates: Coordinates) => void;
  clearClickedLocations: () => void;

  // Utility functions
  geocodeAddress: (address: string) => Promise<google.maps.LatLngLiteral | null>;
  reverseGeocode: (coordinates: Coordinates) => Promise<string | null>;
  calculateDistance: (point1: Coordinates, point2: Coordinates) => number;

  // India-specific functions
  focusOnIndia: () => void;
  isInIndiaBounds: (coordinates: Coordinates) => boolean;
}

const useBaseMap = (config: BaseMapConfig = {}): UseBaseMapReturn => {
  const {
    center = { lat: 20.5937, lng: 78.9629 }, // Center of India
    zoom = 5,
    mapTypeId = google.maps.MapTypeId.HYBRID,
    restrictToIndia = true,
    enableClickHandler = true
  } = config;

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentCenter, setCurrentCenter] = useState(center);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [currentMapType, setCurrentMapType] = useState("hybrid");
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [clickedLocations, setClickedLocations] = useState<Coordinates[]>([]);

  const geocoder = useRef<google.maps.Geocoder | null>(null);

  // India bounds
  const indiaBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(6.4, 68.2), // Southwest corner
    new google.maps.LatLng(37.1, 97.4)  // Northeast corner
  );

  // Initialize geocoder
  useEffect(() => {
    if (window.google && window.google.maps) {
      geocoder.current = new google.maps.Geocoder();
    }
  }, []);

  const setMapInstance = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setIsMapReady(true);

    // Add listeners
    mapInstance.addListener("center_changed", () => {
      const newCenter = mapInstance.getCenter();
      if (newCenter) {
        setCurrentCenter({
          lat: newCenter.lat(),
          lng: newCenter.lng()
        });
      }
    });

    mapInstance.addListener("zoom_changed", () => {
      const newZoom = mapInstance.getZoom();
      if (newZoom !== undefined) {
        setCurrentZoom(newZoom);
      }
    });

    mapInstance.addListener("maptypeid_changed", () => {
      const newMapType = mapInstance.getMapTypeId();
      if (newMapType) {
        setCurrentMapType(newMapType);
      }
    });

    // Add click listener if enabled
    if (enableClickHandler) {
      mapInstance.addListener("click", (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const coordinates: Coordinates = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          onMapClick(coordinates);
        }
      });
    }
  }, [enableClickHandler]);

  const panTo = useCallback((coordinates: Coordinates) => {
    if (map) {
      map.panTo(coordinates);
      setCurrentCenter(coordinates);
    }
  }, [map]);

  const setZoom = useCallback((newZoom: number) => {
    if (map) {
      map.setZoom(newZoom);
      setCurrentZoom(newZoom);
    }
  }, [map]);

  const setMapType = useCallback((newMapType: string) => {
    if (map) {
      let googleMapType: google.maps.MapTypeId;
      switch (newMapType) {
        case "roadmap":
          googleMapType = google.maps.MapTypeId.ROADMAP;
          break;
        case "satellite":
          googleMapType = google.maps.MapTypeId.SATELLITE;
          break;
        case "terrain":
          googleMapType = google.maps.MapTypeId.TERRAIN;
          break;
        case "hybrid":
        default:
          googleMapType = google.maps.MapTypeId.HYBRID;
          break;
      }
      map.setMapTypeId(googleMapType);
      setCurrentMapType(newMapType);
    }
  }, [map]);

  const fitBounds = useCallback((bounds: google.maps.LatLngBounds) => {
    if (map) {
      map.fitBounds(bounds);
    }
  }, [map]);

  const addMarker = useCallback((config: MarkerConfig): google.maps.Marker => {
    if (!map) {
      throw new Error("Map is not ready yet");
    }

    const marker = new google.maps.Marker({
      position: config.position,
      map: map,
      title: config.title,
      icon: config.icon,
      draggable: config.draggable,
      animation: config.animation
    });

    if (config.onClick) {
      marker.addListener("click", config.onClick);
    }

    setMarkers(prev => [...prev, marker]);
    return marker;
  }, [map]);

  const removeMarker = useCallback((markerToRemove: google.maps.Marker) => {
    markerToRemove.setMap(null);
    setMarkers(prev => prev.filter(marker => marker !== markerToRemove));
  }, []);

  const clearMarkers = useCallback(() => {
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);
  }, [markers]);

  const onMapClick = useCallback((coordinates: Coordinates) => {
    setClickedLocations(prev => [...prev, coordinates]);
  }, []);

  const clearClickedLocations = useCallback(() => {
    setClickedLocations([]);
  }, []);

  const geocodeAddress = useCallback(async (address: string): Promise<google.maps.LatLngLiteral | null> => {
    if (!geocoder.current) {
      return null;
    }

    try {
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.current!.geocode({ address }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results) {
            resolve(results);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });

      if (result.length > 0) {
        const location = result[0].geometry.location;
        return {
          lat: location.lat(),
          lng: location.lng()
        };
      }
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  }, []);

  const reverseGeocode = useCallback(async (coordinates: Coordinates): Promise<string | null> => {
    if (!geocoder.current) {
      return null;
    }

    try {
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.current!.geocode({ location: coordinates }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results) {
            resolve(results);
          } else {
            reject(new Error(`Reverse geocoding failed: ${status}`));
          }
        });
      });

      if (result.length > 0) {
        return result[0].formatted_address;
      }
      return null;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return null;
    }
  }, []);

  const calculateDistance = useCallback((point1: Coordinates, point2: Coordinates): number => {
    if (!window.google || !window.google.maps || !window.google.maps.geometry) {
      return 0;
    }

    const latLng1 = new google.maps.LatLng(point1.lat, point1.lng);
    const latLng2 = new google.maps.LatLng(point2.lat, point2.lng);

    return google.maps.geometry.spherical.computeDistanceBetween(latLng1, latLng2);
  }, []);

  const focusOnIndia = useCallback(() => {
    if (map) {
      map.fitBounds(indiaBounds);
      setTimeout(() => {
        const currentZoom = map.getZoom();
        if (currentZoom && currentZoom > 5.5) {
          map.setZoom(5.5);
        }
      }, 300);
    }
  }, [map]);

  const isInIndiaBounds = useCallback((coordinates: Coordinates): boolean => {
    return indiaBounds.contains(new google.maps.LatLng(coordinates.lat, coordinates.lng));
  }, []);

  return {
    map,
    isMapReady,
    center: currentCenter,
    zoom: currentZoom,
    mapType: currentMapType,
    setMapInstance,
    panTo,
    setZoom,
    setMapType,
    fitBounds,
    markers,
    addMarker,
    removeMarker,
    clearMarkers,
    clickedLocations,
    onMapClick,
    clearClickedLocations,
    geocodeAddress,
    reverseGeocode,
    calculateDistance,
    focusOnIndia,
    isInIndiaBounds
  };
};

export default useBaseMap;