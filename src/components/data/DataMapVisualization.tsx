import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SavedDataItem, DistanceMeasurement, ElevationAnalysis, PolygonMeasurement, InfrastructureData } from '../../contexts/DataStoreContext';

interface DataMapVisualizationProps {
  data: SavedDataItem[];
  onDataClick?: (item: SavedDataItem) => void;
  onClose: () => void;
}

interface MarkerData {
  id: string;
  position: google.maps.LatLngLiteral;
  type: SavedDataItem['type'];
  item: SavedDataItem;
  color: string;
}

const DataMapVisualization: React.FC<DataMapVisualizationProps> = ({
  data,
  onDataClick,
  onClose
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const overlaysRef = useRef<(google.maps.Polyline | google.maps.Polygon | google.maps.InfoWindow)[]>([]);
  const [selectedItem, setSelectedItem] = useState<SavedDataItem | null>(null);
  const [showToolbox, setShowToolbox] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<SavedDataItem['type']>>(new Set());

  const typeColors = {
    distance: '#3B82F6', // Blue
    elevation: '#10B981', // Green
    polygon: '#8B5CF6', // Purple
    infrastructure: '#F59E0B', // Amber
    kml: '#EF4444' // Red
  };

  const typeEmojis = {
    distance: '📏',
    elevation: '⛰️',
    polygon: '🔺',
    infrastructure: '🏗️',
    kml: '🗺️'
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const map = new google.maps.Map(mapRef.current, {
      zoom: 6,
      center: { lat: 20.5937, lng: 78.9629 }, // Center of India
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      zoomControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    mapInstanceRef.current = map;

    return () => {
      clearMapOverlays();
    };
  }, []);

  // Clear all map overlays
  const clearMapOverlays = useCallback(() => {
    markersRef.current.forEach(marker => marker.setMap(null));
    overlaysRef.current.forEach(overlay => {
      if ('setMap' in overlay) {
        overlay.setMap(null);
      }
    });
    markersRef.current = [];
    overlaysRef.current = [];
  }, []);

  // Extract position data from saved items
  const extractPositionData = useCallback((item: SavedDataItem): MarkerData[] => {
    const markers: MarkerData[] = [];

    try {
      switch (item.type) {
        case 'distance': {
          const distData = item as DistanceMeasurement;
          if (distData.data?.points && Array.isArray(distData.data.points) && distData.data.points.length > 0) {
            distData.data.points.forEach((point, index) => {
              if (point && typeof point.lat === 'number' && typeof point.lng === 'number') {
                markers.push({
                  id: `${item.id}-${index}`,
                  position: { lat: point.lat, lng: point.lng },
                  type: item.type,
                  item,
                  color: typeColors.distance
                });
              }
            });
          }
          break;
        }
        case 'elevation': {
          const elevData = item as ElevationAnalysis;
          if (elevData.data?.points && Array.isArray(elevData.data.points) && elevData.data.points.length > 0) {
            elevData.data.points.forEach((point, index) => {
              if (point && typeof point.lat === 'number' && typeof point.lng === 'number') {
                markers.push({
                  id: `${item.id}-${index}`,
                  position: { lat: point.lat, lng: point.lng },
                  type: item.type,
                  item,
                  color: typeColors.elevation
                });
              }
            });
          }
          break;
        }
        case 'polygon': {
          const polyData = item as PolygonMeasurement;
          if (polyData.data?.points && Array.isArray(polyData.data.points) && polyData.data.points.length > 0) {
            polyData.data.points.forEach((point, index) => {
              if (point && typeof point.lat === 'number' && typeof point.lng === 'number') {
                markers.push({
                  id: `${item.id}-${index}`,
                  position: { lat: point.lat, lng: point.lng },
                  type: item.type,
                  item,
                  color: typeColors.polygon
                });
              }
            });
          }
          // Add center point as well
          if (polyData.data?.center && typeof polyData.data.center.lat === 'number' && typeof polyData.data.center.lng === 'number') {
            markers.push({
              id: `${item.id}-center`,
              position: { lat: polyData.data.center.lat, lng: polyData.data.center.lng },
              type: item.type,
              item,
              color: typeColors.polygon
            });
          }
          break;
        }
        case 'infrastructure':
        case 'kml': {
          const infraData = item as InfrastructureData;
          if (infraData.data?.locations && Array.isArray(infraData.data.locations) && infraData.data.locations.length > 0) {
            infraData.data.locations.forEach((location, index) => {
              if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
                markers.push({
                  id: `${item.id}-${index}`,
                  position: { lat: location.lat, lng: location.lng },
                  type: item.type,
                  item,
                  color: item.type === 'kml' ? typeColors.kml : typeColors.infrastructure
                });
              }
            });
          }
          break;
        }
        default:
          console.warn('Unknown data type:', (item as any).type);
      }
    } catch (error) {
      console.error('Error extracting position data for item:', item.id, error);
    }

    return markers;
  }, []);

  // Render data on map
  useEffect(() => {
    if (!mapInstanceRef.current || !data.length) return;

    clearMapOverlays();

    const allMarkers: MarkerData[] = [];

    // Filter data based on active filters
    const filteredData = activeFilters.size > 0
      ? data.filter(item => activeFilters.has(item.type))
      : data;

    filteredData.forEach(item => {
      const itemMarkers = extractPositionData(item);
      allMarkers.push(...itemMarkers);
    });

    // Create markers
    allMarkers.forEach(markerData => {
      const marker = new google.maps.Marker({
        position: markerData.position,
        map: mapInstanceRef.current,
        title: markerData.item.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: markerData.color,
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      // Add click listener
      marker.addListener('click', () => {
        setSelectedItem(markerData.item);
        setShowToolbox(true);
        onDataClick?.(markerData.item);
      });

      markersRef.current.push(marker);
    });

    // Draw connections for line-based data
    filteredData.forEach(item => {
      try {
        if (item.type === 'distance') {
          const distData = item as DistanceMeasurement;
          if (distData.data?.points && Array.isArray(distData.data.points) && distData.data.points.length > 1) {
            const path = distData.data.points
              .filter(point => point && typeof point.lat === 'number' && typeof point.lng === 'number')
              .map(point => ({ lat: point.lat, lng: point.lng }));

            if (path.length > 1) {
              const polyline = new google.maps.Polyline({
                path,
                geodesic: true,
                strokeColor: typeColors.distance,
                strokeOpacity: 0.6,
                strokeWeight: 3,
                map: mapInstanceRef.current,
              });

              overlaysRef.current.push(polyline);
            }
          }
        } else if (item.type === 'elevation') {
          const elevData = item as ElevationAnalysis;
          if (elevData.data?.points && Array.isArray(elevData.data.points) && elevData.data.points.length > 1) {
            const path = elevData.data.points
              .filter(point => point && typeof point.lat === 'number' && typeof point.lng === 'number')
              .map(point => ({ lat: point.lat, lng: point.lng }));

            if (path.length > 1) {
              const polyline = new google.maps.Polyline({
                path,
                geodesic: true,
                strokeColor: typeColors.elevation,
                strokeOpacity: 0.6,
                strokeWeight: 3,
                map: mapInstanceRef.current,
              });

              overlaysRef.current.push(polyline);
            }
          }
        } else if (item.type === 'polygon') {
          const polyData = item as PolygonMeasurement;
          if (polyData.data?.points && Array.isArray(polyData.data.points) && polyData.data.points.length > 2) {
            const path = polyData.data.points
              .filter(point => point && typeof point.lat === 'number' && typeof point.lng === 'number')
              .map(point => ({ lat: point.lat, lng: point.lng }));

            if (path.length > 2) {
              const polygon = new google.maps.Polygon({
                paths: path,
                strokeColor: typeColors.polygon,
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: typeColors.polygon,
                fillOpacity: 0.2,
                map: mapInstanceRef.current,
              });

              overlaysRef.current.push(polygon);
            }
          }
        }
      } catch (error) {
        console.error('Error rendering overlay for item:', item.id, error);
      }
    });

    // Auto-fit bounds if there are markers
    if (allMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      allMarkers.forEach(marker => bounds.extend(marker.position));
      mapInstanceRef.current.fitBounds(bounds);
    }

  }, [data, activeFilters, extractPositionData, clearMapOverlays, onDataClick]);

  const toggleFilter = useCallback((type: SavedDataItem['type']) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(type)) {
        newFilters.delete(type);
      } else {
        newFilters.add(type);
      }
      return newFilters;
    });
  }, []);

  const handleToolboxAction = useCallback((action: string) => {
    if (!selectedItem) return;

    switch (action) {
      case 'view':
        onDataClick?.(selectedItem);
        break;
      case 'edit':
        // Handle edit action
        console.log('Edit item:', selectedItem);
        break;
      case 'delete':
        // Handle delete action
        console.log('Delete item:', selectedItem);
        break;
      default:
        break;
    }
  }, [selectedItem, onDataClick]);

  const getDataTypeCounts = useCallback(() => {
    const counts: Record<SavedDataItem['type'], number> = {
      distance: 0,
      elevation: 0,
      polygon: 0,
      infrastructure: 0,
      kml: 0
    };

    data.forEach(item => {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });

    return counts;
  }, [data]);

  const typeCounts = getDataTypeCounts();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-[95%] h-[95%] max-w-7xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold">🗺️ Data Map Visualization</h2>
            <div className="text-sm opacity-90">
              Viewing {data.length} data items on map
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors text-white"
          >
            ✕
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Filter by Type:</span>
              {(Object.keys(typeColors) as SavedDataItem['type'][]).map(type => (
                <button
                  key={type}
                  onClick={() => toggleFilter(type)}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    activeFilters.has(type) || activeFilters.size === 0
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span style={{ color: typeColors[type] }}>●</span>
                  <span>{typeEmojis[type]} {type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  <span className="bg-gray-200 text-gray-700 px-1 rounded text-xs">{typeCounts[type]}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setActiveFilters(new Set())}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />

          {/* Toolbox */}
          {showToolbox && selectedItem && (
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-64">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">{typeEmojis[selectedItem.type]}</span>
                  {selectedItem.name}
                </h3>
                <button
                  onClick={() => setShowToolbox(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div><strong>Type:</strong> {selectedItem.type}</div>
                <div><strong>Category:</strong> {selectedItem.category}</div>
                <div><strong>Created:</strong> {selectedItem.createdAt.toLocaleDateString()}</div>
                {selectedItem.description && (
                  <div><strong>Description:</strong> {selectedItem.description}</div>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleToolboxAction('view')}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  👁️ View Details
                </button>
                <button
                  onClick={() => handleToolboxAction('edit')}
                  className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleToolboxAction('delete')}
                  className="flex-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Legend</h4>
            <div className="space-y-1">
              {(Object.keys(typeColors) as SavedDataItem['type'][]).map(type => (
                <div key={type} className="flex items-center space-x-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: typeColors[type] }}
                  />
                  <span>{typeEmojis[type]} {type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  <span className="text-gray-500">({typeCounts[type]})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Click on any marker to view details and access tools
            </div>
            <div>
              Total items: {data.length} | Visible: {activeFilters.size > 0
                ? data.filter(item => activeFilters.has(item.type)).length
                : data.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataMapVisualization;