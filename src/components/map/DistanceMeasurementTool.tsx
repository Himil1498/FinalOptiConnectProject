import React, { useState, useCallback, useMemo, useEffect } from "react";
import { validateIndiaGeofence } from "../../utils/indiaGeofencing";

// Hook to detect sidebar state and calculate positioning
const useSidebarAwarePositioning = () => {
  const [sidebarWidth, setSidebarWidth] = useState(280); // Default sidebar width
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const checkSidebarState = () => {
      // Try multiple selectors to find the sidebar
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
          // Check if sidebar is collapsed (small width)
          const isCollapsed = rect.width < 80;
          setSidebarCollapsed(isCollapsed);

          // Set width with proper padding
          setSidebarWidth(rect.width + 16);
        } else {
          // Sidebar is hidden
          setSidebarWidth(16);
          setSidebarCollapsed(false);
        }
      } else {
        // No sidebar found
        setSidebarWidth(16);
        setSidebarCollapsed(false);
      }
    };

    // Initial check immediately and with backup delay
    checkSidebarState();
    setTimeout(checkSidebarState, 10);

    // Watch for layout changes with RAF for perfect animation sync
    let rafId: number;
    const observer = new MutationObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(checkSidebarState);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "class",
        "style",
        "data-collapsed",
        "data-expanded",
        "data-state"
      ]
    });

    // Watch for window resize and click events for instant sidebar toggle detection
    window.addEventListener("resize", checkSidebarState);

    // Listen for click events that might toggle sidebar
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(
          '[class*="sidebar"], [class*="menu"], [class*="nav"], button'
        ) ||
        target.getAttribute("aria-expanded") !== null
      ) {
        // Use RAF for perfect timing sync
        requestAnimationFrame(checkSidebarState);
        requestAnimationFrame(() => requestAnimationFrame(checkSidebarState));
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", checkSidebarState);
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return { sidebarWidth, sidebarCollapsed };
};

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
  mapHeight
}) => {
  const [points, setPoints] = useState<Point[]>([]);
  const [unit, setUnit] = useState<"km" | "miles">("km");
  const [showStreetView, setShowStreetView] = useState(false);
  const [showMeasurementTable, setShowMeasurementTable] = useState(true);
  const { sidebarWidth, sidebarCollapsed } = useSidebarAwarePositioning();

  // Convert lat/lng to pixel coordinates
  const latLngToPixel = useCallback(
    (lat: number, lng: number) => {
      if (map) {
        // Use Google Maps projection for accuracy
        const projection = map.getProjection();
        if (projection) {
          const bounds = map.getBounds();
          const mapDiv = map.getDiv();
          if (bounds && mapDiv) {
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            const mapRect = mapDiv.getBoundingClientRect();

            // Calculate pixel position based on current map bounds
            const x =
              ((lng - sw.lng()) / (ne.lng() - sw.lng())) * mapRect.width;
            const y =
              ((ne.lat() - lat) / (ne.lat() - sw.lat())) * mapRect.height;

            return { x, y };
          }
        }
      }

      // Fallback to India bounds approximation for non-map mode
      const x = ((lng - 68.1) / (97.25 - 68.1)) * mapWidth;
      const y = ((37.6 - lat) / (37.6 - 6.4)) * mapHeight;
      return { x, y };
    },
    [map, mapWidth, mapHeight]
  );

  // Shared function to update pixel coordinates
  const updatePixelCoordinates = useCallback(() => {
    setPoints((prevPoints) =>
      prevPoints.map((point) => {
        const { x, y } = latLngToPixel(point.lat, point.lng);
        return { ...point, x, y };
      })
    );
  }, [latLngToPixel]);

  // Handle map resize when location changes
  useEffect(() => {
    if (map) {
      const resizeHandler = () => {
        // Trigger resize event to Google Maps
        google.maps.event.trigger(map, "resize");
        // Update pixel coordinates after resize
        setTimeout(updatePixelCoordinates, 100);
      };

      // Listen for window resize
      window.addEventListener("resize", resizeHandler);

      // Listen for custom map events
      const mapResizeListener = map.addListener(
        "bounds_changed",
        updatePixelCoordinates
      );

      return () => {
        window.removeEventListener("resize", resizeHandler);
        if (mapResizeListener) mapResizeListener.remove();
      };
    }
  }, [map, updatePixelCoordinates]);

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
  const calculateDistance = useCallback(
    (point1: Point, point2: Point) => {
      const R = unit === "km" ? 6371 : 3959; // Earth radius in km or miles
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

  // Update pixel coordinates when map changes (zoom, pan)
  useEffect(() => {
    if (!map || !isActive) return;

    const handleGoogleMapClick = (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;

      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      // Validate coordinates are within India
      const validation = validateIndiaGeofence(lat, lng);
      if (!validation.isValid) {
        const notificationEvent = new CustomEvent("showNotification", {
          detail: {
            type: "warning",
            title: "Location Outside India Boundaries",
            message: validation.message,
            duration: 5000
          }
        });
        window.dispatchEvent(notificationEvent);
        // Continue with point creation (don't return)
      }

      // Convert lat/lng to pixel coordinates for display
      const { x, y } = latLngToPixel(lat, lng);

      const newPoint: Point = {
        id: `point-${Date.now()}-${Math.random()}`,
        lat,
        lng,
        x,
        y
      };

      setPoints((prev) => [...prev, newPoint]);
    };

    const clickListener = map.addListener("click", handleGoogleMapClick);
    const zoomListener = map.addListener(
      "zoom_changed",
      updatePixelCoordinates
    );
    const dragListener = map.addListener("dragend", updatePixelCoordinates);
    const resizeListener = map.addListener("resize", updatePixelCoordinates);

    return () => {
      if (clickListener) clickListener.remove();
      if (zoomListener) zoomListener.remove();
      if (dragListener) dragListener.remove();
      if (resizeListener) resizeListener.remove();
    };
  }, [map, isActive, latLngToPixel, updatePixelCoordinates]);

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
        // Show warning but continue
        const event = new CustomEvent("showNotification", {
          detail: {
            type: "warning",
            title: "Location Outside India Boundaries",
            message: validation.message,
            duration: 5000
          }
        });
        window.dispatchEvent(event);

        if (validation.suggestedAction) {
          setTimeout(() => {
            const suggestionEvent = new CustomEvent("showNotification", {
              detail: {
                type: "info",
                title: "Suggestion",
                message: validation.suggestedAction,
                duration: 8000
              }
            });
            window.dispatchEvent(suggestionEvent);
          }, 1000);
        }
        // Continue with point creation (don't return)
      }

      const newPoint: Point = {
        id: `point-${Date.now()}`,
        lat,
        lng,
        x,
        y
      };

      setPoints((prev) => [...prev, newPoint]);

      // Show success message for locations near border
      if (validation.message && validation.isValid) {
        const warningEvent = new CustomEvent("showNotification", {
          detail: {
            type: "warning",
            title: "Border Location",
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
    setPoints((prev) => prev.slice(0, -1));
  };

  // Generate street view URL
  const getStreetViewUrl = (point: Point) => {
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${point.lat},${point.lng}`;
  };

  return (
    <>
      {/* Tool Controls - Dynamic positioning based on sidebar state */}
      {isActive && (
        <div
          className="fixed top-20 animate-in slide-in-from-left-4 duration-300 layout-transition"
          style={{
            left: `${sidebarWidth}px`,
            zIndex: 1050, // Higher than most sidebars
            transition:
              "left 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "left, transform"
          }}
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-3 max-w-xs border border-gray-200/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">
                Distance Measurement
              </h3>
              <button
                onClick={onToggle}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {isActive ? "Stop" : "Start"}
              </button>
            </div>

            {isActive && (
              <div className="text-xs text-blue-600 mb-3">
                Click on the map to add measurement points
              </div>
            )}

            <div className="flex items-center space-x-2 mb-3">
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as "km" | "miles")}
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
          style={{ zIndex: 1, pointerEvents: "auto" }}
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
                  top: point.y
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
                  style={{ width: "100%", height: "100%" }}
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
                      style={{ backgroundColor: "white", padding: "2px" }}
                    >
                      {calculateDistance(point, points[index + 1]).toFixed(2)}{" "}
                      {unit}
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
                    top: point.y
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
          style={{ zIndex: 1, pointerEvents: "none" }}
        >
          {/* Render points */}
          {points.map((point, index) => (
            <div key={point.id}>
              {/* Point marker */}
              <div
                className="absolute w-3 h-3 bg-red-500 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: point.x,
                  top: point.y
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
                  style={{ width: "100%", height: "100%" }}
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
                      style={{ backgroundColor: "white", padding: "2px" }}
                    >
                      {calculateDistance(point, points[index + 1]).toFixed(2)}{" "}
                      {unit}
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
                    pointerEvents: "auto"
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
    </>
  );
};

export default DistanceMeasurementTool;
