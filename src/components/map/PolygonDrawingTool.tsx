import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect
} from "react";
import {
  validateIndiaGeofencePrecise,
  validateMultipleCoordinatesPrecise,
  preloadIndiaBoundaryData
} from "../../utils/preciseIndiaGeofencing";
import { ConfirmDialog } from "../common/StandardDialog";
import { Z_INDEX } from "../../constants/zIndex";
import { LAYOUT_DIMENSIONS, TOOLBOX_POSITIONING } from "../../constants/layout";
import { useStackedToolboxPositioning } from '../../hooks/useStackedToolboxPositioning';
import { useDataStore } from "../../contexts/DataStoreContext";

// Sidebar-aware positioning hook for consistent UI layout
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

  return { sidebarWidth };
};

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
  onDataChange?: (hasData: boolean) => void;
  isPrimaryTool?: boolean;
  multiToolMode?: boolean;
}

const POLYGON_COLORS = [
  { name: "Red", value: "#ef4444", fill: "rgba(239, 68, 68, 0.3)" },
  { name: "Blue", value: "#3b82f6", fill: "rgba(59, 130, 246, 0.3)" },
  { name: "Green", value: "#10b981", fill: "rgba(16, 185, 129, 0.3)" },
  { name: "Purple", value: "#8b5cf6", fill: "rgba(139, 92, 246, 0.3)" },
  { name: "Orange", value: "#f97316", fill: "rgba(249, 115, 22, 0.3)" },
  { name: "Pink", value: "#ec4899", fill: "rgba(236, 72, 153, 0.3)" }
];

const PolygonDrawingTool: React.FC<PolygonDrawingToolProps> = ({
  isActive,
  onToggle,
  map,
  mapWidth,
  mapHeight,
  onDataChange,
  isPrimaryTool = false,
  multiToolMode = false
}) => {
  const [currentPolygon, setCurrentPolygon] = useState<Vertex[]>([]);
  const [savedPolygons, setSavedPolygons] = useState<Polygon[]>([]);
  const [selectedColor, setSelectedColor] = useState(POLYGON_COLORS[0]);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    polygonId: string | null;
    vertexId: string | null;
    offset: { x: number; y: number };
  }>({
    isDragging: false,
    polygonId: null,
    vertexId: null,
    offset: { x: 0, y: 0 }
  });
  const [editMode, setEditMode] = useState(false);
  const [showSavedPolygons, setShowSavedPolygons] = useState(true);
  const [newPolygonName, setNewPolygonName] = useState("");
  const [selectedPolygonId, setSelectedPolygonId] = useState<string | null>(
    null
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [editingPolygonId, setEditingPolygonId] = useState<string | null>(null);
  const [showSavedTable, setShowSavedTable] = useState(false);
  const [editingPolygon, setEditingPolygon] = useState<Polygon | null>(null);
  const [isDraggingVertex, setIsDraggingVertex] = useState(false);
  const { sidebarWidth } = useSidebarAwarePositioning();
  const { top: stackedTop, updateHeight } = useStackedToolboxPositioning('polygon-tool', isActive);

  // DataStore hook for saving to global data manager
  const { saveData } = useDataStore();
  const toolboxRef = useRef<HTMLDivElement>(null);

  // Notify parent when data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(currentPolygon.length > 0 || savedPolygons.length > 0);
    }
  }, [currentPolygon.length, savedPolygons.length, onDataChange]);

  // Measure and update height for stacking
  useEffect(() => {
    if (toolboxRef.current && isActive) {
      const resizeObserver = new ResizeObserver(() => {
        if (toolboxRef.current) {
          updateHeight(toolboxRef.current.offsetHeight);
        }
      });

      resizeObserver.observe(toolboxRef.current);

      // Initial measurement
      updateHeight(toolboxRef.current.offsetHeight);

      return () => resizeObserver.disconnect();
    }
  }, [isActive, updateHeight]);

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
      const xi =
        vertices[i].lng * 111320 * Math.cos((vertices[i].lat * Math.PI) / 180);
      const yi = vertices[i].lat * 110540;
      const xj =
        vertices[j].lng * 111320 * Math.cos((vertices[j].lat * Math.PI) / 180);
      const yj = vertices[j].lat * 110540;

      area += xi * yj - xj * yi;
    }

    return Math.abs(area) / (2 * 1000000); // Convert to km²
  }, []);

  // Calculate polygon perimeter
  const calculatePolygonPerimeter = useCallback(
    (vertices: Vertex[]) => {
      if (vertices.length < 2) return 0;

      let perimeter = 0;
      for (let i = 0; i < vertices.length; i++) {
        const nextIndex = (i + 1) % vertices.length;
        perimeter += calculateDistance(vertices[i], vertices[nextIndex]);
      }

      return perimeter;
    },
    [calculateDistance]
  );

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

  // Add vertex to editing polygon
  const addVertexToEditingPolygon = useCallback(
    (lat: number, lng: number, insertIndex?: number) => {
      if (!editingPolygon) return;

      const { x, y } = latLngToPixel(lat, lng);
      const newVertex: Vertex = {
        id: `vertex-${Date.now()}-${Math.random()}`,
        lat,
        lng,
        x,
        y
      };

      const updatedVertices = [...editingPolygon.vertices];
      if (insertIndex !== undefined) {
        updatedVertices.splice(insertIndex, 0, newVertex);
      } else {
        updatedVertices.push(newVertex);
      }

      setEditingPolygon({
        ...editingPolygon,
        vertices: updatedVertices
      });
    },
    [editingPolygon, latLngToPixel]
  );

  // Handle map click to add vertices with geofencing validation
  const handleMapClick = useCallback(
    async (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isActive || dragState.isDragging) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const { lat, lng } = pixelToLatLng(x, y);

      // Validate coordinates are within India
      const validation = await validateIndiaGeofencePrecise(lat, lng);
      if (!validation.isValid) {
        // Show warning but continue polygon creation
        const event = new CustomEvent("showNotification", {
          detail: {
            type: "warning",
            title: "Location Outside India Boundaries",
            message: validation.message,
            duration: 6000
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
        // Continue with vertex creation (don't return early)
      }

      const newVertex: Vertex = {
        id: `vertex-${Date.now()}`,
        lat,
        lng,
        x,
        y
      };

      // Handle different modes
      if (editMode && editingPolygon) {
        // Add vertex to editing polygon
        addVertexToEditingPolygon(lat, lng);
      } else {
        // Add vertex to current polygon (normal mode)
        setCurrentPolygon((prev) => [...prev, newVertex]);
      }

      // Show warning for locations near border
      if (validation.message) {
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
    [
      isActive,
      editMode,
      dragState.isDragging,
      pixelToLatLng,
      editingPolygon,
      addVertexToEditingPolygon
    ]
  );

  // Add Google Maps click listener for proper geographic validation enforcement
  useEffect(() => {
    if (!map || !isActive) return;

    const handleGoogleMapClick = async (event: google.maps.MapMouseEvent) => {
      if (!event.latLng || editMode || dragState.isDragging) return;

      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      try {
        // Strict validation for India boundaries
        const validation = await validateIndiaGeofencePrecise(lat, lng, {
          strictMode: true,
          showWarnings: true,
          allowNearBorder: false,
          borderTolerance: 0
        });

        if (!validation.isValid) {
          // Show warning but continue tool usage
          const notificationEvent = new CustomEvent("showNotification", {
            detail: {
              type: "warning",
              title: "Location Outside India Boundaries",
              message: `${validation.message} ${
                validation.suggestedAction || ""
              }`,
              duration: 8000
            }
          });
          window.dispatchEvent(notificationEvent);
          // Continue with vertex creation (don't return early)
        }
      } catch (error) {
        console.error("Error validating geographic boundaries:", error);
        const notificationEvent = new CustomEvent("showNotification", {
          detail: {
            type: "error",
            title: "Validation Error",
            message:
              "Unable to validate location boundaries. Please try again.",
            duration: 5000
          }
        });
        window.dispatchEvent(notificationEvent);
        return;
      }
    };

    const clickListener = map.addListener("click", handleGoogleMapClick);

    return () => {
      if (clickListener) {
        clickListener.remove();
      }
    };
  }, [map, isActive, editMode, dragState.isDragging, onToggle]);

  // Complete current polygon with validation
  const completePolygon = useCallback(async () => {
    if (currentPolygon.length < 3) {
      const event = new CustomEvent("showNotification", {
        detail: {
          type: "error",
          title: "Invalid Polygon",
          message: "A polygon must have at least 3 vertices",
          duration: 4000
        }
      });
      window.dispatchEvent(event);
      return;
    }

    // Validate all vertices are within India
    const coordinates = currentPolygon.map((vertex) => ({
      lat: vertex.lat,
      lng: vertex.lng
    }));
    const validation = await validateMultipleCoordinatesPrecise(coordinates);

    if (!validation.isValid) {
      const event = new CustomEvent("showNotification", {
        detail: {
          type: "warning",
          title: "Polygon Contains Points Outside India",
          message:
            validation.message ||
            "Some polygon vertices are outside India boundaries, but polygon will be saved.",
          duration: 6000
        }
      });
      window.dispatchEvent(event);
      // Continue with polygon completion (don't return early)
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
      createdAt: new Date()
    };

    setSavedPolygons((prev) => [...prev, polygon]);

    // Also save to global DataStore for Data Manager integration
    try {
      await saveData({
        name: polygon.name,
        type: 'polygon',
        description: `Polygon with ${polygon.vertices.length} vertices`,
        category: 'Polygon Measurements',
        tags: ['polygon', 'area', 'manual'],
        data: {
          points: polygon.vertices.map((vertex, index) => ({
            id: `vertex_${index}`,
            lat: vertex.lat,
            lng: vertex.lng,
            x: vertex.x,
            y: vertex.y
          })),
          area: polygon.area,
          perimeter: polygon.perimeter,
          unit: 'metric', // Assuming metric units
          center: {
            lat: polygon.vertices.reduce((sum, v) => sum + v.lat, 0) / polygon.vertices.length,
            lng: polygon.vertices.reduce((sum, v) => sum + v.lng, 0) / polygon.vertices.length
          }
        }
      });
    } catch (error) {
      console.error('Failed to save polygon to DataStore:', error);
      // Show warning but don't prevent local save
      const errorEvent = new CustomEvent("showNotification", {
        detail: {
          type: "warning",
          title: "Data Manager Save Failed",
          message: "Polygon saved locally but failed to save to Data Manager.",
          duration: 4000
        }
      });
      window.dispatchEvent(errorEvent);
    }

    setCurrentPolygon([]);
    setNewPolygonName("");
  }, [
    currentPolygon,
    newPolygonName,
    savedPolygons.length,
    selectedColor.value,
    currentPolygonStats,
    saveData
  ]);

  // Clear current polygon
  const clearCurrentPolygon = () => {
    setCurrentPolygon([]);
  };

  // Remove last vertex
  const removeLastVertex = () => {
    setCurrentPolygon((prev) => prev.slice(0, -1));
  };

  // Delete saved polygon with confirmation
  const deletePolygon = (polygonId: string) => {
    setSavedPolygons((prev) => prev.filter((p) => p.id !== polygonId));
    setShowDeleteDialog(null);
    setSelectedPolygonId(null);
  };

  // Select polygon for viewing
  const selectPolygon = (polygonId: string) => {
    setSelectedPolygonId(selectedPolygonId === polygonId ? null : polygonId);
  };

  // Edit saved polygon
  const editPolygon = (polygonId: string) => {
    const polygon = savedPolygons.find((p) => p.id === polygonId);
    if (polygon) {
      setEditingPolygon(polygon);
      setEditingPolygonId(polygonId);
      setEditMode(true);
      setSelectedPolygonId(polygonId);
      // Set the polygon name for editing
      setNewPolygonName(polygon.name);
      setSelectedColor(
        POLYGON_COLORS.find((c) => c.value === polygon.color) ||
          POLYGON_COLORS[0]
      );
      // Clear current polygon as we'll edit the saved one directly
      setCurrentPolygon([]);
    }
  };

  // Cancel editing and restore original polygon
  const cancelEdit = () => {
    setEditingPolygon(null);
    setEditingPolygonId(null);
    setEditMode(false);
    setSelectedPolygonId(null);
    setCurrentPolygon([]);
    setNewPolygonName("");
  };

  // Handle clicking on middle point (add vertex)
  const handleMiddlePointClick = (
    event: React.MouseEvent,
    vertex1: Vertex,
    vertex2: Vertex,
    insertIndex: number
  ) => {
    event.stopPropagation();
    if (!editingPolygon) return;

    // Calculate middle point
    const midLat = (vertex1.lat + vertex2.lat) / 2;
    const midLng = (vertex1.lng + vertex2.lng) / 2;

    addVertexToEditingPolygon(midLat, midLng, insertIndex);
  };

  // Update edited polygon
  const updateEditedPolygon = async () => {
    if (
      !editingPolygonId ||
      !editingPolygon ||
      editingPolygon.vertices.length < 3
    )
      return;

    // Calculate new stats
    const area = calculatePolygonArea(editingPolygon.vertices);
    const perimeter = calculatePolygonPerimeter(editingPolygon.vertices);

    const name = newPolygonName.trim() || editingPolygon.name;
    const updatedPolygon: Polygon = {
      ...editingPolygon,
      name,
      color: selectedColor.value,
      area,
      perimeter
    };

    setSavedPolygons((prev) =>
      prev.map((p) => (p.id === editingPolygonId ? updatedPolygon : p))
    );
    setEditingPolygon(null);
    setEditingPolygonId(null);
    setEditMode(false);
    setSelectedPolygonId(null);
    setNewPolygonName("");
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
        offset: { x, y }
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

      // Update editing polygon if in edit mode
      if (editingPolygon && dragState.polygonId === editingPolygon.id) {
        const updatedVertices = editingPolygon.vertices.map((vertex) => {
          if (vertex.id !== dragState.vertexId) return vertex;
          return { ...vertex, lat, lng, x, y };
        });

        setEditingPolygon({
          ...editingPolygon,
          vertices: updatedVertices
        });
      } else {
        // Update saved polygons directly (for future use)
        setSavedPolygons((prev) =>
          prev.map((polygon) => {
            if (polygon.id !== dragState.polygonId) return polygon;

            const updatedVertices = polygon.vertices.map((vertex) => {
              if (vertex.id !== dragState.vertexId) return vertex;
              return { ...vertex, lat, lng, x, y };
            });

            return {
              ...polygon,
              vertices: updatedVertices,
              area: calculatePolygonArea(updatedVertices),
              perimeter: calculatePolygonPerimeter(updatedVertices)
            };
          })
        );
      }
    },
    [
      dragState,
      pixelToLatLng,
      calculatePolygonArea,
      calculatePolygonPerimeter,
      editingPolygon
    ]
  );

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      polygonId: null,
      vertexId: null,
      offset: { x: 0, y: 0 }
    });
  }, []);

  // Export all polygons to JSON
  const exportAllPolygons = () => {
    if (savedPolygons.length === 0) return;

    const exportData = {
      type: "FeatureCollection",
      features: savedPolygons.map((polygon) => ({
        type: "Feature",
        properties: {
          name: polygon.name,
          color: polygon.color,
          area_km2: polygon.area,
          perimeter_km: polygon.perimeter,
          created_at: polygon.createdAt.toISOString(),
          vertex_count: polygon.vertices.length
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              ...polygon.vertices.map((vertex) => [vertex.lng, vertex.lat]),
              [polygon.vertices[0].lng, polygon.vertices[0].lat] // Close the polygon
            ]
          ]
        }
      }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `polygons_export_${
      new Date().toISOString().split("T")[0]
    }.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show success notification
    const event = new CustomEvent("showNotification", {
      detail: {
        type: "success",
        title: "Export Successful",
        message: `Exported ${savedPolygons.length} polygons as GeoJSON`,
        duration: 3000
      }
    });
    window.dispatchEvent(event);
  };

  // Copy polygon coordinates to clipboard
  const copyPolygonCoordinates = async (polygon: Polygon) => {
    const coordinatesText = polygon.vertices
      .map(
        (vertex, index) =>
          `${index + 1}. ${vertex.lat.toFixed(6)}, ${vertex.lng.toFixed(6)}`
      )
      .join("\n");

    const fullText = `${polygon.name}\nArea: ${polygon.area.toFixed(
      4
    )} km²\nPerimeter: ${polygon.perimeter.toFixed(
      2
    )} km\nVertices:\n${coordinatesText}`;

    try {
      await navigator.clipboard.writeText(fullText);
      const event = new CustomEvent("showNotification", {
        detail: {
          type: "success",
          title: "Copied to Clipboard",
          message: `Coordinates for "${polygon.name}" copied`,
          duration: 2000
        }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  // Render polygon path
  const getPolygonPath = (vertices: Vertex[]) => {
    if (vertices.length < 2) return "";
    return `M ${vertices.map((v) => `${v.x},${v.y}`).join(" L ")} Z`;
  };

  return (
    <>
      {/* Tool Controls - Positioned below Distance toolbox */}
      {isActive && (
        <div
          ref={toolboxRef}
          className="fixed animate-in slide-in-from-left-4 duration-300 layout-transition"
          style={{
            top: `${TOOLBOX_POSITIONING.top}px`,
            bottom: `${TOOLBOX_POSITIONING.bottom}px`,
            left: `${sidebarWidth + TOOLBOX_POSITIONING.padding}px`,
            width: `${TOOLBOX_POSITIONING.width}px`,
            zIndex: Z_INDEX.TOOLBOX_POLYGON,
            transition:
              "left 0.3s cubic-bezier(0.4, 0, 0.2, 1), top 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "left, top, transform"
          }}
        >
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col h-full">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">
                  Polygon Tool
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
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3 toolbox-scrollbar">
              {isActive && (
                <>
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3 mb-4 shadow-sm">
                    <div className="text-xs font-semibold text-green-700 mb-2 flex items-center">
                      <span className="mr-2">🎯</span>
                      Quick Start Guide
                    </div>
                    <div className="text-xs text-green-600 space-y-1 leading-relaxed">
                      <div className="flex items-center">
                        <span className="w-1 h-1 bg-green-500 rounded-full mr-2"></span>
                        Click map to add vertices (min. 3 required)
                      </div>
                      <div className="flex items-center">
                        <span className="w-1 h-1 bg-green-500 rounded-full mr-2"></span>
                        Complete polygon when satisfied
                      </div>
                      <div className="flex items-center">
                        <span className="w-1 h-1 bg-green-500 rounded-full mr-2"></span>
                        Use Edit mode to modify saved polygons
                      </div>
                    </div>
                  </div>

                  {/* Color Selector */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-gray-700 block mb-2 flex items-center">
                      <span className="mr-2">🎨</span>
                      Polygon Color:
                    </label>
                    <div className="flex space-x-2">
                      {POLYGON_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setSelectedColor(color)}
                          className={`w-8 h-8 rounded-lg border-3 transition-all duration-200 hover:scale-110 hover:shadow-lg ${
                            selectedColor.value === color.value
                              ? "border-gray-800 ring-2 ring-gray-300 scale-110"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Polygon Name Input */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-gray-700 block mb-2 flex items-center">
                      <span className="mr-2">📝</span>
                      Polygon Name:
                    </label>
                    <input
                      type="text"
                      value={newPolygonName}
                      onChange={(e) => setNewPolygonName(e.target.value)}
                      placeholder={`Polygon ${savedPolygons.length + 1}`}
                      className="w-full text-xs border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white hover:border-gray-400"
                    />
                  </div>

                  {/* Current/Editing Polygon Stats */}
                  {(currentPolygon.length > 0 ||
                    (editingPolygon && editingPolygon.vertices.length > 0)) && (
                    <div
                      className={`mb-3 p-2 rounded ${
                        editingPolygon ? "bg-blue-50" : "bg-green-50"
                      }`}
                    >
                      <div className="text-xs text-gray-600">
                        <div className="font-medium mb-1">
                          {editingPolygon ? "✏️ Editing" : "🔷 Current"} Polygon
                          Stats:
                        </div>
                        {editingPolygon ? (
                          <>
                            <div>
                              Vertices: {editingPolygon.vertices.length}
                            </div>
                            {editingPolygon.vertices.length >= 3 && (
                              <>
                                <div>
                                  Area:{" "}
                                  {calculatePolygonArea(
                                    editingPolygon.vertices
                                  ).toFixed(4)}{" "}
                                  km²
                                </div>
                                <div>
                                  Perimeter:{" "}
                                  {calculatePolygonPerimeter(
                                    editingPolygon.vertices
                                  ).toFixed(2)}{" "}
                                  km
                                </div>
                                <div className="font-medium text-blue-600">
                                  ✓ Editing {editingPolygon.name}
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <div>Vertices: {currentPolygon.length}</div>
                            {currentPolygon.length >= 3 && (
                              <>
                                <div>
                                  Area: {currentPolygonStats.area.toFixed(4)}{" "}
                                  km²
                                </div>
                                <div>
                                  Perimeter:{" "}
                                  {currentPolygonStats.perimeter.toFixed(2)} km
                                </div>
                                <div
                                  className={`font-medium ${
                                    currentPolygonStats.isValid
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {currentPolygonStats.isValid
                                    ? "✓ Valid polygon"
                                    : "✗ Invalid polygon"}
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mode Toggle */}
                  <div className="mb-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditMode(!editMode)}
                        className={`flex-1 px-3 py-2 text-xs rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 ${
                          editMode
                            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
                            : "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 hover:from-gray-300 hover:to-gray-400"
                        }`}
                      >
                        {editMode ? "🔧 Edit Mode" : "✏️ Edit Mode"}
                      </button>
                      {editingPolygonId && (
                        <button
                          onClick={cancelEdit}
                          className="flex-1 px-3 py-2 text-xs bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                        >
                          ❌ Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={removeLastVertex}
                        disabled={currentPolygon.length === 0}
                        className="flex-1 px-3 py-2 text-xs bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                      >
                        ↩️ Undo
                      </button>
                      <button
                        onClick={clearCurrentPolygon}
                        disabled={currentPolygon.length === 0}
                        className="flex-1 px-3 py-2 text-xs bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                      >
                        🗑️ Clear
                      </button>
                    </div>

                    {editingPolygonId ? (
                      <button
                        onClick={updateEditedPolygon}
                        disabled={
                          !editingPolygon || editingPolygon.vertices.length < 3
                        }
                        className="w-full px-4 py-3 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                      >
                        💾 Update Polygon
                      </button>
                    ) : (
                      <button
                        onClick={completePolygon}
                        disabled={
                          currentPolygon.length < 3 ||
                          !currentPolygonStats.isValid
                        }
                        className="w-full px-4 py-3 text-sm bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                      >
                        ✅ Complete Polygon
                      </button>
                    )}

                    {/* Global Actions */}
                    {savedPolygons.length > 0 && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedPolygonId(null)}
                          className="flex-1 px-3 py-2 text-xs bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                        >
                          📍 Show All
                        </button>
                        <button
                          onClick={exportAllPolygons}
                          className="flex-1 px-3 py-2 text-xs bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                        >
                          📤 Export
                        </button>
                      </div>
                    )}

                    {/* Additional tools for edit mode */}
                    {editMode && editingPolygon && (
                      <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        <div className="font-medium mb-1">
                          ✨ Edit Mode Tips:
                        </div>
                        <div>• Click 🔵 middle points to add vertices</div>
                        <div>• Drag vertex handles to reshape</div>
                        <div>• Click map to add new vertices</div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Saved Polygons Section */}
              {savedPolygons.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => setShowSavedTable(!showSavedTable)}
                    className="flex items-center justify-between w-full text-xs text-gray-700 hover:text-gray-900 font-bold mb-2"
                  >
                    <span>🔷 Saved Polygons ({savedPolygons.length})</span>
                    <span
                      className={`transition-transform duration-200 ${
                        showSavedTable ? "rotate-90" : ""
                      }`}
                    >
                      ▶
                    </span>
                  </button>

                  {showSavedTable && (
                    <div className="bg-gray-50 rounded p-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
                      <div className="space-y-2">
                        {savedPolygons.map((polygon) => (
                          <div
                            key={polygon.id}
                            className={`bg-white rounded border p-2 transition-all ${
                              selectedPolygonId === polygon.id
                                ? "border-blue-400 shadow-sm"
                                : "border-gray-200"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <button
                                onClick={() => selectPolygon(polygon.id)}
                                className="flex-1 text-left"
                              >
                                <span
                                  className="font-medium text-xs truncate block"
                                  title={polygon.name}
                                >
                                  {polygon.name}
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                  {polygon.area.toFixed(4)} km² •{" "}
                                  {polygon.vertices.length} vertices
                                </div>
                              </button>
                              <div className="flex space-x-1 ml-2">
                                <button
                                  onClick={() =>
                                    copyPolygonCoordinates(polygon)
                                  }
                                  className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded"
                                  title="Copy coordinates"
                                >
                                  📋
                                </button>
                                <button
                                  onClick={() => editPolygon(polygon.id)}
                                  className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                                  title="Edit polygon"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() =>
                                    setShowDeleteDialog(polygon.id)
                                  }
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                  title="Delete polygon"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>

                            {/* Expanded polygon details */}
                            {selectedPolygonId === polygon.id && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                                  <div>Area: {polygon.area.toFixed(4)} km²</div>
                                  <div>
                                    Perimeter: {polygon.perimeter.toFixed(2)} km
                                  </div>
                                  <div>Vertices: {polygon.vertices.length}</div>
                                  <div>
                                    Created:{" "}
                                    {polygon.createdAt.toLocaleDateString()}
                                  </div>
                                </div>

                                {/* Vertices table */}
                                <div className="bg-gray-50 rounded p-2">
                                  <div className="text-xs font-medium text-gray-700 mb-1">
                                    Vertices:
                                  </div>
                                  <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
                                    <table className="w-full text-xs table-fixed">
                                      <thead className="sticky top-0 bg-gray-50">
                                        <tr className="text-gray-600">
                                          <th className="text-left w-8">#</th>
                                          <th className="text-right w-20">
                                            Lat
                                          </th>
                                          <th className="text-right w-20">
                                            Lng
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {polygon.vertices.map(
                                          (vertex, index) => (
                                            <tr
                                              key={vertex.id}
                                              className="border-t border-gray-200"
                                            >
                                              <td className="py-1 px-1">
                                                {index + 1}
                                              </td>
                                              <td
                                                className="py-1 px-1 text-right font-mono text-xs truncate"
                                                title={vertex.lat.toFixed(6)}
                                              >
                                                {vertex.lat.toFixed(4)}
                                              </td>
                                              <td
                                                className="py-1 px-1 text-right font-mono text-xs truncate"
                                                title={vertex.lng.toFixed(6)}
                                              >
                                                {vertex.lng.toFixed(4)}
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Polygon Overlay */}
      {isActive && (
        <div
          ref={containerRef}
          className={`absolute inset-0 z-10 ${
            editMode ? "cursor-move" : "cursor-crosshair"
          }`}
          onClick={handleMapClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            pointerEvents: isPrimaryTool || !multiToolMode ? 'auto' : 'none'
          }}
        >
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: "100%", height: "100%" }}
          >
            {/* Render saved polygons - show only selected polygon or all if none selected */}
            {savedPolygons
              .filter((polygon) =>
                selectedPolygonId ? polygon.id === selectedPolygonId : true
              )
              .map((polygon) => (
                <g key={polygon.id}>
                  {/* Polygon fill */}
                  <path
                    d={getPolygonPath(polygon.vertices)}
                    fill={
                      POLYGON_COLORS.find((c) => c.value === polygon.color)
                        ?.fill || "rgba(239, 68, 68, 0.3)"
                    }
                    stroke={polygon.color}
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />

                  {/* Polygon label */}
                  {polygon.vertices.length > 0 && (
                    <text
                      x={
                        polygon.vertices.reduce((sum, v) => sum + v.x, 0) /
                        polygon.vertices.length
                      }
                      y={
                        polygon.vertices.reduce((sum, v) => sum + v.y, 0) /
                        polygon.vertices.length
                      }
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

            {/* Render editing polygon with enhanced features */}
            {editingPolygon && editingPolygon.vertices.length > 2 && (
              <g>
                {/* Polygon fill */}
                <path
                  d={getPolygonPath(editingPolygon.vertices)}
                  fill={selectedColor.fill}
                  stroke={selectedColor.value}
                  strokeWidth="3"
                  strokeDasharray="2,2"
                  className="pointer-events-none"
                />

                {/* Middle points for adding vertices */}
                {editMode &&
                  editingPolygon.vertices.map((vertex, index) => {
                    const nextVertex =
                      editingPolygon.vertices[
                        (index + 1) % editingPolygon.vertices.length
                      ];
                    const midX = (vertex.x + nextVertex.x) / 2;
                    const midY = (vertex.y + nextVertex.y) / 2;

                    return (
                      <circle
                        key={`mid-${vertex.id}-${nextVertex.id}`}
                        cx={midX}
                        cy={midY}
                        r="4"
                        fill="rgba(59, 130, 246, 0.8)"
                        stroke="white"
                        strokeWidth="2"
                        className="cursor-pointer hover:fill-blue-600"
                        style={{ pointerEvents: "auto" }}
                        onClick={(e) =>
                          handleMiddlePointClick(
                            e,
                            vertex,
                            nextVertex,
                            index + 1
                          )
                        }
                      />
                    );
                  })}
              </g>
            )}

            {/* Render current polygon */}
            {!editingPolygon && currentPolygon.length > 2 && (
              <path
                d={getPolygonPath(currentPolygon)}
                fill={selectedColor.fill}
                stroke={selectedColor.value}
                strokeWidth="2"
                strokeDasharray="3,3"
              />
            )}

            {/* Render current polygon lines */}
            {currentPolygon.length > 1 &&
              currentPolygon.map((vertex, index) => {
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
                backgroundColor: selectedColor.value
              }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold bg-white px-1 rounded shadow">
                {index + 1}
              </div>
            </div>
          ))}

          {/* Render editing polygon vertices with drag handles */}
          {editMode &&
            editingPolygon &&
            editingPolygon.vertices.map((vertex, index) => (
              <div
                key={`edit-${vertex.id}`}
                className="absolute w-5 h-5 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 cursor-move pointer-events-auto hover:scale-110 transition-transform"
                style={{
                  left: vertex.x,
                  top: vertex.y,
                  backgroundColor: selectedColor.value,
                  zIndex: 20
                }}
                onMouseDown={(e) =>
                  handleVertexMouseDown(e, editingPolygon.id, vertex.id)
                }
                title={`${editingPolygon.name} - Vertex ${
                  index + 1
                } (Drag to move)`}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-white bg-blue-600 px-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog !== null}
        onClose={() => setShowDeleteDialog(null)}
        onConfirm={() => showDeleteDialog && deletePolygon(showDeleteDialog)}
        title="Delete Polygon"
        message={`Are you sure you want to delete "${
          savedPolygons.find((p) => p.id === showDeleteDialog)?.name
        }"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />
    </>
  );
};

export default PolygonDrawingTool;
