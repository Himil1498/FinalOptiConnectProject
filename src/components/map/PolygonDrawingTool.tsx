import React, { useState, useCallback, useMemo, useRef } from 'react';
import { validateIndiaGeofence, validateMultipleCoordinates } from '../../utils/indiaGeofencing';

interface Vertex {
  id: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
}

interface Polygon {
  id: string;
  name: string;
  vertices: Vertex[];
  color: string;
  isComplete: boolean;
  area: number;
  perimeter: number;
  createdAt: Date;
}

interface PolygonDrawingToolProps {
  isActive: boolean;
  onToggle: () => void;
  map?: google.maps.Map | null;
  mapWidth: number;
  mapHeight: number;
}

const POLYGON_COLORS = [
  { name: 'Red', value: '#ef4444', fill: 'rgba(239, 68, 68, 0.3)' },
  { name: 'Blue', value: '#3b82f6', fill: 'rgba(59, 130, 246, 0.3)' },
  { name: 'Green', value: '#10b981', fill: 'rgba(16, 185, 129, 0.3)' },
  { name: 'Purple', value: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.3)' },
  { name: 'Orange', value: '#f97316', fill: 'rgba(249, 115, 22, 0.3)' },
  { name: 'Pink', value: '#ec4899', fill: 'rgba(236, 72, 153, 0.3)' },
];

const PolygonDrawingTool: React.FC<PolygonDrawingToolProps> = ({
  isActive,
  onToggle,
  map,
  mapWidth,
  mapHeight,
}) => {
  const [currentPolygon, setCurrentPolygon] = useState<Vertex[]>([]);
  const [savedPolygons, setSavedPolygons] = useState<Polygon[]>([]);
  const [selectedColor, setSelectedColor] = useState(POLYGON_COLORS[0]);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    polygonId: string | null;
    vertexId: string | null;
    offset: { x: number; y: number };
  }>({ isDragging: false, polygonId: null, vertexId: null, offset: { x: 0, y: 0 } });
  const [editMode, setEditMode] = useState(false);
  const [showSavedPolygons, setShowSavedPolygons] = useState(true);
  const [newPolygonName, setNewPolygonName] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  // Convert pixel coordinates to lat/lng (India bounds approximation)
  const pixelToLatLng = useCallback(
    (x: number, y: number) => {
      const lat = 37.6 - (y / mapHeight) * (37.6 - 6.4);
      const lng = 68.1 + (x / mapWidth) * (97.25 - 68.1);
      return { lat, lng };
    },
    [mapWidth, mapHeight]
  );

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((point1: Vertex, point2: Vertex) => {
    const R = 6371; // Earth radius in km
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
  }, []);

  // Calculate polygon area using Shoelace formula (converted to km²)
  const calculatePolygonArea = useCallback((vertices: Vertex[]) => {
    if (vertices.length < 3) return 0;

    // Convert lat/lng to approximate meters for more accurate area calculation
    let area = 0;
    const n = vertices.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const xi = vertices[i].lng * 111320 * Math.cos((vertices[i].lat * Math.PI) / 180);
      const yi = vertices[i].lat * 110540;
      const xj = vertices[j].lng * 111320 * Math.cos((vertices[j].lat * Math.PI) / 180);
      const yj = vertices[j].lat * 110540;

      area += xi * yj - xj * yi;
    }

    return Math.abs(area) / (2 * 1000000); // Convert to km²
  }, []);

  // Calculate polygon perimeter
  const calculatePolygonPerimeter = useCallback((vertices: Vertex[]) => {
    if (vertices.length < 2) return 0;

    let perimeter = 0;
    for (let i = 0; i < vertices.length; i++) {
      const nextIndex = (i + 1) % vertices.length;
      perimeter += calculateDistance(vertices[i], vertices[nextIndex]);
    }

    return perimeter;
  }, [calculateDistance]);

  // Current polygon calculations
  const currentPolygonStats = useMemo(() => {
    if (currentPolygon.length < 3) {
      return { area: 0, perimeter: 0, isValid: false };
    }

    const area = calculatePolygonArea(currentPolygon);
    const perimeter = calculatePolygonPerimeter(currentPolygon);
    const isValid = area > 0 && currentPolygon.length >= 3;

    return { area, perimeter, isValid };
  }, [currentPolygon, calculatePolygonArea, calculatePolygonPerimeter]);

  // Handle map click to add vertices with geofencing validation
  const handleMapClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isActive || editMode || dragState.isDragging) return;

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

      const newVertex: Vertex = {
        id: `vertex-${Date.now()}`,
        lat,
        lng,
        x,
        y,
      };

      setCurrentPolygon(prev => [...prev, newVertex]);

      // Show warning for locations near border
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
    [isActive, editMode, dragState.isDragging, pixelToLatLng]
  );

  // Complete current polygon with validation
  const completePolygon = useCallback(() => {
    if (currentPolygon.length < 3) {
      const event = new CustomEvent('showNotification', {
        detail: {
          type: 'error',
          title: 'Invalid Polygon',
          message: 'A polygon must have at least 3 vertices',
          duration: 4000
        }
      });
      window.dispatchEvent(event);
      return;
    }

    // Validate all vertices are within India
    const coordinates = currentPolygon.map(vertex => ({ lat: vertex.lat, lng: vertex.lng }));
    const validation = validateMultipleCoordinates(coordinates);

    if (!validation.isValid) {
      const event = new CustomEvent('showNotification', {
        detail: {
          type: 'error',
          title: 'Invalid Polygon',
          message: validation.message || 'Some polygon vertices are outside India boundaries',
          duration: 6000
        }
      });
      window.dispatchEvent(event);
      return;
    }

    const name = newPolygonName.trim() || `Polygon ${savedPolygons.length + 1}`;
    const polygon: Polygon = {
      id: `polygon-${Date.now()}`,
      name,
      vertices: [...currentPolygon],
      color: selectedColor.value,
      isComplete: true,
      area: currentPolygonStats.area,
      perimeter: currentPolygonStats.perimeter,
      createdAt: new Date(),
    };

    setSavedPolygons(prev => [...prev, polygon]);
    setCurrentPolygon([]);
    setNewPolygonName('');
  }, [currentPolygon, newPolygonName, savedPolygons.length, selectedColor.value, currentPolygonStats]);

  // Clear current polygon
  const clearCurrentPolygon = () => {
    setCurrentPolygon([]);
  };

  // Remove last vertex
  const removeLastVertex = () => {
    setCurrentPolygon(prev => prev.slice(0, -1));
  };

  // Delete saved polygon
  const deletePolygon = (polygonId: string) => {
    setSavedPolygons(prev => prev.filter(p => p.id !== polygonId));
  };

  // Handle vertex drag start
  const handleVertexMouseDown = useCallback(
    (event: React.MouseEvent, polygonId: string, vertexId: string) => {
      if (!editMode) return;

      event.stopPropagation();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      setDragState({
        isDragging: true,
        polygonId,
        vertexId,
        offset: { x, y },
      });
    },
    [editMode]
  );

  // Handle vertex drag
  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!dragState.isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const { lat, lng } = pixelToLatLng(x, y);

      setSavedPolygons(prev =>
        prev.map(polygon => {
          if (polygon.id !== dragState.polygonId) return polygon;

          const updatedVertices = polygon.vertices.map(vertex => {
            if (vertex.id !== dragState.vertexId) return vertex;
            return { ...vertex, lat, lng, x, y };
          });

          return {
            ...polygon,
            vertices: updatedVertices,
            area: calculatePolygonArea(updatedVertices),
            perimeter: calculatePolygonPerimeter(updatedVertices),
          };
        })
      );
    },
    [dragState, pixelToLatLng, calculatePolygonArea, calculatePolygonPerimeter]
  );

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      polygonId: null,
      vertexId: null,
      offset: { x: 0, y: 0 },
    });
  }, []);

  // Render polygon path
  const getPolygonPath = (vertices: Vertex[]) => {
    if (vertices.length < 2) return '';
    return `M ${vertices.map(v => `${v.x},${v.y}`).join(' L ')} Z`;
  };

  return (
    <>
      {/* Tool Controls - Only show when activated */}
      {isActive && (
        <div className="fixed bottom-4 left-1/4 transform -translate-x-1/2 z-20">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-4 max-w-sm border border-gray-200/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Polygon Tool</h3>
            <button
              onClick={onToggle}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isActive ? 'Stop' : 'Start'}
            </button>
          </div>

          {isActive && (
            <>
              <div className="text-xs text-green-600 mb-3">
                Click on the map to add polygon vertices
              </div>

              {/* Color Selector */}
              <div className="mb-3">
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Polygon Color:
                </label>
                <div className="flex space-x-1">
                  {POLYGON_COLORS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color)}
                      className={`w-6 h-6 rounded border-2 ${
                        selectedColor.value === color.value
                          ? 'border-gray-800'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Polygon Name Input */}
              <div className="mb-3">
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Polygon Name:
                </label>
                <input
                  type="text"
                  value={newPolygonName}
                  onChange={(e) => setNewPolygonName(e.target.value)}
                  placeholder={`Polygon ${savedPolygons.length + 1}`}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                />
              </div>

              {/* Current Polygon Stats */}
              {currentPolygon.length > 0 && (
                <div className="mb-3 p-2 bg-green-50 rounded">
                  <div className="text-xs text-gray-600">
                    <div>Vertices: {currentPolygon.length}</div>
                    {currentPolygon.length >= 3 && (
                      <>
                        <div>Area: {currentPolygonStats.area.toFixed(4)} km²</div>
                        <div>Perimeter: {currentPolygonStats.perimeter.toFixed(2)} km</div>
                        <div className={`font-medium ${currentPolygonStats.isValid ? 'text-green-600' : 'text-red-600'}`}>
                          {currentPolygonStats.isValid ? '✓ Valid polygon' : '✗ Invalid polygon'}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <button
                    onClick={removeLastVertex}
                    disabled={currentPolygon.length === 0}
                    className="flex-1 px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Undo Vertex
                  </button>
                  <button
                    onClick={clearCurrentPolygon}
                    disabled={currentPolygon.length === 0}
                    className="flex-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear
                  </button>
                </div>

                <button
                  onClick={completePolygon}
                  disabled={currentPolygon.length < 3 || !currentPolygonStats.isValid}
                  className="w-full px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Complete Polygon
                </button>

                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-1 text-xs">
                    <input
                      type="checkbox"
                      checked={editMode}
                      onChange={(e) => setEditMode(e.target.checked)}
                      className="w-3 h-3"
                    />
                    <span>Edit Mode</span>
                  </label>
                  <label className="flex items-center space-x-1 text-xs">
                    <input
                      type="checkbox"
                      checked={showSavedPolygons}
                      onChange={(e) => setShowSavedPolygons(e.target.checked)}
                      className="w-3 h-3"
                    />
                    <span>Show Saved</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Saved Polygons List */}
          {savedPolygons.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <h4 className="text-xs font-bold text-gray-900 mb-2">
                Saved Polygons ({savedPolygons.length})
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {savedPolygons.map(polygon => (
                  <div key={polygon.id} className="text-xs bg-gray-50 p-2 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate" title={polygon.name}>
                        {polygon.name}
                      </span>
                      <button
                        onClick={() => deletePolygon(polygon.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete polygon"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="text-gray-600">
                      <div>Area: {polygon.area.toFixed(4)} km²</div>
                      <div>Perimeter: {polygon.perimeter.toFixed(2)} km</div>
                      <div>Vertices: {polygon.vertices.length}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
      )}

      {/* Polygon Overlay */}
      {isActive && (
        <div
          ref={containerRef}
          className={`absolute inset-0 z-10 ${editMode ? 'cursor-move' : 'cursor-crosshair'}`}
          onClick={handleMapClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
            {/* Render saved polygons */}
            {showSavedPolygons && savedPolygons.map(polygon => (
              <g key={polygon.id}>
                {/* Polygon fill */}
                <path
                  d={getPolygonPath(polygon.vertices)}
                  fill={POLYGON_COLORS.find(c => c.value === polygon.color)?.fill || 'rgba(239, 68, 68, 0.3)'}
                  stroke={polygon.color}
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />

                {/* Polygon label */}
                {polygon.vertices.length > 0 && (
                  <text
                    x={polygon.vertices.reduce((sum, v) => sum + v.x, 0) / polygon.vertices.length}
                    y={polygon.vertices.reduce((sum, v) => sum + v.y, 0) / polygon.vertices.length}
                    fill={polygon.color}
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {polygon.name}
                  </text>
                )}
              </g>
            ))}

            {/* Render current polygon */}
            {currentPolygon.length > 2 && (
              <path
                d={getPolygonPath(currentPolygon)}
                fill={selectedColor.fill}
                stroke={selectedColor.value}
                strokeWidth="2"
                strokeDasharray="3,3"
              />
            )}

            {/* Render current polygon lines */}
            {currentPolygon.length > 1 && currentPolygon.map((vertex, index) => {
              if (index === currentPolygon.length - 1) return null;
              const nextVertex = currentPolygon[index + 1];
              return (
                <line
                  key={`line-${vertex.id}`}
                  x1={vertex.x}
                  y1={vertex.y}
                  x2={nextVertex.x}
                  y2={nextVertex.y}
                  stroke={selectedColor.value}
                  strokeWidth="2"
                  strokeDasharray="3,3"
                />
              );
            })}
          </svg>

          {/* Render current polygon vertices */}
          {currentPolygon.map((vertex, index) => (
            <div
              key={vertex.id}
              className="absolute w-3 h-3 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: vertex.x,
                top: vertex.y,
                backgroundColor: selectedColor.value,
              }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold bg-white px-1 rounded shadow">
                {index + 1}
              </div>
            </div>
          ))}

          {/* Render saved polygon vertices in edit mode */}
          {editMode && showSavedPolygons && savedPolygons.map(polygon =>
            polygon.vertices.map((vertex, index) => (
              <div
                key={`${polygon.id}-${vertex.id}`}
                className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 cursor-move pointer-events-auto"
                style={{
                  left: vertex.x,
                  top: vertex.y,
                  backgroundColor: polygon.color,
                }}
                onMouseDown={(e) => handleVertexMouseDown(e, polygon.id, vertex.id)}
                title={`${polygon.name} - Vertex ${index + 1}`}
              >
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-bold text-white bg-black px-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
};

export default PolygonDrawingTool;