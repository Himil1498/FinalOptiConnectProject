import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';

interface ElevationPoint {
  id: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  elevation: number;
  timestamp: Date;
}

interface ElevationProfile {
  points: ElevationPoint[];
  totalDistance: number;
  elevationGain: number;
  elevationLoss: number;
  minElevation: number;
  maxElevation: number;
  averageElevation: number;
  grade: number;
}

interface ElevationToolProps {
  isActive: boolean;
  onToggle: () => void;
  map?: google.maps.Map | null;
  mapWidth: number;
  mapHeight: number;
}

type ElevationUnit = 'meters' | 'feet';

const ElevationTool: React.FC<ElevationToolProps> = ({
  isActive,
  onToggle,
  map,
  mapWidth,
  mapHeight,
}) => {
  const [elevationPoints, setElevationPoints] = useState<ElevationPoint[]>([]);
  const [unit, setUnit] = useState<ElevationUnit>('meters');
  const [showChart, setShowChart] = useState(true);
  const [showTerrain, setShowTerrain] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileMode, setProfileMode] = useState(false);
  const chartRef = useRef<HTMLCanvasElement>(null);

  // Convert pixel coordinates to lat/lng (India bounds approximation)
  const pixelToLatLng = useCallback(
    (x: number, y: number) => {
      const lat = 37.6 - (y / mapHeight) * (37.6 - 6.4);
      const lng = 68.1 + (x / mapWidth) * (97.25 - 68.1);
      return { lat, lng };
    },
    [mapWidth, mapHeight]
  );

  // Mock elevation data generation (simulates Google Elevation API)
  const generateMockElevation = useCallback((lat: number, lng: number): number => {
    // Create realistic elevation data based on India's geography
    // Himalayas in the north (higher latitudes), plains in the center, Western Ghats on west coast

    // Base elevation from latitude (Himalayas effect)
    let elevation = Math.max(0, (lat - 20) * 200); // Higher elevation towards north

    // Add Western Ghats effect (around 73-77 longitude)
    if (lng >= 73 && lng <= 77) {
      elevation += Math.abs(Math.sin((lng - 75) * Math.PI / 2)) * 800;
    }

    // Add Eastern Ghats effect (around 78-84 longitude)
    if (lng >= 78 && lng <= 84) {
      elevation += Math.abs(Math.sin((lng - 81) * Math.PI / 3)) * 400;
    }

    // Add some random variation for realism
    elevation += (Math.random() - 0.5) * 100;

    // Ensure minimum elevation (sea level)
    elevation = Math.max(0, elevation);

    // Add coastal effects (lower elevation near coasts)
    if (lat < 15 || lng < 70 || lng > 90) {
      elevation *= 0.3;
    }

    return Math.round(elevation);
  }, []);

  // Calculate distance between two points
  const calculateDistance = useCallback((point1: ElevationPoint, point2: ElevationPoint) => {
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

  // Convert elevation based on unit
  const convertElevation = useCallback((elevationInMeters: number) => {
    return unit === 'feet' ? elevationInMeters * 3.28084 : elevationInMeters;
  }, [unit]);

  // Calculate elevation profile analysis
  const elevationProfile = useMemo((): ElevationProfile => {
    if (elevationPoints.length < 2) {
      return {
        points: elevationPoints,
        totalDistance: 0,
        elevationGain: 0,
        elevationLoss: 0,
        minElevation: elevationPoints[0]?.elevation || 0,
        maxElevation: elevationPoints[0]?.elevation || 0,
        averageElevation: elevationPoints[0]?.elevation || 0,
        grade: 0,
      };
    }

    let totalDistance = 0;
    let elevationGain = 0;
    let elevationLoss = 0;
    let minElevation = elevationPoints[0].elevation;
    let maxElevation = elevationPoints[0].elevation;
    let totalElevation = 0;

    for (let i = 1; i < elevationPoints.length; i++) {
      const prev = elevationPoints[i - 1];
      const curr = elevationPoints[i];

      totalDistance += calculateDistance(prev, curr);

      const elevationDiff = curr.elevation - prev.elevation;
      if (elevationDiff > 0) {
        elevationGain += elevationDiff;
      } else {
        elevationLoss += Math.abs(elevationDiff);
      }

      minElevation = Math.min(minElevation, curr.elevation);
      maxElevation = Math.max(maxElevation, curr.elevation);
      totalElevation += curr.elevation;
    }

    const averageElevation = totalElevation / elevationPoints.length;
    const totalElevationChange = elevationPoints[elevationPoints.length - 1].elevation - elevationPoints[0].elevation;
    const grade = totalDistance > 0 ? (totalElevationChange / (totalDistance * 1000)) * 100 : 0;

    return {
      points: elevationPoints,
      totalDistance,
      elevationGain,
      elevationLoss,
      minElevation,
      maxElevation,
      averageElevation,
      grade,
    };
  }, [elevationPoints, calculateDistance]);

  // Handle map click to get elevation
  const handleMapClick = useCallback(
    async (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isActive) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const { lat, lng } = pixelToLatLng(x, y);

      setLoading(true);

      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // In real implementation, this would call Google Elevation API
        const elevation = generateMockElevation(lat, lng);

        const newPoint: ElevationPoint = {
          id: `elevation-${Date.now()}`,
          lat,
          lng,
          x,
          y,
          elevation,
          timestamp: new Date(),
        };

        if (profileMode) {
          setElevationPoints(prev => [...prev, newPoint]);
        } else {
          setElevationPoints([newPoint]);
        }
      } catch (error) {
        console.error('Error fetching elevation:', error);
      } finally {
        setLoading(false);
      }
    },
    [isActive, profileMode, pixelToLatLng, generateMockElevation]
  );

  // Clear all points
  const clearPoints = () => {
    setElevationPoints([]);
  };

  // Remove last point
  const removeLastPoint = () => {
    setElevationPoints(prev => prev.slice(0, -1));
  };

  // Draw elevation chart
  useEffect(() => {
    if (!showChart || !chartRef.current || elevationPoints.length < 2) return;

    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate cumulative distances
    const distances = [0];
    for (let i = 1; i < elevationPoints.length; i++) {
      const dist = calculateDistance(elevationPoints[i - 1], elevationPoints[i]);
      distances.push(distances[distances.length - 1] + dist);
    }

    const maxDistance = distances[distances.length - 1];
    const minElevation = Math.min(...elevationPoints.map(p => p.elevation));
    const maxElevation = Math.max(...elevationPoints.map(p => p.elevation));
    const elevationRange = maxElevation - minElevation || 1;

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * (width - 2 * padding);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = padding + (i / 10) * (height - 2 * padding);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw elevation line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    elevationPoints.forEach((point, index) => {
      const x = padding + (distances[index] / maxDistance) * (width - 2 * padding);
      const y = height - padding - ((point.elevation - minElevation) / elevationRange) * (height - 2 * padding);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    ctx.fillStyle = '#3b82f6';
    elevationPoints.forEach((point, index) => {
      const x = padding + (distances[index] / maxDistance) * (width - 2 * padding);
      const y = height - padding - ((point.elevation - minElevation) / elevationRange) * (height - 2 * padding);

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = '#374151';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    // Distance labels
    for (let i = 0; i <= 5; i++) {
      const x = padding + (i / 5) * (width - 2 * padding);
      const distance = (maxDistance * i / 5).toFixed(1);
      ctx.fillText(`${distance} km`, x, height - 10);
    }

    // Elevation labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = height - padding - (i / 5) * (height - 2 * padding);
      const elevation = (minElevation + (elevationRange * i / 5)).toFixed(0);
      ctx.fillText(`${elevation} ${unit === 'feet' ? 'ft' : 'm'}`, padding - 10, y + 4);
    }
  }, [elevationPoints, showChart, calculateDistance, unit]);

  // Get terrain classification
  const getTerrainClass = (elevation: number) => {
    if (elevation < 200) return { name: 'Plains', color: '#22c55e' };
    if (elevation < 600) return { name: 'Hills', color: '#eab308' };
    if (elevation < 1500) return { name: 'Mountains', color: '#f97316' };
    return { name: 'High Mountains', color: '#ef4444' };
  };

  return (
    <>
      {/* Tool Controls - Only show when activated */}
      {isActive && (
        <div className="fixed bottom-4 right-1/4 transform translate-x-1/2 z-20">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-4 max-w-md border border-gray-200/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Elevation Tool</h3>
            <button
              onClick={onToggle}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isActive ? 'Stop' : 'Start'}
            </button>
          </div>

          {isActive && (
            <>
              <div className="text-xs text-purple-600 mb-3">
                {profileMode ? 'Click multiple points to create elevation profile' : 'Click on the map to get elevation data'}
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as ElevationUnit)}
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                >
                  <option value="meters">Meters</option>
                  <option value="feet">Feet</option>
                </select>

                <div className="flex items-center space-x-1">
                  <label className="flex items-center space-x-1 text-xs">
                    <input
                      type="checkbox"
                      checked={profileMode}
                      onChange={(e) => setProfileMode(e.target.checked)}
                      className="w-3 h-3"
                    />
                    <span>Profile Mode</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-3">
                <label className="flex items-center space-x-1 text-xs">
                  <input
                    type="checkbox"
                    checked={showChart}
                    onChange={(e) => setShowChart(e.target.checked)}
                    className="w-3 h-3"
                  />
                  <span>Show Chart</span>
                </label>
                <label className="flex items-center space-x-1 text-xs">
                  <input
                    type="checkbox"
                    checked={showTerrain}
                    onChange={(e) => setShowTerrain(e.target.checked)}
                    className="w-3 h-3"
                  />
                  <span>Terrain Analysis</span>
                </label>
              </div>

              {/* Current Point Info */}
              {elevationPoints.length > 0 && (
                <div className="mb-3 p-2 bg-purple-50 rounded">
                  <div className="text-xs text-gray-600">
                    <div className="font-medium">Latest Point:</div>
                    <div>Elevation: {convertElevation(elevationPoints[elevationPoints.length - 1].elevation).toFixed(1)} {unit === 'feet' ? 'ft' : 'm'}</div>
                    <div>Coordinates: {elevationPoints[elevationPoints.length - 1].lat.toFixed(4)}, {elevationPoints[elevationPoints.length - 1].lng.toFixed(4)}</div>
                    {showTerrain && (
                      <div className="flex items-center space-x-1 mt-1">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: getTerrainClass(elevationPoints[elevationPoints.length - 1].elevation).color }}
                        />
                        <span>{getTerrainClass(elevationPoints[elevationPoints.length - 1].elevation).name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Profile Analysis */}
              {profileMode && elevationPoints.length > 1 && (
                <div className="mb-3 p-2 bg-blue-50 rounded">
                  <div className="text-xs text-gray-600">
                    <div className="font-medium">Profile Analysis:</div>
                    <div>Distance: {elevationProfile.totalDistance.toFixed(2)} km</div>
                    <div>Elevation Gain: {convertElevation(elevationProfile.elevationGain).toFixed(1)} {unit === 'feet' ? 'ft' : 'm'}</div>
                    <div>Elevation Loss: {convertElevation(elevationProfile.elevationLoss).toFixed(1)} {unit === 'feet' ? 'ft' : 'm'}</div>
                    <div>Grade: {elevationProfile.grade.toFixed(1)}%</div>
                    <div>Min/Max: {convertElevation(elevationProfile.minElevation).toFixed(0)}/{convertElevation(elevationProfile.maxElevation).toFixed(0)} {unit === 'feet' ? 'ft' : 'm'}</div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2 mb-3">
                <button
                  onClick={removeLastPoint}
                  disabled={elevationPoints.length === 0}
                  className="flex-1 px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Undo Point
                </button>
                <button
                  onClick={clearPoints}
                  disabled={elevationPoints.length === 0}
                  className="flex-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear All
                </button>
              </div>

              {/* Elevation Chart */}
              {showChart && elevationPoints.length > 1 && (
                <div className="border rounded p-2 bg-gray-50">
                  <div className="text-xs font-medium text-gray-700 mb-2">Elevation Profile</div>
                  <canvas
                    ref={chartRef}
                    width={280}
                    height={150}
                    className="w-full h-auto border rounded bg-white"
                  />
                </div>
              )}

              {loading && (
                <div className="text-center py-2">
                  <div className="text-xs text-purple-600">Fetching elevation data...</div>
                </div>
              )}
            </>
          )}
        </div>
        </div>
      )}

      {/* Elevation Overlay */}
      {isActive && (
        <div
          className="absolute inset-0 z-10 cursor-crosshair"
          onClick={handleMapClick}
        >
          {/* Render elevation points */}
          {elevationPoints.map((point, index) => (
            <div key={point.id}>
              {/* Point marker */}
              <div
                className="absolute w-4 h-4 bg-purple-500 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: point.x,
                  top: point.y,
                }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-purple-700 bg-white px-2 py-1 rounded shadow whitespace-nowrap">
                  {convertElevation(point.elevation).toFixed(0)} {unit === 'feet' ? 'ft' : 'm'}
                  {showTerrain && (
                    <div className="text-center mt-1">
                      <span
                        className="px-1 rounded text-white text-xs"
                        style={{ backgroundColor: getTerrainClass(point.elevation).color }}
                      >
                        {getTerrainClass(point.elevation).name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Line to next point in profile mode */}
              {profileMode && index < elevationPoints.length - 1 && (
                <svg
                  className="absolute inset-0 pointer-events-none"
                  style={{ width: '100%', height: '100%' }}
                >
                  <line
                    x1={point.x}
                    y1={point.y}
                    x2={elevationPoints[index + 1].x}
                    y2={elevationPoints[index + 1].y}
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                </svg>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-white rounded-lg shadow-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  <span className="text-sm text-purple-600">Getting elevation...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ElevationTool;