import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Coordinates } from "../../types";

interface BaseMapContextType {
  map: google.maps.Map | null;
  mapCenter: google.maps.LatLngLiteral;
  mapZoom: number;
  mapType: string;
  isMapReady: boolean;
  markers: google.maps.Marker[];
  overlays: google.maps.MVCObject[];

  // Map actions
  setMapInstance: (map: google.maps.Map) => void;
  updateMapCenter: (center: google.maps.LatLngLiteral) => void;
  updateMapZoom: (zoom: number) => void;
  updateMapType: (mapType: string) => void;

  // Marker management
  addMarker: (marker: google.maps.Marker) => void;
  removeMarker: (marker: google.maps.Marker) => void;
  clearMarkers: () => void;

  // Overlay management
  addOverlay: (overlay: google.maps.MVCObject) => void;
  removeOverlay: (overlay: google.maps.MVCObject) => void;
  clearOverlays: () => void;

  // Utility functions
  panToLocation: (coordinates: Coordinates, zoom?: number) => void;
  fitBounds: (bounds: google.maps.LatLngBounds) => void;

  // Event handlers
  onMapClick?: (coordinates: Coordinates) => void;
  setMapClickHandler: (handler: (coordinates: Coordinates) => void) => void;
}

const BaseMapContext = createContext<BaseMapContextType | undefined>(undefined);

interface BaseMapProviderProps {
  children: ReactNode;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  initialMapType?: string;
}

export const BaseMapProvider: React.FC<BaseMapProviderProps> = ({
  children,
  initialCenter = { lat: 20.5937, lng: 78.9629 }, // Center of India
  initialZoom = 5,
  initialMapType = "hybrid"
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(initialCenter);
  const [mapZoom, setMapZoom] = useState<number>(initialZoom);
  const [mapType, setMapType] = useState<string>(initialMapType);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [overlays, setOverlays] = useState<google.maps.MVCObject[]>([]);
  const [mapClickHandler, setMapClickHandler] = useState<((coordinates: Coordinates) => void) | undefined>(undefined);

  const setMapInstance = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setIsMapReady(true);

    // Add listeners for map changes
    mapInstance.addListener("center_changed", () => {
      const center = mapInstance.getCenter();
      if (center) {
        setMapCenter({
          lat: center.lat(),
          lng: center.lng()
        });
      }
    });

    mapInstance.addListener("zoom_changed", () => {
      const zoom = mapInstance.getZoom();
      if (zoom !== undefined) {
        setMapZoom(zoom);
      }
    });

    mapInstance.addListener("maptypeid_changed", () => {
      const newMapType = mapInstance.getMapTypeId();
      if (newMapType) {
        setMapType(newMapType);
      }
    });
  }, []);

  const updateMapCenter = useCallback((center: google.maps.LatLngLiteral) => {
    setMapCenter(center);
    if (map) {
      map.setCenter(center);
    }
  }, [map]);

  const updateMapZoom = useCallback((zoom: number) => {
    setMapZoom(zoom);
    if (map) {
      map.setZoom(zoom);
    }
  }, [map]);

  const updateMapType = useCallback((newMapType: string) => {
    setMapType(newMapType);
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
    }
  }, [map]);

  const addMarker = useCallback((marker: google.maps.Marker) => {
    setMarkers(prev => [...prev, marker]);
  }, []);

  const removeMarker = useCallback((markerToRemove: google.maps.Marker) => {
    markerToRemove.setMap(null);
    setMarkers(prev => prev.filter(marker => marker !== markerToRemove));
  }, []);

  const clearMarkers = useCallback(() => {
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);
  }, [markers]);

  const addOverlay = useCallback((overlay: google.maps.MVCObject) => {
    setOverlays(prev => [...prev, overlay]);
  }, []);

  const removeOverlay = useCallback((overlayToRemove: google.maps.MVCObject) => {
    if ('setMap' in overlayToRemove && typeof overlayToRemove.setMap === 'function') {
      (overlayToRemove as any).setMap(null);
    }
    setOverlays(prev => prev.filter(overlay => overlay !== overlayToRemove));
  }, []);

  const clearOverlays = useCallback(() => {
    overlays.forEach(overlay => {
      if ('setMap' in overlay && typeof overlay.setMap === 'function') {
        (overlay as any).setMap(null);
      }
    });
    setOverlays([]);
  }, [overlays]);

  const panToLocation = useCallback((coordinates: Coordinates, zoom?: number) => {
    if (map) {
      map.panTo(coordinates);
      if (zoom !== undefined) {
        map.setZoom(zoom);
      }
    }
  }, [map]);

  const fitBounds = useCallback((bounds: google.maps.LatLngBounds) => {
    if (map) {
      map.fitBounds(bounds);
    }
  }, [map]);

  const setMapClickHandlerInternal = useCallback((handler: (coordinates: Coordinates) => void) => {
    setMapClickHandler(() => handler);
  }, []);

  const contextValue: BaseMapContextType = {
    map,
    mapCenter,
    mapZoom,
    mapType,
    isMapReady,
    markers,
    overlays,
    setMapInstance,
    updateMapCenter,
    updateMapZoom,
    updateMapType,
    addMarker,
    removeMarker,
    clearMarkers,
    addOverlay,
    removeOverlay,
    clearOverlays,
    panToLocation,
    fitBounds,
    onMapClick: mapClickHandler,
    setMapClickHandler: setMapClickHandlerInternal
  };

  return (
    <BaseMapContext.Provider value={contextValue}>
      {children}
    </BaseMapContext.Provider>
  );
};

export const useBaseMap = (): BaseMapContextType => {
  const context = useContext(BaseMapContext);
  if (context === undefined) {
    throw new Error("useBaseMap must be used within a BaseMapProvider");
  }
  return context;
};

export default BaseMapProvider;