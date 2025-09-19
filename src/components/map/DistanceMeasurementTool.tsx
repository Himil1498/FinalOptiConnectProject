import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { validateIndiaGeofence } from '../../utils/indiaGeofencing';

interface Point {
  id: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
}

interface DistanceMeasurementToolProps {
  isActive: boolean;
  onToggle: () => void;
  map?: google.maps.Map | null;
  mapWidth: number;
  mapHeight: number;
}

const DistanceMeasurementTool: React.FC<DistanceMeasurementToolProps> = ({
  isActive,
  onToggle,
  map,
  mapWidth,
  mapHeight,
}) => {
  const [points, setPoints] = useState<Point[]>([]);
  const [unit, setUnit] = useState<'km' | 'miles'>('km');
  const [showStreetView, setShowStreetView] = useState(false);

  // Convert pixel coordinates to lat/lng (India bounds approximation)
  const pixelToLatLng = useCallback(
    (x: number, y: number) => {
      const lat = 37.6 - (y / mapHeight) * (37.6 - 6.4);
      const lng = 68.1 + (x / mapWidth) * (97.25 - 68.1);
      return { lat, lng };
    },
    [mapWidth, mapHeight]
  );

  // Convert lat/lng to pixel coordinates (India bounds approximation)
  const latLngToPixel = useCallback(
    (lat: number, lng: number) => {
      const x = ((lng - 68.1) / (97.25 - 68.1)) * mapWidth;
      const y = ((37.6 - lat) / (37.6 - 6.4)) * mapHeight;
      return { x, y };
    },
    [mapWidth, mapHeight]
  );

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback(
    (point1: Point, point2: Point) => {
      const R = unit === 'km' ? 6371 : 3959; // Earth radius in km or miles
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

  // Calculate cumulative distance
  const cumulativeDistance = useMemo(() => {
    if (points.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += calculateDistance(points[i - 1], points[i]);
    }
    return total;
  }, [points, calculateDistance]);

  // Handle Google Maps click events when tool is active
  useEffect(() => {
    if (!map || !isActive) return;

    const handleGoogleMapClick = (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;

      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      // Validate coordinates are within India
      const validation = validateIndiaGeofence(lat, lng);
      if (!validation.isValid) {
        const notificationEvent = new CustomEvent('showNotification', {
          detail: {
            type: 'error',
            title: 'Location Restricted',
            message: validation.message,
            duration: 5000
          }
        });
        window.dispatchEvent(notificationEvent);
        return;
      }

      // Convert lat/lng to pixel coordinates for display
      const { x, y } = latLngToPixel(lat, lng);

      const newPoint: Point = {
        id: `point-${Date.now()}-${Math.random()}`,
        lat,
        lng,
        x,
        y,
      };

      setPoints((prev) => [...prev, newPoint]);
    };

    const clickListener = map.addListener('click', handleGoogleMapClick);

    return () => {
      if (clickListener) {
        clickListener.remove();
      }
    };
  }, [map, isActive, latLngToPixel]);

  // Handle map click to add points with geofencing validation
  const handleMapClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isActive) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const { lat, lng } = pixelToLatLng(x, y);

      // Validate coordinates are within India
      const validation = validateIndiaGeofence(lat, lng);
      if (!validation.isValid) {
        // Show error notification
        const event = new CustomEvent('showNotification', {
          detail: {
            type: 'error',
            title: 'Location Restricted',
            message: validation.message,
            duration: 5000
          }
        });
        window.dispatchEvent(event);

        if (validation.suggestedAction) {
          setTimeout(() => {
            const suggestionEvent = new CustomEvent('showNotification', {
              detail: {
                type: 'info',
                title: 'Suggestion',
                message: validation.suggestedAction,
                duration: 8000
              }
            });
            window.dispatchEvent(suggestionEvent);
          }, 1000);
        }
        return;
      }

      const newPoint: Point = {
        id: `point-${Date.now()}`,
        lat,
        lng,
        x,
        y,
      };

      setPoints(prev => [...prev, newPoint]);

      // Show success message for locations near border
      if (validation.message) {
        const warningEvent = new CustomEvent('showNotification', {
          detail: {
            type: 'warning',
            title: 'Border Location',
            message: validation.message,
            duration: 4000
          }
        });
        window.dispatchEvent(warningEvent);
      }
    },
    [isActive, pixelToLatLng]
  );

  // Clear all points
  const clearPoints = () => {
    setPoints([]);
  };

  // Remove last point
  const removeLastPoint = () => {
    setPoints(prev => prev.slice(0, -1));
  };

  // Generate street view URL
  const getStreetViewUrl = (point: Point) => {
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${point.lat},${point.lng}`;
  };

  return (
    <>
      {/* Tool Controls - Only show when active */}
      {isActive && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-4 max-w-md border border-gray-200/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Distance Measurement</h3>
            <button
              onClick={onToggle}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isActive ? 'Stop' : 'Start'}
            </button>
          </div>

          {isActive && (
            <div className="text-xs text-blue-600 mb-3">
              Click on the map to add measurement points
            </div>
          )}

          <div className="flex items-center space-x-4 mb-3">
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as 'km' | 'miles')}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="km">Kilometers</option>
              <option value="miles">Miles</option>
            </select>

            <label className="flex items-center space-x-1 text-xs">
              <input
                type="checkbox"
                checked={showStreetView}
                onChange={(e) => setShowStreetView(e.target.checked)}
                className="w-3 h-3"
              />
              <span>Street View</span>
            </label>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={removeLastPoint}
              disabled={points.length === 0}
              className="flex-1 px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Undo
            </button>
            <button
              onClick={clearPoints}
              disabled={points.length === 0}
              className="flex-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>

          {points.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-600 mb-1">
                Points: {points.length}
              </div>
              {points.length > 1 && (
                <div className="text-sm font-bold text-blue-600">
                  Total Distance: {cumulativeDistance.toFixed(2)} {unit}
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      )}

      {/* Measurement Overlay for click handling - Only when map is not available */}
      {isActive && !map && (
        <div
          className="absolute inset-0 cursor-crosshair"
          style={{ zIndex: 1, pointerEvents: 'auto' }}
          onClick={handleMapClick}
        >
          {/* Render points */}
          {points.map((point, index) => (
            <div key={point.id}>
              {/* Point marker */}
              <div
                className="absolute w-3 h-3 bg-red-500 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: point.x,
                  top: point.y,
                }}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-700 bg-white px-1 rounded shadow">
                  {index + 1}
                </div>
              </div>

              {/* Line to next point */}
              {index < points.length - 1 && (
                <svg
                  className="absolute inset-0 pointer-events-none"
                  style={{ width: '100%', height: '100%' }}
                >
                  <line
                    x1={point.x}
                    y1={point.y}
                    x2={points[index + 1].x}
                    y2={points[index + 1].y}
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />

                  {/* Distance label */}
                  <text
                    x={(point.x + points[index + 1].x) / 2}
                    y={(point.y + points[index + 1].y) / 2 - 5}
                    fill="#ef4444"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    <tspan
                      className="bg-white px-1 rounded shadow"
                      style={{ backgroundColor: 'white', padding: '2px' }}
                    >
                      {calculateDistance(point, points[index + 1]).toFixed(2)} {unit}
                    </tspan>
                  </text>
                </svg>
              )}

              {/* Street View link */}
              {showStreetView && (
                <div
                  className="absolute transform translate-x-2 -translate-y-1/2"
                  style={{
                    left: point.x,
                    top: point.y,
                  }}
                >
                  <a
                    href={getStreetViewUrl(point)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-4 h-4 bg-blue-500 text-white text-xs leading-4 text-center rounded hover:bg-blue-600"
                    title="Open Street View"
                  >
                    📷
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Points visualization overlay - No pointer events to allow map interaction */}
      {isActive && map && points.length > 0 && (
        <div
          className="absolute inset-0"
          style={{ zIndex: 1, pointerEvents: 'none' }}
        >
          {/* Render points */}
          {points.map((point, index) => (
            <div key={point.id}>
              {/* Point marker */}
              <div
                className="absolute w-3 h-3 bg-red-500 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: point.x,
                  top: point.y,
                }}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-700 bg-white px-1 rounded shadow">
                  {index + 1}
                </div>
              </div>
              {/* Line to next point */}
              {index < points.length - 1 && (
                <svg
                  className="absolute inset-0 pointer-events-none"
                  style={{ width: '100%', height: '100%' }}
                >
                  <line
                    x1={point.x}
                    y1={point.y}
                    x2={points[index + 1].x}
                    y2={points[index + 1].y}
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                  {/* Distance label */}
                  <text
                    x={(point.x + points[index + 1].x) / 2}
                    y={(point.y + points[index + 1].y) / 2 - 5}
                    fill="#ef4444"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    <tspan
                      className="bg-white px-1 rounded shadow"
                      style={{ backgroundColor: 'white', padding: '2px' }}
                    >
                      {calculateDistance(point, points[index + 1]).toFixed(2)} {unit}
                    </tspan>
                  </text>
                </svg>
              )}
              {/* Street View link */}
              {showStreetView && (
                <div
                  className="absolute transform translate-x-2 -translate-y-1/2"
                  style={{
                    left: point.x,
                    top: point.y,
                    pointerEvents: 'auto',
                  }}
                >
                  <a
                    href={getStreetViewUrl(point)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-4 h-4 bg-blue-500 text-white text-xs leading-4 text-center rounded hover:bg-blue-600"
                    title="Open Street View"
                  >
                    📷
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Panel */}
      {points.length > 0 && (
        <div className="absolute bottom-4 left-4 z-20">
          <div className="bg-white rounded-lg shadow-lg p-3 max-w-xs">
            <h4 className="text-sm font-bold text-gray-900 mb-2">Measurement Details</h4>
            <div className="space-y-1 text-xs text-gray-600">
              {points.map((point, index) => (
                <div key={point.id} className="flex justify-between">
                  <span>Point {index + 1}:</span>
                  <span>{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</span>
                </div>
              ))}
              {points.length > 1 && (
                <>
                  <div className="border-t pt-1 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total Distance:</span>
                      <span className="text-blue-600">
                        {cumulativeDistance.toFixed(2)} {unit}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Segments:</span>
                    <span>{points.length - 1}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DistanceMeasurementTool;