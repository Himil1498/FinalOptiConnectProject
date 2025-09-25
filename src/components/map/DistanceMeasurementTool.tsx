import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { validateGeofence } from "../../utils/unifiedGeofencing";
import { Z_INDEX } from "../../constants/zIndex";
import { TOOLBOX_POSITIONING } from "../../constants/layout";
import StandardDialog, { ConfirmDialog } from "../common/StandardDialog";

// Hook to detect sidebar state and calculate positioning
const useSidebarAwarePositioning = () => {
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
          const isCollapsed = rect.width < 80;
          setSidebarCollapsed(isCollapsed);
          setSidebarWidth(rect.width + 16);
        } else {
          setSidebarWidth(16);
          setSidebarCollapsed(false);
        }
      } else {
        setSidebarWidth(16);
        setSidebarCollapsed(false);
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
      attributeFilter: [
        "class",
        "style",
        "data-collapsed",
        "data-expanded",
        "data-state"
      ]
    });

    window.addEventListener("resize", checkSidebarState);

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(
          '[class*="sidebar"], [class*="menu"], [class*="nav"], button'
        ) ||
        target.getAttribute("aria-expanded") !== null
      ) {
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

interface SavedMeasurement {
  id: string;
  name: string;
  points: Point[];
  totalDistance: number;
  unit: "km" | "miles";
  createdAt: Date;
  notes?: string;
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

// Enhanced Street View Modal Component with markings overlay
const EnhancedStreetViewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  centerPoint: Point;
  points: Point[];
  lines: Array<{ start: Point; end: Point; distance: number }>;
  title: string;
}> = ({ isOpen, onClose, centerPoint, points, lines, title }) => {
  const streetViewRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!isOpen || !streetViewRef.current || !centerPoint) return;

    // Check if Google Maps is loaded
    if (!window.google || !window.google.maps || !window.google.maps.StreetViewPanorama) {
      console.error('Google Maps Street View API not loaded');
      return;
    }

    try {
      // Initialize Street View
      const panorama = new google.maps.StreetViewPanorama(streetViewRef.current, {
        position: { lat: centerPoint.lat, lng: centerPoint.lng },
        pov: { heading: 0, pitch: 0 },
        zoom: 1,
        motionTracking: false,
        motionTrackingControl: false,
        addressControl: true,
        clickToGo: true,
        disableDefaultUI: false,
        showRoadLabels: true
      });

      panoramaRef.current = panorama;

      // Add status listener to check if Street View is available
      panorama.addListener('status_changed', () => {
        const status = panorama.getStatus();
        if (status !== google.maps.StreetViewStatus.OK) {
          console.warn('Street View not available for this location:', centerPoint);
        }
      });

    // Clear existing overlays
    markersRef.current.forEach(marker => marker.setMap(null));
    polylinesRef.current.forEach(polyline => polyline.setMap(null));
    markersRef.current = [];
    polylinesRef.current = [];

    // Add measurement point markers to street view
    points.forEach((point, index) => {
      const marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: panorama,
        title: `Measurement Point ${index + 1}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: index === 0 ? '#10B981' : index === points.length - 1 ? '#EF4444' : '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3
        },
        label: {
          text: (index + 1).toString(),
          color: '#FFFFFF',
          fontSize: '12px',
          fontWeight: 'bold'
        }
      });

      markersRef.current.push(marker);
    });

    // Add measurement lines to street view
    lines.forEach(line => {
      const polyline = new google.maps.Polyline({
        path: [
          { lat: line.start.lat, lng: line.start.lng },
          { lat: line.end.lat, lng: line.end.lng }
        ],
        geodesic: true,
        strokeColor: '#F59E0B',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: panorama as any
      });

      polylinesRef.current.push(polyline);
    });

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      polylinesRef.current.forEach(polyline => polyline.setMap(null));
      markersRef.current = [];
      polylinesRef.current = [];
    };
    } catch (error) {
      console.error('Error initializing Street View:', error);
    }
  }, [isOpen, centerPoint, points, lines]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-[90%] h-[90%] max-w-6xl max-h-5xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="relative h-full">
          <div ref={streetViewRef} className="w-full h-full" />
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
            <h4 className="font-semibold text-sm text-gray-900 mb-2">Measurement Info</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Points: {points.length}</div>
              <div>Lines: {lines.length}</div>
              <div>Center: {centerPoint.lat.toFixed(6)}, {centerPoint.lng.toFixed(6)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DistanceMeasurementTool: React.FC<DistanceMeasurementToolProps> = ({
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
  const [showStreetView, setShowStreetView] = useState(true); // Default enabled
  const [showMeasurementTable, setShowMeasurementTable] = useState(true);
  const [savedMeasurements, setSavedMeasurements] = useState<SavedMeasurement[]>([]);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [measurementName, setMeasurementName] = useState("");
  const [measurementNotes, setMeasurementNotes] = useState("");
  const [editingMeasurementId, setEditingMeasurementId] = useState<string | null>(null);
  const [showSavedTable, setShowSavedTable] = useState(false);
  const [showStreetViewModal, setShowStreetViewModal] = useState(false);
  const [streetViewCenterPoint, setStreetViewCenterPoint] = useState<Point | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMeasurementId, setDeletingMeasurementId] = useState<string | null>(null);
  const { sidebarWidth } = useSidebarAwarePositioning();

  // Notify parent about data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(points.length > 0 || savedMeasurements.length > 0);
    }
  }, [points.length, savedMeasurements.length, onDataChange]);

  // Convert lat/lng to pixel coordinates
  const latLngToPixel = useCallback(
    (lat: number, lng: number) => {
      if (map) {
        const projection = map.getProjection();
        if (projection) {
          const bounds = map.getBounds();
          const mapDiv = map.getDiv();
          if (bounds && mapDiv) {
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            const mapRect = mapDiv.getBoundingClientRect();

            const x =
              ((lng - sw.lng()) / (ne.lng() - sw.lng())) * mapRect.width;
            const y =
              ((ne.lat() - lat) / (ne.lat() - sw.lat())) * mapRect.height;

            return { x, y };
          }
        }
      }

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
        google.maps.event.trigger(map, "resize");
        setTimeout(updatePixelCoordinates, 100);
      };

      window.addEventListener("resize", resizeHandler);

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

  // Convert pixel coordinates to lat/lng
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

  // Calculate cumulative distance
  const cumulativeDistance = useMemo(() => {
    if (points.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += calculateDistance(points[i - 1], points[i]);
    }
    return total;
  }, [points, calculateDistance]);

  // Handle Google Maps click events
  useEffect(() => {
    if (!map || !isActive) return;

    const handleGoogleMapClick = async (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;

      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      const validation = await validateGeofence(lat, lng);
      if (!validation.isValid) {
        const notificationEvent = new CustomEvent("showNotification", {
          detail: {
            type: "error",
            title: "Access Restricted",
            message: validation.message || "Tools can only be used within India boundaries.",
            duration: 5000
          }
        });
        window.dispatchEvent(notificationEvent);
        return; // BLOCK further execution
      }

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
    const zoomListener = map.addListener("zoom_changed", updatePixelCoordinates);
    const dragListener = map.addListener("dragend", updatePixelCoordinates);
    const resizeListener = map.addListener("resize", updatePixelCoordinates);

    return () => {
      if (clickListener) clickListener.remove();
      if (zoomListener) zoomListener.remove();
      if (dragListener) dragListener.remove();
      if (resizeListener) resizeListener.remove();
    };
  }, [map, isActive, latLngToPixel, updatePixelCoordinates]);

  // Handle map click to add points
  const handleMapClick = useCallback(
    async (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isActive) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const { lat, lng } = pixelToLatLng(x, y);

      const validation = await validateGeofence(lat, lng);
      if (!validation.isValid) {
        const notificationEvent = new CustomEvent("showNotification", {
          detail: {
            type: "error",
            title: "Access Restricted",
            message: validation.message || "Tools can only be used within India boundaries.",
            duration: 5000
          }
        });
        window.dispatchEvent(notificationEvent);
        return; // BLOCK further execution
      }

      const newPoint: Point = {
        id: `point-${Date.now()}`,
        lat,
        lng,
        x,
        y
      };

      setPoints((prev) => [...prev, newPoint]);
    },
    [isActive, pixelToLatLng]
  );

  // Clear all points
  const clearPoints = () => {
    setPoints([]);
    if (savedMeasurements.length > 0 && !showSavedTable) {
      setShowSavedTable(true);
    }
  };

  // Remove last point
  const removeLastPoint = () => {
    setPoints((prev) => prev.slice(0, -1));
  };

  // Open street view modal with enhanced markings
  const openStreetView = useCallback((centerPoint: Point) => {
    setStreetViewCenterPoint(centerPoint);
    setShowStreetViewModal(true);
  }, []);

  // Generate lines for street view
  const generateLinesForStreetView = useMemo(() => {
    if (points.length < 2) return [];

    const lines = [];
    for (let i = 0; i < points.length - 1; i++) {
      const distance = calculateDistance(points[i], points[i + 1]);
      lines.push({
        start: points[i],
        end: points[i + 1],
        distance: distance * 1000
      });
    }
    return lines;
  }, [points, calculateDistance]);

  // Save current measurement
  const saveMeasurement = useCallback(() => {
    if (points.length < 2) {
      const event = new CustomEvent("showNotification", {
        detail: {
          type: "warning",
          title: "Insufficient Data",
          message: "Please create a measurement with at least 2 points before saving.",
          duration: 5000
        }
      });
      window.dispatchEvent(event);
      return;
    }

    if (!measurementName.trim()) {
      const event = new CustomEvent("showNotification", {
        detail: {
          type: "warning",
          title: "Name Required",
          message: "Please enter a name for the measurement.",
          duration: 5000
        }
      });
      window.dispatchEvent(event);
      return;
    }

    const savedMeasurement: SavedMeasurement = {
      id: editingMeasurementId || `measurement-${Date.now()}`,
      name: measurementName,
      points: [...points],
      totalDistance: cumulativeDistance,
      unit,
      createdAt: editingMeasurementId
        ? savedMeasurements.find((m) => m.id === editingMeasurementId)?.createdAt || new Date()
        : new Date(),
      notes: measurementNotes
    };

    if (editingMeasurementId) {
      setSavedMeasurements((prev) =>
        prev.map((m) => (m.id === editingMeasurementId ? savedMeasurement : m))
      );
    } else {
      setSavedMeasurements((prev) => [...prev, savedMeasurement]);
    }

    setShowSaveDialog(false);
    setMeasurementName("");
    setMeasurementNotes("");
    setEditingMeasurementId(null);

    const event = new CustomEvent("showNotification", {
      detail: {
        type: "success",
        title: editingMeasurementId ? "Measurement Updated" : "Measurement Saved",
        message: `Distance measurement "${savedMeasurement.name}" has been ${
          editingMeasurementId ? "updated" : "saved"
        } successfully.`,
        duration: 3000
      }
    });
    window.dispatchEvent(event);
  }, [points, cumulativeDistance, unit, measurementName, measurementNotes, editingMeasurementId, savedMeasurements]);

  // Load saved measurement
  const loadMeasurement = useCallback((measurement: SavedMeasurement) => {
    setPoints(measurement.points);
    setUnit(measurement.unit);
    setSelectedMeasurementId(measurement.id);

    const event = new CustomEvent("showNotification", {
      detail: {
        type: "success",
        title: "Measurement Loaded",
        message: `Distance measurement "${measurement.name}" loaded successfully.`,
        duration: 3000
      }
    });
    window.dispatchEvent(event);
  }, []);

  // Edit saved measurement
  const editMeasurement = useCallback((measurement: SavedMeasurement) => {
    setMeasurementName(measurement.name);
    setMeasurementNotes(measurement.notes || "");
    setEditingMeasurementId(measurement.id);
    setShowSaveDialog(true);
  }, []);

  // Show delete confirmation
  const showDeleteConfirmation = useCallback((measurementId: string) => {
    setDeletingMeasurementId(measurementId);
    setShowDeleteConfirm(true);
  }, []);

  // Delete saved measurement
  const deleteMeasurement = useCallback(() => {
    if (!deletingMeasurementId) return;

    const measurement = savedMeasurements.find((m) => m.id === deletingMeasurementId);
    if (!measurement) return;

    setSavedMeasurements((prev) => prev.filter((m) => m.id !== deletingMeasurementId));

    if (selectedMeasurementId === deletingMeasurementId) {
      setSelectedMeasurementId(null);
      setPoints([]);
    }

    setShowDeleteConfirm(false);
    setDeletingMeasurementId(null);

    const event = new CustomEvent("showNotification", {
      detail: {
        type: "success",
        title: "Measurement Deleted",
        message: `Distance measurement "${measurement.name}" has been deleted and removed from map.`,
        duration: 3000
      }
    });
    window.dispatchEvent(event);
  }, [savedMeasurements, selectedMeasurementId, deletingMeasurementId]);

  return (
    <>
      {/* Tool Controls */}
      {isActive && (
        <div
          className="fixed animate-in slide-in-from-left-4 duration-300 layout-transition"
          style={{
            top: `${TOOLBOX_POSITIONING.top}px`,
            bottom: `${TOOLBOX_POSITIONING.bottom}px`,
            left: `${sidebarWidth + TOOLBOX_POSITIONING.padding}px`,
            width: `${TOOLBOX_POSITIONING.width}px`,
            zIndex: 9998,
            transition:
              "left 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "left, transform"
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl border-2 border-blue-200 h-full flex flex-col">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">📏</span>
                <h3 className="text-sm font-bold text-gray-900">
                  Distance Measurement
                </h3>
                {isActive && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 animate-pulse">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                    Active
                  </span>
                )}
              </div>
              <button
                onClick={onToggle}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
                  isActive
                    ? "bg-red-500 text-white hover:bg-red-600 hover:scale-105"
                    : "bg-blue-500 text-white hover:bg-blue-600 hover:scale-105"
                }`}
              >
                {isActive ? "Stop" : "Start"}
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3 toolbox-scrollbar">
              {isActive && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                  <div className="text-xs text-blue-700 font-medium flex items-center">
                    <span className="mr-1">📍</span>
                    Click on the map to add measurement points
                  </div>
                  {points.length === 0 && (
                    <div className="text-xs text-blue-600 mt-1 opacity-75">
                      Start by clicking your first point on the map
                    </div>
                  )}
                  {points.length === 1 && (
                    <div className="text-xs text-blue-600 mt-1 opacity-75">
                      Click your second point to measure distance
                    </div>
                  )}
                  {points.length > 1 && (
                    <div className="text-xs text-blue-600 mt-1 opacity-75">
                      Continue adding points to extend your measurement
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as "km" | "miles")}
                    className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="km">📏 Kilometers</option>
                    <option value="miles">📏 Miles</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Street View</label>
                  <label className="flex items-center space-x-2 bg-green-50 px-2 py-1.5 rounded-lg border border-green-200 hover:bg-green-100 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={showStreetView}
                      onChange={(e) => setShowStreetView(e.target.checked)}
                      className="w-3 h-3 text-green-600 focus:ring-green-500 focus:ring-1 rounded"
                    />
                    <span className="text-xs font-medium text-green-700">📷 Enabled</span>
                  </label>
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
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openStreetView(point);
                                      }}
                                      className="text-blue-500 hover:text-blue-700 cursor-pointer p-1 rounded hover:bg-blue-50 transition-all animate-pulse"
                                      title="Open Street View with Markings"
                                    >
                                      📷
                                    </button>
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

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={removeLastPoint}
                  disabled={points.length === 0}
                  className="flex items-center justify-center px-3 py-2 text-xs bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md hover:scale-105 disabled:hover:scale-100"
                  title={`Remove last point${points.length > 0 ? ` (${points.length})` : ''}`}
                >
                  <span className="mr-1">↩️</span>
                  Undo Last
                </button>
                <button
                  onClick={clearPoints}
                  disabled={points.length === 0}
                  className="flex items-center justify-center px-3 py-2 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md hover:scale-105 disabled:hover:scale-100"
                  title={`Clear all points${points.length > 0 ? ` (${points.length})` : ''}`}
                >
                  <span className="mr-1">🗑️</span>
                  Clear All
                </button>
              </div>

              {/* Save/Load Buttons */}
              <div className="flex space-x-2 mt-2">
                {points.length > 1 && (
                  <button
                    onClick={() => setShowSaveDialog(true)}
                    className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Save
                  </button>
                )}
                {savedMeasurements.length > 0 && (
                  <button
                    onClick={() => setShowSavedTable(!showSavedTable)}
                    className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                      showSavedTable
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-purple-500 text-white hover:bg-purple-600'
                    }`}
                  >
                    {showSavedTable ? 'Hide Saved' : 'View Saved'} ({savedMeasurements.length})
                  </button>
                )}
              </div>

              {points.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700 flex items-center">
                        <span className="mr-1">📍</span>
                        Points: {points.length}
                      </span>
                      {points.length > 1 && (
                        <span className="text-xs font-medium text-gray-700 flex items-center">
                          <span className="mr-1">📏</span>
                          Segments: {points.length - 1}
                        </span>
                      )}
                    </div>
                    {points.length > 1 && (
                      <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                        {cumulativeDistance.toFixed(2)} {unit}
                      </div>
                    )}
                    {points.length === 1 && (
                      <div className="text-sm text-gray-500 italic">
                        Add another point to measure distance
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Saved Measurements */}
              {savedMeasurements.length > 0 && showSavedTable && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between w-full text-xs text-gray-700 font-bold mb-3">
                    <span className="flex items-center">
                      <span className="mr-1">📏</span>
                      <span>Saved Measurements ({savedMeasurements.length})</span>
                    </span>
                    <button
                      onClick={() => setShowSavedTable(false)}
                      className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-all"
                      title="Hide saved measurements"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto border border-gray-200">
                    <div className="space-y-2">
                      {savedMeasurements.map((measurement) => (
                        <div
                          key={measurement.id}
                          className={`bg-white rounded-lg border-2 p-3 transition-all hover:shadow-md ${
                            selectedMeasurementId === measurement.id
                              ? "border-blue-400 shadow-sm bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <button
                              onClick={() => loadMeasurement(measurement)}
                              className="flex-1 text-left hover:bg-gray-50 p-1 rounded transition-colors"
                            >
                              <span className="font-semibold text-xs truncate block text-gray-900" title={measurement.name}>
                                {measurement.name}
                              </span>
                              <div className="text-xs text-gray-600 mt-1 flex items-center space-x-2">
                                <span className="font-medium">{measurement.totalDistance.toFixed(2)} {measurement.unit}</span>
                                <span>•</span>
                                <span>{measurement.points.length} points</span>
                              </div>
                            </button>
                            <div className="flex space-x-1 ml-2">
                              <button
                                onClick={() => editMeasurement(measurement)}
                                className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit measurement"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => showDeleteConfirmation(measurement.id)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete measurement"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          {selectedMeasurementId === measurement.id && (
                            <div className="mt-3 pt-2 border-t border-blue-200 bg-blue-25">
                              <div className="text-xs text-gray-700 space-y-1">
                                <div className="flex justify-between">
                                  <span className="font-medium">Distance:</span>
                                  <span className="text-blue-700 font-semibold">{measurement.totalDistance.toFixed(2)} {measurement.unit}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">Points:</span>
                                  <span className="text-gray-900">{measurement.points.length}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">Created:</span>
                                  <span className="text-gray-900">{measurement.createdAt.toLocaleDateString()}</span>
                                </div>
                                {measurement.notes && (
                                  <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                                    <span className="font-medium text-yellow-800">Notes:</span>
                                    <div className="text-yellow-700 italic mt-1">{measurement.notes}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
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
          {/* Render points with camera icons */}
          {points.map((point, index) => (
            <div key={point.id}>
              {/* Point marker */}
              <div
                className={`absolute w-5 h-5 border-3 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 ${
                  index === 0 ? 'bg-green-500' :
                  index === points.length - 1 ? 'bg-red-500' :
                  'bg-blue-500'
                }`}
                style={{
                  left: point.x,
                  top: point.y
                }}
              >
                <div className={`absolute -top-7 left-1/2 transform -translate-x-1/2 text-xs font-bold px-1.5 py-0.5 rounded shadow-md ${
                  index === 0 ? 'text-green-700 bg-green-100' :
                  index === points.length - 1 ? 'text-red-700 bg-red-100' :
                  'text-blue-700 bg-blue-100'
                }`}>
                  {index === 0 ? 'START' : index === points.length - 1 ? 'END' : index + 1}
                </div>

                {/* Camera icon overlay */}
                {showStreetView && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openStreetView(point);
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-all shadow-md hover:scale-110 animate-pulse"
                    title="Open Street View"
                  >
                    📷
                  </button>
                )}
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
                    stroke="#F59E0B"
                    strokeWidth="4"
                    strokeDasharray="10,5"
                  />

                  {/* Distance label */}
                  <text
                    x={(point.x + points[index + 1].x) / 2}
                    y={(point.y + points[index + 1].y) / 2 - 8}
                    fill="#ef4444"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    <tspan
                      className="bg-white px-1 rounded shadow"
                      style={{ backgroundColor: "white", padding: "3px" }}
                    >
                      {calculateDistance(point, points[index + 1]).toFixed(2)}{" "}
                      {unit}
                    </tspan>
                  </text>
                </svg>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Points visualization overlay for Google Maps */}
      {isActive && map && points.length > 0 && (
        <div
          className="absolute inset-0"
          style={{ zIndex: 1, pointerEvents: "none" }}
        >
          {/* Render points with camera icons */}
          {points.map((point, index) => (
            <div key={point.id}>
              {/* Point marker */}
              <div
                className={`absolute w-5 h-5 border-3 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 ${
                  index === 0 ? 'bg-green-500' :
                  index === points.length - 1 ? 'bg-red-500' :
                  'bg-blue-500'
                }`}
                style={{
                  left: point.x,
                  top: point.y,
                  pointerEvents: 'auto'
                }}
              >
                <div className={`absolute -top-7 left-1/2 transform -translate-x-1/2 text-xs font-bold px-1.5 py-0.5 rounded shadow-md ${
                  index === 0 ? 'text-green-700 bg-green-100' :
                  index === points.length - 1 ? 'text-red-700 bg-red-100' :
                  'text-blue-700 bg-blue-100'
                }`}>
                  {index === 0 ? 'START' : index === points.length - 1 ? 'END' : index + 1}
                </div>

                {/* Camera icon overlay */}
                {showStreetView && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openStreetView(point);
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-all shadow-md hover:scale-110 animate-pulse"
                    title="Open Street View"
                    style={{ pointerEvents: 'auto' }}
                  >
                    📷
                  </button>
                )}
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
                    stroke="#F59E0B"
                    strokeWidth="4"
                    strokeDasharray="10,5"
                  />

                  {/* Distance label */}
                  <text
                    x={(point.x + points[index + 1].x) / 2}
                    y={(point.y + points[index + 1].y) / 2 - 8}
                    fill="#ef4444"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    <tspan
                      className="bg-white px-1 rounded shadow"
                      style={{ backgroundColor: "white", padding: "3px" }}
                    >
                      {calculateDistance(point, points[index + 1]).toFixed(2)}{" "}
                      {unit}
                    </tspan>
                  </text>
                </svg>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Overlay for multi-tool click handling */}
      {isActive && (
        <div
          className="absolute inset-0 cursor-crosshair"
          style={{
            zIndex: Z_INDEX.MAP_OVERLAY,
            pointerEvents: (isPrimaryTool || !multiToolMode) ? 'auto' : 'none'
          }}
          onClick={(event: React.MouseEvent<HTMLDivElement>) => {
            if (!isActive) return;

            const rect = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const { lat, lng } = pixelToLatLng(x, y);

            const newPoint: Point = {
              id: `point-${Date.now()}`,
              lat,
              lng,
              x,
              y
            };

            setPoints(prev => [...prev, newPoint]);
          }}
        />
      )}

      {/* Save Dialog */}
      <StandardDialog
        isOpen={showSaveDialog}
        onClose={() => {
          setShowSaveDialog(false);
          setMeasurementName("");
          setMeasurementNotes("");
          setEditingMeasurementId(null);
        }}
        title={`${editingMeasurementId ? "Edit" : "Save"} Distance Measurement`}
        size="md"
      >
        <div className="p-6 bg-white">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Measurement Name
              </label>
              <input
                type="text"
                value={measurementName}
                onChange={(e) => setMeasurementName(e.target.value)}
                placeholder="Enter measurement name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={measurementNotes}
                onChange={(e) => setMeasurementNotes(e.target.value)}
                placeholder="Add description or notes"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white resize-none"
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">Measurement Summary</h4>
              <div className="text-sm text-blue-800 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Points:</span>
                  <span className="text-blue-900 font-semibold">{points.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Distance:</span>
                  <span className="text-blue-900 font-semibold">{cumulativeDistance.toFixed(2)} {unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Unit:</span>
                  <span className="text-blue-900 font-semibold">{unit === "km" ? "Kilometers" : "Miles"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setMeasurementName("");
                setMeasurementNotes("");
                setEditingMeasurementId(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={saveMeasurement}
              disabled={!measurementName.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {editingMeasurementId ? "Update" : "Save"} Measurement
            </button>
          </div>
        </div>
      </StandardDialog>

      {/* Enhanced Street View Modal */}
      {streetViewCenterPoint && (
        <EnhancedStreetViewModal
          isOpen={showStreetViewModal}
          onClose={() => setShowStreetViewModal(false)}
          centerPoint={streetViewCenterPoint}
          points={points}
          lines={generateLinesForStreetView}
          title="Distance Measurement - Street View"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingMeasurementId(null);
        }}
        onConfirm={deleteMeasurement}
        title="Delete Measurement"
        message={`Are you sure you want to delete the measurement "${deletingMeasurementId ? savedMeasurements.find(m => m.id === deletingMeasurementId)?.name || 'Unknown' : 'Unknown'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />
    </>
  );
};

export default DistanceMeasurementTool;