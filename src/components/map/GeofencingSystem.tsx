import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface StateFeature {
  type: 'Feature';
  properties: {
    st_nm: string;
  };
  geometry: {
    type: 'MultiPolygon';
    coordinates: number[][][][];
  };
}

interface IndiaGeoData {
  type: 'FeatureCollection';
  features: StateFeature[];
}

interface GeofencingSystemProps {
  assignedStates: string[];
  isActive: boolean;
  mapWidth: number;
  mapHeight: number;
  onGeofenceViolation?: (point: { lat: number; lng: number }, violationType: string) => void;
}

const GeofencingSystem: React.FC<GeofencingSystemProps> = ({
  assignedStates,
  isActive,
  mapWidth,
  mapHeight,
  onGeofenceViolation,
}) => {
  const [geoData, setGeoData] = useState<IndiaGeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  // Load India GeoJSON data
  useEffect(() => {
    const loadGeoData = async () => {
      try {
        const response = await fetch('/india.json');
        const data: IndiaGeoData = await response.json();
        setGeoData(data);
      } catch (error) {
        console.error('Error loading geo data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGeoData();
  }, []);

  // Convert lat/lng to pixel coordinates
  const latLngToPixel = useCallback(
    (lat: number, lng: number) => {
      // India bounds: lat 6.4-37.6, lng 68.1-97.25
      const x = ((lng - 68.1) / (97.25 - 68.1)) * mapWidth;
      const y = ((37.6 - lat) / (37.6 - 6.4)) * mapHeight;
      return { x, y };
    },
    [mapWidth, mapHeight]
  );

  // Convert pixel coordinates to lat/lng
  const pixelToLatLng = useCallback(
    (x: number, y: number) => {
      const lat = 37.6 - (y / mapHeight) * (37.6 - 6.4);
      const lng = 68.1 + (x / mapWidth) * (97.25 - 68.1);
      return { lat, lng };
    },
    [mapWidth, mapHeight]
  );

  // Check if a point is inside a polygon using ray casting algorithm
  const isPointInPolygon = useCallback((point: [number, number], polygon: number[][]) => {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }, []);

  // Check if a point is inside any of the multipolygon coordinates
  const isPointInMultiPolygon = useCallback((point: [number, number], multiPolygon: number[][][][]) => {
    for (const polygon of multiPolygon) {
      for (const ring of polygon) {
        if (isPointInPolygon(point, ring)) {
          return true;
        }
      }
    }
    return false;
  }, [isPointInPolygon]);

  // Check if a lat/lng point is within assigned regions
  const isPointInAssignedRegion = useCallback((lat: number, lng: number): boolean => {
    if (!geoData || assignedStates.length === 0) return false;

    const point: [number, number] = [lng, lat];

    for (const feature of geoData.features) {
      if (assignedStates.includes(feature.properties.st_nm)) {
        if (isPointInMultiPolygon(point, feature.geometry.coordinates)) {
          return true;
        }
      }
    }

    return false;
  }, [geoData, assignedStates, isPointInMultiPolygon]);

  // Validate point and trigger violation if needed
  const validatePoint = useCallback((lat: number, lng: number): boolean => {
    if (!isActive || assignedStates.length === 0) return true;

    const isValid = isPointInAssignedRegion(lat, lng);

    if (!isValid) {
      onGeofenceViolation?.({ lat, lng }, 'outside_assigned_region');
    }

    return isValid;
  }, [isActive, assignedStates.length, isPointInAssignedRegion, onGeofenceViolation]);

  // Get assigned state features
  const assignedStateFeatures = useMemo(() => {
    if (!geoData) return [];
    return geoData.features.filter(feature =>
      assignedStates.includes(feature.properties.st_nm)
    );
  }, [geoData, assignedStates]);

  // Get unassigned state features
  const unassignedStateFeatures = useMemo(() => {
    if (!geoData) return [];
    return geoData.features.filter(feature =>
      !assignedStates.includes(feature.properties.st_nm)
    );
  }, [geoData, assignedStates]);

  // Convert multipolygon coordinates to SVG path
  const multiPolygonToPath = useCallback((coordinates: number[][][][]) => {
    let path = '';

    for (const polygon of coordinates) {
      for (const ring of polygon) {
        if (ring.length < 3) continue;

        const firstPoint = latLngToPixel(ring[0][1], ring[0][0]);
        path += `M ${firstPoint.x},${firstPoint.y} `;

        for (let i = 1; i < ring.length; i++) {
          const point = latLngToPixel(ring[i][1], ring[i][0]);
          path += `L ${point.x},${point.y} `;
        }

        path += 'Z ';
      }
    }

    return path;
  }, [latLngToPixel]);

  // Calculate centroid of a state for label placement
  const getStateCentroid = useCallback((coordinates: number[][][][]) => {
    let totalLat = 0;
    let totalLng = 0;
    let totalPoints = 0;

    for (const polygon of coordinates) {
      for (const ring of polygon) {
        for (const point of ring) {
          totalLng += point[0];
          totalLat += point[1];
          totalPoints++;
        }
      }
    }

    if (totalPoints === 0) return null;

    const centroidLat = totalLat / totalPoints;
    const centroidLng = totalLng / totalPoints;

    return latLngToPixel(centroidLat, centroidLng);
  }, [latLngToPixel]);

  if (loading) {
    return null;
  }

  return (
    <>
      {/* Geofencing Controls */}
      {isActive && assignedStates.length > 0 && (
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-white rounded-lg shadow-lg p-3 max-w-xs">
            <h4 className="text-sm font-bold text-gray-900 mb-2">Geofencing Active</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showBoundaries}
                  onChange={(e) => setShowBoundaries(e.target.checked)}
                  className="w-3 h-3"
                />
                <span className="text-xs text-gray-600">Show Boundaries</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="w-3 h-3"
                />
                <span className="text-xs text-gray-600">Show Labels</span>
              </label>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <div className="flex items-center space-x-1 mb-1">
                  <div className="w-3 h-3 bg-green-200 border border-green-500 rounded"></div>
                  <span>Allowed Regions ({assignedStates.length})</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                  <span>Restricted Areas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* State Boundaries Overlay */}
      {isActive && showBoundaries && geoData && (
        <div className="absolute inset-0 z-5 pointer-events-none">
          <svg className="w-full h-full">
            {/* Assigned states (allowed regions) */}
            {assignedStateFeatures.map(feature => (
              <g key={`assigned-${feature.properties.st_nm}`}>
                <path
                  d={multiPolygonToPath(feature.geometry.coordinates)}
                  fill="rgba(34, 197, 94, 0.2)"
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </g>
            ))}

            {/* Unassigned states (restricted regions) */}
            {unassignedStateFeatures.map(feature => (
              <g key={`unassigned-${feature.properties.st_nm}`}>
                <path
                  d={multiPolygonToPath(feature.geometry.coordinates)}
                  fill="rgba(239, 68, 68, 0.1)"
                  stroke="#ef4444"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                  opacity="0.7"
                />
              </g>
            ))}

            {/* State Labels */}
            {showLabels && assignedStateFeatures.map(feature => {
              const centroid = getStateCentroid(feature.geometry.coordinates);
              if (!centroid) return null;

              return (
                <text
                  key={`label-${feature.properties.st_nm}`}
                  x={centroid.x}
                  y={centroid.y}
                  textAnchor="middle"
                  fill="#065f46"
                  fontSize="10"
                  fontWeight="bold"
                  className="pointer-events-none"
                  style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}
                >
                  {feature.properties.st_nm}
                </text>
              );
            })}
          </svg>
        </div>
      )}

      {/* Geofencing Status */}
      {isActive && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-white rounded-lg shadow-lg px-4 py-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-700">
                Geofencing Active - {assignedStates.length} Region{assignedStates.length !== 1 ? 's' : ''} Allowed
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Custom hook for geofencing validation
export const useGeofencing = (
  assignedStates: string[],
  isActive: boolean = true
) => {
  const [geoData, setGeoData] = useState<IndiaGeoData | null>(null);
  const [violations, setViolations] = useState<Array<{
    point: { lat: number; lng: number };
    timestamp: Date;
    type: string;
  }>>([]);

  useEffect(() => {
    const loadGeoData = async () => {
      try {
        const response = await fetch('/india.json');
        const data: IndiaGeoData = await response.json();
        setGeoData(data);
      } catch (error) {
        console.error('Error loading geo data:', error);
      }
    };

    loadGeoData();
  }, []);

  const isPointInPolygon = useCallback((point: [number, number], polygon: number[][]) => {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }, []);

  const isPointInMultiPolygon = useCallback((point: [number, number], multiPolygon: number[][][][]) => {
    for (const polygon of multiPolygon) {
      for (const ring of polygon) {
        if (isPointInPolygon(point, ring)) {
          return true;
        }
      }
    }
    return false;
  }, [isPointInPolygon]);

  const validatePoint = useCallback((lat: number, lng: number): boolean => {
    if (!isActive || !geoData || assignedStates.length === 0) return true;

    const point: [number, number] = [lng, lat];

    for (const feature of geoData.features) {
      if (assignedStates.includes(feature.properties.st_nm)) {
        if (isPointInMultiPolygon(point, feature.geometry.coordinates)) {
          return true;
        }
      }
    }

    // Log violation
    setViolations(prev => [...prev, {
      point: { lat, lng },
      timestamp: new Date(),
      type: 'outside_assigned_region'
    }]);

    return false;
  }, [isActive, geoData, assignedStates, isPointInMultiPolygon]);

  const clearViolations = useCallback(() => {
    setViolations([]);
  }, []);

  return {
    validatePoint,
    violations,
    clearViolations,
    isDataLoaded: !!geoData,
  };
};

export default GeofencingSystem;