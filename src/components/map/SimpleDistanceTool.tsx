import React, { useState, useCallback, useEffect, useMemo } from "react";

interface Point {
  id: string;
  lat: number;
  lng: number;
  marker?: google.maps.Marker | null;
}

interface SimpleDistanceToolProps {
  isActive: boolean;
  onToggle: () => void;
  map?: google.maps.Map | null;
  mapWidth: number;
  mapHeight: number;
  onDataChange?: (hasData: boolean) => void;
  isPrimaryTool?: boolean;
  multiToolMode?: boolean;
}

const SimpleDistanceTool: React.FC<SimpleDistanceToolProps> = ({
  isActive,
  onToggle,
  map,
  onDataChange
}) => {
  const [points, setPoints] = useState<Point[]>([]);
  const [unit, setUnit] = useState<"km" | "miles">("km");
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([]);

  // Notify parent when data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(points.length > 0);
    }
  }, [points.length, onDataChange]);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback(
    (point1: Point, point2: Point) => {
      const R = unit === "km" ? 6371 : 3959;
      const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
      const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((point1.lat * Math.PI) / 180) *
          Math.cos((point2.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    [unit]
  );

  // Calculate total distance
  const totalDistance = useMemo(() => {
    if (points.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += calculateDistance(points[i - 1], points[i]);
    }
    return total;
  }, [points, calculateDistance]);

  // Clear all markers and polylines from map
  const clearMapElements = useCallback(() => {
    markers.forEach(marker => marker.setMap(null));
    polylines.forEach(polyline => polyline.setMap(null));
    setMarkers([]);
    setPolylines([]);
  }, [markers, polylines]);

  // Create marker
  const createMarker = useCallback((point: Point, index: number) => {
    if (!map) return null;

    const marker = new google.maps.Marker({
      position: { lat: point.lat, lng: point.lng },
      map: map,
      title: `Point ${index + 1}`,
      label: {
        text: `${index + 1}`,
        color: 'white',
        fontWeight: 'bold'
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#ef4444',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      }
    });

    return marker;
  }, [map]);

  // Create polyline
  const createPolyline = useCallback((point1: Point, point2: Point) => {
    if (!map) return null;

    const polyline = new google.maps.Polyline({
      path: [
        { lat: point1.lat, lng: point1.lng },
        { lat: point2.lat, lng: point2.lng }
      ],
      geodesic: true,
      strokeColor: '#ef4444',
      strokeOpacity: 1.0,
      strokeWeight: 3,
      map: map
    });

    return polyline;
  }, [map]);

  // Update map visualization
  const updateMapVisualization = useCallback(() => {
    if (!map || !isActive) return;

    // Clear existing elements
    clearMapElements();

    // Create new markers
    const newMarkers: google.maps.Marker[] = [];
    points.forEach((point, index) => {
      const marker = createMarker(point, index);
      if (marker) {
        newMarkers.push(marker);
      }
    });
    setMarkers(newMarkers);

    // Create new polylines
    const newPolylines: google.maps.Polyline[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const polyline = createPolyline(points[i], points[i + 1]);
      if (polyline) {
        newPolylines.push(polyline);
      }
    }
    setPolylines(newPolylines);
  }, [map, isActive, points, createMarker, createPolyline, clearMapElements]);

  // Handle Google Maps clicks - SIMPLE approach like other tools
  useEffect(() => {
    if (!map || !isActive) return;

    console.log('🚀 Simple Distance Tool - Adding click listener');

    const handleGoogleMapClick = (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;

      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      console.log('🎯 Simple Distance Tool - Map clicked', { lat, lng });

      const newPoint: Point = {
        id: `point-${Date.now()}-${Math.random()}`,
        lat,
        lng
      };

      setPoints(prev => {
        const updated = [...prev, newPoint];
        console.log('📍 Simple Distance Tool - Points updated', updated);
        return updated;
      });

      // Show success notification
      const event2 = new CustomEvent('showNotification', {
        detail: {
          type: 'success',
          title: 'Point Added',
          message: `Point ${points.length + 1} added successfully`,
          duration: 2000
        }
      });
      window.dispatchEvent(event2);
    };

    const clickListener = map.addListener("click", handleGoogleMapClick);

    return () => {
      console.log('🧹 Simple Distance Tool - Removing click listener');
      if (clickListener) clickListener.remove();
    };
  }, [map, isActive, points.length]);

  // Update visualization when points change
  useEffect(() => {
    updateMapVisualization();
  }, [updateMapVisualization]);

  // Clean up when tool deactivates
  useEffect(() => {
    if (!isActive) {
      clearMapElements();
    }
    return () => {
      clearMapElements();
    };
  }, [isActive, clearMapElements]);

  // Clear all points
  const clearPoints = () => {
    setPoints([]);
    clearMapElements();
  };

  // Remove last point
  const removeLastPoint = () => {
    setPoints(prev => prev.slice(0, -1));
  };

  if (!isActive) return null;

  return (
    <div
      className="fixed bg-white rounded-xl shadow-xl border border-gray-200 z-50"
      style={{
        left: '300px',
        top: '80px',
        width: '320px'
      }}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">
            Simple Distance Tool
          </h3>
          <button
            onClick={onToggle}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            Stop
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="text-xs text-blue-600 mb-3">
          ✨ Click anywhere on the map to add measurement points
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as "km" | "miles")}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="km">📏 Kilometers</option>
            <option value="miles">📐 Miles</option>
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex space-x-2">
            <button
              onClick={removeLastPoint}
              disabled={points.length === 0}
              className="flex-1 px-3 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ↩️ Undo
            </button>
            <button
              onClick={clearPoints}
              disabled={points.length === 0}
              className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {points.length > 0 && (
          <div className="bg-gray-50 rounded p-3">
            <div className="text-xs text-gray-600 mb-1">
              Points: {points.length}
            </div>
            {points.length > 1 && (
              <div className="text-sm font-bold text-blue-600">
                Total Distance: {totalDistance.toFixed(2)} {unit}
              </div>
            )}

            {points.length > 0 && (
              <div className="mt-2 space-y-1">
                {points.map((point, index) => {
                  const segmentDistance = index > 0
                    ? calculateDistance(points[index - 1], point)
                    : 0;
                  const cumulativeDistance = points
                    .slice(0, index + 1)
                    .reduce((total, _, i) => {
                      if (i === 0) return 0;
                      return total + calculateDistance(points[i - 1], points[i]);
                    }, 0);

                  return (
                    <div key={point.id} className="flex justify-between text-xs">
                      <span>Point {index + 1}</span>
                      <span className="font-medium">
                        {cumulativeDistance.toFixed(2)} {unit}
                        {index > 0 && (
                          <span className="text-gray-500 ml-1">
                            (+{segmentDistance.toFixed(2)})
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleDistanceTool;