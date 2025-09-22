import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Z_INDEX } from '../../constants/zIndex';
import StreetViewWithMarkings from './StreetViewWithMarkings';
import { useStackedToolboxPositioning } from '../../hooks/useStackedToolboxPositioning';

// Hook to detect sidebar state and calculate positioning
const useSidebarAwarePositioning = () => {
  const [sidebarWidth, setSidebarWidth] = useState(280);

  useEffect(() => {
    const checkSidebarState = () => {
      const selectors = [
        ".dashboard-sidebar",
        '[class*="sidebar"]',
        'nav[class*="left"]',
        "aside",
        '[class*="navigation"]',
        '[class*="menu"]',
        ".fixed.left-0",
        ".fixed.inset-y-0"
      ];

      let sidebar = null;
      for (const selector of selectors) {
        sidebar = document.querySelector(selector);
        if (sidebar) break;
      }

      if (sidebar) {
        const rect = sidebar.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(sidebar);
        const isVisible =
          computedStyle.display !== "none" &&
          computedStyle.visibility !== "hidden" &&
          rect.width > 0;

        if (isVisible) {
          setSidebarWidth(rect.width + 16);
        } else {
          setSidebarWidth(16);
        }
      } else {
        setSidebarWidth(16);
      }
    };

    checkSidebarState();
    setTimeout(checkSidebarState, 10);

    let rafId: number;
    const observer = new MutationObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(checkSidebarState);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "data-collapsed", "data-expanded", "data-state"]
    });

    window.addEventListener("resize", checkSidebarState);

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('[class*="sidebar"], [class*="menu"], [class*="nav"], button') ||
        target.getAttribute("aria-expanded") !== null
      ) {
        requestAnimationFrame(checkSidebarState);
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", checkSidebarState);
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return { sidebarWidth };
};

interface Point {
  id: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  marker?: google.maps.Marker | null;
}

interface SavedMeasurement {
  id: string;
  name: string;
  points: Point[];
  totalDistance: number;
  unit: "km" | "miles";
  createdAt: Date;
}

interface DistanceMeasurementToolProps {
  isActive: boolean;
  onToggle: () => void;
  map?: google.maps.Map | null;
  mapWidth: number;
  mapHeight: number;
  onDataChange?: (hasData: boolean) => void;
  isPrimaryTool?: boolean;
  multiToolMode?: boolean;
}

const DistanceMeasurementToolV2: React.FC<DistanceMeasurementToolProps> = ({
  isActive,
  onToggle,
  map,
  mapWidth,
  mapHeight,
  onDataChange,
  isPrimaryTool = false,
  multiToolMode = false
}) => {
  const [points, setPoints] = useState<Point[]>([]);
  const [unit, setUnit] = useState<"km" | "miles">("km");
  const [showStreetView, setShowStreetView] = useState(false);
  const [showStreetViewDialog, setShowStreetViewDialog] = useState(false);
  const [streetViewCenterPoint, setStreetViewCenterPoint] = useState<Point | null>(null);
  const [showMeasurementTable, setShowMeasurementTable] = useState(true);
  const [savedMeasurements, setSavedMeasurements] = useState<SavedMeasurement[]>([]);
  const [showSavedMeasurements, setShowSavedMeasurements] = useState(false);
  const [measurementName, setMeasurementName] = useState('');
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(null);
  const { sidebarWidth } = useSidebarAwarePositioning();
  const { top: stackedTop, updateHeight } = useStackedToolboxPositioning('distance-tool', isActive);
  const containerRef = useRef<HTMLDivElement>(null);

  // Store polylines for distance lines
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  // Notify parent when data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(points.length > 0 || savedMeasurements.length > 0);
    }
  }, [points.length, savedMeasurements.length, onDataChange]);

  // Measure and update height for stacking
  useEffect(() => {
    if (containerRef.current && isActive) {
      const resizeObserver = new ResizeObserver(() => {
        if (containerRef.current) {
          updateHeight(containerRef.current.offsetHeight);
        }
      });

      resizeObserver.observe(containerRef.current);
      updateHeight(containerRef.current.offsetHeight);

      return () => resizeObserver.disconnect();
    }
  }, [isActive, updateHeight]);

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

  // Clear all markers and polylines
  const clearMapElements = useCallback(() => {
    // Clear markers
    points.forEach(point => {
      if (point.marker) {
        point.marker.setMap(null);
      }
    });

    // Clear polylines
    polylinesRef.current.forEach(polyline => {
      polyline.setMap(null);
    });
    polylinesRef.current = [];
  }, [points]);

  // Create marker for a point
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
      },
      zIndex: 1000 + index
    });

    return marker;
  }, [map]);

  // Create polyline between two points
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
    if (!map) return;

    clearMapElements();

    // Create markers for all points
    const updatedPoints = points.map((point, index) => {
      const marker = createMarker(point, index);
      return { ...point, marker };
    });

    setPoints(updatedPoints);

    // Create polylines between consecutive points
    for (let i = 0; i < updatedPoints.length - 1; i++) {
      const polyline = createPolyline(updatedPoints[i], updatedPoints[i + 1]);
      if (polyline) {
        polylinesRef.current.push(polyline);
      }
    }
  }, [map, points, createMarker, createPolyline, clearMapElements]);

  // Google Maps click handler
  useEffect(() => {
    console.log('🔧 Distance Tool V2 - Setting up click listener', {
      hasMap: !!map,
      isActive
    });

    if (!map || !isActive) {
      console.log('🚫 Distance Tool V2 - Skipping listener setup:', { hasMap: !!map, isActive });
      return;
    }

    const handleGoogleMapClick = async (event: google.maps.MapMouseEvent) => {
      console.log('🎯 Distance Tool V2 - Map clicked!', {
        hasLatLng: !!event.latLng,
        coordinates: event.latLng ? [event.latLng.lat(), event.latLng.lng()] : null
      });

      if (!event.latLng) {
        console.log('❌ No latLng in click event');
        return;
      }

      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      console.log('📍 Distance Tool V2 - Processing click', { lat, lng });

      // Optional geofencing validation (disabled for unrestricted use)
      console.log('🌍 Distance Tool V2 - Unrestricted mode - No boundary validation');

      // Show info notification for first point
      if (points.length === 0) {
        const notificationEvent = new CustomEvent('showNotification', {
          detail: {
            type: 'info',
            title: 'Distance Tool Active',
            message: 'Click anywhere on the map to measure distances. No geographical restrictions.',
            duration: 3000
          }
        });
        window.dispatchEvent(notificationEvent);
      }

      const newPoint: Point = {
        id: `point-${Date.now()}-${Math.random()}`,
        lat,
        lng,
        x: 0, // Not needed for native markers, but required for interface compatibility
        y: 0
      };

      console.log('➕ Distance Tool V2 - Adding new point', newPoint);
      setPoints((prev) => {
        const updated = [...prev, newPoint];
        console.log('🔢 Distance Tool V2 - Updated points array', {
          oldCount: prev.length,
          newCount: updated.length
        });
        return updated;
      });

      // Show success notification
      const successEvent = new CustomEvent('showNotification', {
        detail: {
          type: 'success',
          title: 'Point Added',
          message: `Distance point added at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          duration: 3000
        }
      });
      window.dispatchEvent(successEvent);
    };

    console.log('🔗 Distance Tool V2 - Adding click listener to map');
    const clickListener = map.addListener("click", handleGoogleMapClick);

    return () => {
      console.log('🧹 Distance Tool V2 - Removing click listener');
      if (clickListener) clickListener.remove();
    };
  }, [map, isActive]);

  // Update visualization when points change
  useEffect(() => {
    updateMapVisualization();
  }, [updateMapVisualization]);

  // Clean up when component unmounts or tool deactivates
  useEffect(() => {
    if (!isActive) {
      clearMapElements();
    }

    return () => {
      clearMapElements();
    };
  }, [isActive, clearMapElements]);

  // Save current measurement
  const saveMeasurement = useCallback(() => {
    if (points.length < 2) {
      const event = new CustomEvent('showNotification', {
        detail: {
          type: 'error',
          title: 'Cannot Save',
          message: 'At least 2 points required for measurement',
          duration: 3000
        }
      });
      window.dispatchEvent(event);
      return;
    }

    const totalDistance = points.reduce((total, point, index) => {
      if (index === 0) return 0;
      return total + calculateDistance(points[index - 1], point);
    }, 0);

    const name = measurementName.trim() || `Measurement ${savedMeasurements.length + 1}`;
    const measurement: SavedMeasurement = {
      id: `measurement-${Date.now()}`,
      name,
      points: [...points],
      totalDistance,
      unit,
      createdAt: new Date(),
    };

    setSavedMeasurements(prev => [...prev, measurement]);
    setMeasurementName('');

    const event = new CustomEvent('showNotification', {
      detail: {
        type: 'success',
        title: 'Measurement Saved',
        message: `"${name}" saved successfully`,
        duration: 3000
      }
    });
    window.dispatchEvent(event);
  }, [points, measurementName, savedMeasurements.length, unit, calculateDistance]);

  // Load saved measurement
  const loadMeasurement = useCallback((measurement: SavedMeasurement) => {
    clearMapElements();
    setPoints(measurement.points);
    setUnit(measurement.unit);
    setSelectedMeasurementId(measurement.id);
  }, [clearMapElements]);

  // Delete saved measurement
  const deleteMeasurement = useCallback((measurementId: string) => {
    setSavedMeasurements(prev => prev.filter(m => m.id !== measurementId));
    if (selectedMeasurementId === measurementId) {
      setSelectedMeasurementId(null);
    }

    const event = new CustomEvent('showNotification', {
      detail: {
        type: 'success',
        title: 'Measurement Deleted',
        message: 'Measurement removed successfully',
        duration: 3000
      }
    });
    window.dispatchEvent(event);
  }, [selectedMeasurementId]);

  // Calculate cumulative distance
  const cumulativeDistance = useMemo(() => {
    if (points.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += calculateDistance(points[i - 1], points[i]);
    }
    return total;
  }, [points, calculateDistance]);

  // Clear all points
  const clearPoints = () => {
    clearMapElements();
    setPoints([]);
  };

  // Remove last point
  const removeLastPoint = () => {
    setPoints((prev) => {
      const newPoints = prev.slice(0, -1);
      return newPoints;
    });
  };

  // Calculate distance lines for Street View
  const distanceLines = useMemo(() => {
    if (points.length < 2) return [];
    const lines = [];
    for (let i = 1; i < points.length; i++) {
      lines.push({
        start: points[i - 1],
        end: points[i],
        distance: calculateDistance(points[i - 1], points[i])
      });
    }
    return lines;
  }, [points, calculateDistance]);

  // Open Street View with markings
  const openStreetViewWithMarkings = useCallback((centerPoint?: Point) => {
    if (points.length === 0) return;

    const center = centerPoint || {
      id: 'center-point',
      lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
      lng: points.reduce((sum, p) => sum + p.lng, 0) / points.length,
      x: 0,
      y: 0
    };

    setStreetViewCenterPoint(center);
    setShowStreetViewDialog(true);
  }, [points]);

  // Generate street view URL
  const getStreetViewUrl = (point: Point) => {
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${point.lat},${point.lng}`;
  };

  return (
    <>
      {/* Tool Controls */}
      {isActive && (
        <div
          ref={containerRef}
          className="fixed animate-in slide-in-from-left-4 duration-300 layout-transition"
          style={{
            left: `${sidebarWidth}px`,
            top: stackedTop,
            width: '320px',
            maxHeight: 'calc(100vh - 160px)',
            zIndex: Z_INDEX.TOOLBOX_DISTANCE,
            transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1), top 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "left, top, transform"
          }}
        >
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">
                  Distance Measurement V2
                </h3>
                <button
                  onClick={onToggle}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-w-[80px] h-8 flex items-center justify-center ${
                    isActive
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {isActive ? "Stop" : "Start"}
                </button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">

            {isActive && (
              <div className="text-xs text-blue-600 mb-3">
                ✨ V2: Using Google Maps native markers - Click anywhere to add points (no restrictions)
              </div>
            )}

            <div className="flex items-center space-x-2 mb-3">
              <div className="relative">
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as "km" | "miles")}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 pr-8 bg-white hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all duration-200 cursor-pointer shadow-sm h-9"
                >
                  <option value="km">📏 Kilometers</option>
                  <option value="miles">📐 Miles</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <label className="flex items-center space-x-1 text-xs">
                <input
                  type="checkbox"
                  checked={showStreetView}
                  onChange={(e) => setShowStreetView(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Street View</span>
              </label>

              {/* Immersive Street View Button */}
              {points.length > 0 && (
                <button
                  onClick={() => openStreetViewWithMarkings()}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg h-9 min-w-[120px] justify-center"
                  title="Open immersive Street View with all distance markings"
                >
                  <span>🌐</span>
                  <span>360° View</span>
                </button>
              )}
            </div>

            {/* Measurement Name Input */}
            <div className="mb-3">
              <input
                type="text"
                value={measurementName}
                onChange={(e) => setMeasurementName(e.target.value)}
                placeholder={`Measurement ${savedMeasurements.length + 1}`}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 mb-2 h-9"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 mb-3">
              <div className="flex space-x-2">
                <button
                  onClick={saveMeasurement}
                  disabled={points.length < 2}
                  className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-9 flex items-center justify-center"
                >
                  💾 Save
                </button>
                <button
                  onClick={removeLastPoint}
                  disabled={points.length === 0}
                  className="flex-1 px-3 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-9 flex items-center justify-center"
                >
                  ↩️ Undo
                </button>
                <button
                  onClick={clearPoints}
                  disabled={points.length === 0}
                  className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-9 flex items-center justify-center"
                >
                  🗑️ Clear
                </button>
              </div>
            </div>

            <div className="mb-3">
              <button
                onClick={() => setShowMeasurementTable(!showMeasurementTable)}
                className="flex items-center justify-between w-full text-xs text-gray-700 hover:text-gray-900 font-medium"
              >
                <span>📊 Measurement Table</span>
                <span
                  className={`transition-transform duration-200 ${
                    showMeasurementTable ? "rotate-90" : ""
                  }`}
                >
                  ▶
                </span>
              </button>

              {showMeasurementTable && points.length > 0 && (
                <div className="mt-2 bg-gray-50 rounded p-2 max-h-32 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-600">
                        <th className="text-left">Point</th>
                        <th className="text-right">Distance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {points.map((point, index) => {
                        const segmentDistance =
                          index > 0
                            ? calculateDistance(points[index - 1], point)
                            : 0;
                        const cumulativeDistanceAtPoint = points
                          .slice(0, index + 1)
                          .reduce((total, _, i) => {
                            if (i === 0) return 0;
                            return (
                              total +
                              calculateDistance(points[i - 1], points[i])
                            );
                          }, 0);

                        return (
                          <tr
                            key={point.id}
                            className="border-t border-gray-200"
                          >
                            <td className="py-1">
                              <div className="flex items-center space-x-1">
                                <span className="w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                  {index + 1}
                                </span>
                                {showStreetView && (
                                  <a
                                    href={getStreetViewUrl(point)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700"
                                    title="Street View"
                                  >
                                    📍
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="py-1 text-right">
                              <div className="text-gray-900 font-medium">
                                {cumulativeDistanceAtPoint.toFixed(2)} {unit}
                              </div>
                              {index > 0 && (
                                <div className="text-gray-500">
                                  +{segmentDistance.toFixed(2)}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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
        </div>
      )}

      {/* Immersive Street View Dialog */}
      {streetViewCenterPoint && (
        <StreetViewWithMarkings
          isOpen={showStreetViewDialog}
          onClose={() => setShowStreetViewDialog(false)}
          centerPoint={streetViewCenterPoint}
          points={points}
          lines={distanceLines}
          title="Distance Measurement V2 - Street View"
        />
      )}
    </>
  );
};

export default DistanceMeasurementToolV2;