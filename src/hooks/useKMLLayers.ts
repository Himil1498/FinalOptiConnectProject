import { useState, useEffect, useCallback } from 'react';
import { KMLParser, KMLPlacemark, KMLData } from '../utils/kmlParser';

export interface KMLLayerConfig {
  url: string;
  name: string;
  type: 'pop' | 'subPop';
  visible: boolean;
}

interface LayerData {
  markers: google.maps.Marker[];
  data: KMLPlacemark[];
  infoWindow: google.maps.InfoWindow | null;
}

interface UseKMLLayersResult {
  layerVisibility: Map<string, boolean>;
  layerData: Map<string, KMLPlacemark[]>;
  toggleLayer: (layerName: string) => void;
  showLayer: (layerName: string) => void;
  hideLayer: (layerName: string) => void;
  isLayerVisible: (layerName: string) => boolean;
  getAllData: () => KMLPlacemark[];
  getDataByType: (type: 'pop' | 'subPop') => KMLPlacemark[];
  loading: boolean;
  error: string | null;
}

export const useKMLLayers = (
  map: google.maps.Map | null,
  layerConfigs?: KMLLayerConfig[]
): UseKMLLayersResult => {
  const [layers] = useState(() => new Map<string, LayerData>());
  const [layerVisibility, setLayerVisibility] = useState(() => new Map<string, boolean>());
  const [layerData, setLayerData] = useState(() => new Map<string, KMLPlacemark[]>());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load and parse KML files
  useEffect(() => {
    if (!map) return;

    // Default layer configurations
    const defaultLayerConfigs: KMLLayerConfig[] = [
      {
        url: `${window.location.origin}/pop_location.kml`,
        name: 'pop',
        type: 'pop',
        visible: false
      },
      {
        url: `${window.location.origin}/sub_pop_location.kml`,
        name: 'subPop',
        type: 'subPop',
        visible: false
      }
    ];

    const configsToUse = layerConfigs || defaultLayerConfigs;

    const loadKMLData = async () => {
      setLoading(true);
      setError(null);

      try {
        for (const config of configsToUse) {
          if (!layers.has(config.name)) {
            // Parse KML data
            const kmlData: KMLData = await KMLParser.parseKMLFile(config.url, config.type);
            const markers: google.maps.Marker[] = [];
            const infoWindow = new google.maps.InfoWindow();

            // Create markers for each placemark
            kmlData.placemarks.forEach(placemark => {
              const marker = new google.maps.Marker({
                position: placemark.coordinates,
                map: config.visible ? map : null,
                title: placemark.name,
                icon: KMLParser.createMarkerIcon(config.type)
              });

              // Add click listener for info window
              marker.addListener('click', () => {
                infoWindow.setContent(KMLParser.createInfoWindowContent(placemark));
                infoWindow.open(map, marker);
              });

              markers.push(marker);
            });

            // Store layer data
            layers.set(config.name, {
              markers,
              data: kmlData.placemarks,
              infoWindow
            });

            // Update state
            setLayerVisibility(prev => new Map(prev).set(config.name, config.visible));
            setLayerData(prev => new Map(prev).set(config.name, kmlData.placemarks));
          }
        }
      } catch (err) {
        console.error('Error loading KML data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load KML data');
      } finally {
        setLoading(false);
      }
    };

    loadKMLData();

    // Cleanup function
    return () => {
      layers.forEach(layer => {
        layer.markers.forEach(marker => marker.setMap(null));
        layer.infoWindow?.close();
      });
      layers.clear();
    };
  }, [map, layerConfigs, layers]);

  const toggleLayer = useCallback((layerName: string) => {
    const layer = layers.get(layerName);
    if (!layer || !map) return;

    const currentVisibility = layerVisibility.get(layerName) || false;
    const newVisibility = !currentVisibility;

    layer.markers.forEach(marker => {
      marker.setMap(newVisibility ? map : null);
    });

    setLayerVisibility(prev => new Map(prev).set(layerName, newVisibility));
  }, [layers, layerVisibility, map]);

  const showLayer = useCallback((layerName: string) => {
    const layer = layers.get(layerName);
    if (!layer || !map) return;

    layer.markers.forEach(marker => {
      marker.setMap(map);
    });

    setLayerVisibility(prev => new Map(prev).set(layerName, true));
  }, [layers, map]);

  const hideLayer = useCallback((layerName: string) => {
    const layer = layers.get(layerName);
    if (!layer) return;

    layer.markers.forEach(marker => {
      marker.setMap(null);
    });

    setLayerVisibility(prev => new Map(prev).set(layerName, false));
  }, [layers]);

  const isLayerVisible = useCallback((layerName: string): boolean => {
    return layerVisibility.get(layerName) || false;
  }, [layerVisibility]);

  const getAllData = useCallback((): KMLPlacemark[] => {
    const allData: KMLPlacemark[] = [];
    layerData.forEach(data => {
      allData.push(...data);
    });
    return allData;
  }, [layerData]);

  const getDataByType = useCallback((type: 'pop' | 'subPop'): KMLPlacemark[] => {
    return getAllData().filter(item => item.type === type);
  }, [getAllData]);

  return {
    layerVisibility,
    layerData,
    toggleLayer,
    showLayer,
    hideLayer,
    isLayerVisible,
    getAllData,
    getDataByType,
    loading,
    error
  };
};