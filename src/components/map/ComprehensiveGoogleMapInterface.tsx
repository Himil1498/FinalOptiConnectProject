import React, { useState, useCallback, useRef, useEffect } from "react";
import { Wrapper } from "@googlemaps/react-wrapper";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import {
  setMapCenter,
  setMapZoom,
  setSelectedTower
} from "../../store/slices/mapSlice";
import CustomMapControls from "./CustomMapControls";
import GoogleMapControls from "./GoogleMapControls";
import FloatingToolPanel from "./FloatingToolPanel";
import MapControlsPanel from "./MapControlsPanel";
import LiveCoordinateDisplay from "./LiveCoordinateDisplay";
import DraggablePanel from "../common/DraggablePanel";
import LayoutManager from "../common/LayoutManager";
import { usePanelManager } from "../common/PanelManager";
import DistanceMeasurementTool from "./DistanceMeasurementTool";
import PolygonDrawingTool from "./PolygonDrawingTool";
import ElevationTool from "./ElevationTool";
import GeofencingSystem, { useGeofencing } from "./GeofencingSystem";
import RegionAssignmentSystem from "../admin/RegionAssignmentSystem";
import UserGroupsManagement from "../admin/UserGroupsManagement";
import ManagerDashboard from "../admin/ManagerDashboard";
import DataImportSystem from "../admin/DataImportSystem";
import InfrastructureDataManagement from "../admin/InfrastructureDataManagement";
import ComprehensiveSearchSystem from "../search/ComprehensiveSearchSystem";
import DataManager from "../data/DataManager";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { SearchResult, Coordinates, SavedDataItem } from "../../types";

interface GoogleMapProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  onMapReady?: (map: google.maps.Map) => void;
}

const GoogleMap: React.FC<GoogleMapProps> = ({ center, zoom, onMapReady }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const { towers, layers } = useSelector((state: RootState) => state.map);
  const dispatch = useDispatch<AppDispatch>();
  const markersRef = useRef<google.maps.Marker[]>([]);
  const boundaryRef = useRef<google.maps.Data | null>(null);

  // Debounce refs for preventing excessive updates
  const centerUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const zoomUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Performance optimization refs
  const isDraggingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  // Load India boundary from GeoJSON file
  const loadIndiaBoundary = useCallback(async () => {
    if (!googleMapRef.current) return;

    try {
      const response = await fetch("/india-boundary.geojson");
      const geoJsonData = await response.json();

      // Add data layer for boundaries
      const dataLayer = new google.maps.Data();
      dataLayer.addGeoJson(geoJsonData);

      // Style the boundary
      dataLayer.setStyle({
        strokeColor: "#2563eb",
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: "transparent",
        fillOpacity: 0,
        clickable: false
      });

      dataLayer.setMap(googleMapRef.current);
      boundaryRef.current = dataLayer;
    } catch (error) {
      console.error("Error loading India boundary:", error);
    }
  }, []);

  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case "active":
        return "#10B981";
      case "inactive":
        return "#6B7280";
      case "maintenance":
        return "#F59E0B";
      case "critical":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  }, []);

  const getTowerIcon = (type: string, status: string): string => {
    // You can customize these icon URLs based on your assets
    const baseUrl = "/icons/";
    const statusColor =
      status === "active"
        ? "green"
        : status === "maintenance"
        ? "yellow"
        : status === "critical"
        ? "red"
        : "gray";

    return `${baseUrl}tower-${type}-${statusColor}.png`;
  };

  const createInfoWindowContent = useCallback(
    (tower: any): string => {
      return `
      <div style="padding: 10px; min-width: 200px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">${
          tower.name
        }</h3>
        <div style="font-size: 14px; line-height: 1.4;">
          <p><strong>Type:</strong> ${tower.type.toUpperCase()}</p>
          <p><strong>Status:</strong> <span style="color: ${getStatusColor(
            tower.status
          )}">${
        tower.status.charAt(0).toUpperCase() + tower.status.slice(1)
      }</span></p>
          <p><strong>Signal Strength:</strong> ${tower.signal_strength}%</p>
          <p><strong>Coverage Radius:</strong> ${tower.coverage_radius}km</p>
          <p><strong>Installed:</strong> ${new Date(
            tower.installed_date
          ).toLocaleDateString()}</p>
          <p><strong>Last Maintenance:</strong> ${new Date(
            tower.last_maintenance
          ).toLocaleDateString()}</p>
          <div style="margin-top: 8px;">
            <strong>Equipment:</strong><br>
            ${tower.equipment
              .map(
                (item: string) =>
                  `<span style="display: inline-block; background: #e3f2fd; padding: 2px 6px; margin: 2px; border-radius: 3px; font-size: 12px;">${item}</span>`
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
    },
    [getStatusColor]
  );

  // Optimized event handlers with better performance
  const handleCenterChanged = useCallback(() => {
    if (googleMapRef.current && !isDraggingRef.current) {
      if (centerUpdateTimeoutRef.current) {
        clearTimeout(centerUpdateTimeoutRef.current);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        centerUpdateTimeoutRef.current = setTimeout(() => {
          if (googleMapRef.current) {
            const newCenter = googleMapRef.current.getCenter();
            if (newCenter) {
              const lat = newCenter.lat();
              const lng = newCenter.lng();
              dispatch(setMapCenter([lat, lng]));
            }
          }
        }, 50); // Further reduced debounce for smoother dragging
      });
    }
  }, [dispatch]);

  const handleZoomChanged = useCallback(() => {
    if (googleMapRef.current) {
      if (zoomUpdateTimeoutRef.current) {
        clearTimeout(zoomUpdateTimeoutRef.current);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        zoomUpdateTimeoutRef.current = setTimeout(() => {
          if (googleMapRef.current) {
            const newZoom = googleMapRef.current.getZoom();
            if (newZoom) {
              dispatch(setMapZoom(newZoom));
            }
          }
        }, 100); // Faster zoom response
      });
    }
  }, [dispatch]);

  // Add drag event handlers for better performance
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    handleCenterChanged();
  }, [handleCenterChanged]);

  // Initialize Google Map (only once)
  useEffect(() => {
    if (mapRef.current && !googleMapRef.current) {
      try {
        googleMapRef.current = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeId: google.maps.MapTypeId.HYBRID,
          // Remove all default controls
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: false,
          scaleControl: false,
          rotateControl: false,
          panControl: false,
          // Optimize performance with enhanced interactions
          // Enhanced smooth animations and interactions
          gestureHandling: "greedy",
          scrollwheel: true,
          draggable: true,
          clickableIcons: true,
          keyboardShortcuts: true,
          // Enhanced zoom limits for better control
          minZoom: 4,
          maxZoom: 20,
          // Smooth interaction settings
          disableDoubleClickZoom: false,
          draggableCursor: 'grab',
          draggingCursor: 'grabbing',
          // Custom styling for better performance
          styles: [
            {
              featureType: "poi.business",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "poi.government",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "poi.school",
              stylers: [{ visibility: "off" }]
            }
          ]
        });

        // Add event listeners with performance optimization
        googleMapRef.current.addListener("center_changed", handleCenterChanged);
        googleMapRef.current.addListener("zoom_changed", handleZoomChanged);
        googleMapRef.current.addListener("dragstart", handleDragStart);
        googleMapRef.current.addListener("dragend", handleDragEnd);

        // Add idle event for better performance
        googleMapRef.current.addListener("idle", () => {
          // Map has finished moving
          if (isDraggingRef.current) {
            isDraggingRef.current = false;
          }
        });

        // Load India boundary GeoJSON
        loadIndiaBoundary();

        // Notify parent component that map is ready
        if (onMapReady) {
          onMapReady(googleMapRef.current);
        }
      } catch (error) {
        console.error("Error creating Google Map:", error);
      }
    }

    // Cleanup timeouts and animation frames on unmount
    return () => {
      if (centerUpdateTimeoutRef.current) {
        clearTimeout(centerUpdateTimeoutRef.current);
      }
      if (zoomUpdateTimeoutRef.current) {
        clearTimeout(zoomUpdateTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [center, zoom, handleCenterChanged, handleZoomChanged, loadIndiaBoundary]);

  // Update map center and zoom when props change (but only if different)
  useEffect(() => {
    if (googleMapRef.current) {
      const currentCenter = googleMapRef.current.getCenter();
      const currentZoom = googleMapRef.current.getZoom();

      // Only update if values are actually different to prevent infinite loops
      if (
        currentCenter &&
        (Math.abs(currentCenter.lat() - center.lat) > 0.0001 ||
          Math.abs(currentCenter.lng() - center.lng) > 0.0001)
      ) {
        // Smooth pan to new center
        googleMapRef.current.panTo(center);
      }

      if (currentZoom !== zoom) {
        // Smooth zoom to new level
        googleMapRef.current.setZoom(zoom);
      }
    }
  }, [center.lat, center.lng, zoom]);

  // Update towers on map
  useEffect(() => {
    if (!googleMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add new markers for visible towers
    const towersLayer = layers.find((layer) => layer.id === "towers");
    if (towersLayer?.visible) {
      towers.forEach((tower) => {
        const marker = new google.maps.Marker({
          position: { lat: tower.position[0], lng: tower.position[1] },
          map: googleMapRef.current,
          title: tower.name,
          icon: {
            url: getTowerIcon(tower.type, tower.status),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 32)
          }
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: createInfoWindowContent(tower)
        });

        marker.addListener("click", () => {
          infoWindow.open(googleMapRef.current, marker);
          dispatch(setSelectedTower(tower));
        });

        // Add coverage circle
        if (layers.find((layer) => layer.id === "coverage")?.visible) {
          new google.maps.Circle({
            strokeColor: getStatusColor(tower.status),
            strokeOpacity: 0.6,
            strokeWeight: 2,
            fillColor: getStatusColor(tower.status),
            fillOpacity: 0.1,
            map: googleMapRef.current,
            center: { lat: tower.position[0], lng: tower.position[1] },
            radius: tower.coverage_radius * 1000 // Convert km to meters
          });
        }

        markersRef.current.push(marker);
      });
    }
  }, [towers, layers, dispatch, createInfoWindowContent]);

  // Toggle boundary visibility
  useEffect(() => {
    const boundariesLayer = layers.find((layer) => layer.id === "boundaries");
    if (boundaryRef.current) {
      boundaryRef.current.setMap(
        boundariesLayer?.visible ? googleMapRef.current : null
      );
    }
  }, [layers]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
};

interface ComprehensiveGoogleMapInterfaceProps {
  onMapReady?: (map: google.maps.Map) => void;
}

const ComprehensiveGoogleMapInterface: React.FC<ComprehensiveGoogleMapInterfaceProps> = ({ onMapReady }) => {
  const { center, zoom } = useSelector((state: RootState) => state.map);
  const { user } = useAuth();
  const { addNotification } = useTheme();

  // Tool states
  const [isDistanceMeasuring, setIsDistanceMeasuring] = useState(false);
  const [isPolygonDrawing, setIsPolygonDrawing] = useState(false);
  const [isElevationActive, setIsElevationActive] = useState(false);

  // Map control states
  const [currentMapType, setCurrentMapType] = useState<string>("hybrid");
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // Panel states
  const [showRegionPanel, setShowRegionPanel] = useState(false);
  const [showUserGroupsPanel, setShowUserGroupsPanel] = useState(false);
  const [showManagerDashboard, setShowManagerDashboard] = useState(false);
  const [showDataImport, setShowDataImport] = useState(false);
  const [showInfrastructureData, setShowInfrastructureData] = useState(false);
  const [showSearchSystem, setShowSearchSystem] = useState(false);
  const [showDataManager, setShowDataManager] = useState(false);
  const [showLayoutManager, setShowLayoutManager] = useState(false);

  // Panel manager hook
  const { registerPanel } = usePanelManager();

  // Register the live coordinates panel
  useEffect(() => {
    registerPanel('live-coordinates', {
      isVisible: true,
      position: { x: 20, y: 20 },
      zIndex: 60
    });
  }, [registerPanel]);

  // User role checks
  const assignedStates = user?.assignedStates || [];
  const isAdmin = user?.role === "admin";
  const isGeofencingActive = !isAdmin && assignedStates.length > 0;

  // Initialize geofencing validation
  const { violations, clearViolations } = useGeofencing(
    assignedStates,
    isGeofencingActive
  );

  // Tool handlers - Fixed synchronization
  const handleToolActivation = useCallback(
    (toolName: string) => {
      // Handle tool toggling properly
      switch (toolName) {
        case "distance":
          if (isDistanceMeasuring) {
            // If already active, deactivate
            setIsDistanceMeasuring(false);
            addNotification({
              type: "info",
              title: "Distance Tool Deactivated",
              message: "Distance measurement stopped",
              duration: 2000
            });
          } else {
            // Deactivate other tools and activate distance
            setIsPolygonDrawing(false);
            setIsElevationActive(false);
            setIsDistanceMeasuring(true);
            addNotification({
              type: "info",
              title: "Distance Tool Activated",
              message: "Click on the map to start measuring distances",
              duration: 3000
            });
          }
          break;
        case "polygon":
          if (isPolygonDrawing) {
            // If already active, deactivate
            setIsPolygonDrawing(false);
            addNotification({
              type: "info",
              title: "Polygon Tool Deactivated",
              message: "Polygon drawing stopped",
              duration: 2000
            });
          } else {
            // Deactivate other tools and activate polygon
            setIsDistanceMeasuring(false);
            setIsElevationActive(false);
            setIsPolygonDrawing(true);
            addNotification({
              type: "info",
              title: "Polygon Tool Activated",
              message: "Click on the map to start drawing polygons",
              duration: 3000
            });
          }
          break;
        case "elevation":
          if (isElevationActive) {
            // If already active, deactivate
            setIsElevationActive(false);
            addNotification({
              type: "info",
              title: "Elevation Tool Deactivated",
              message: "Elevation analysis stopped",
              duration: 2000
            });
          } else {
            // Deactivate other tools and activate elevation
            setIsDistanceMeasuring(false);
            setIsPolygonDrawing(false);
            setIsElevationActive(true);
            addNotification({
              type: "info",
              title: "Elevation Tool Activated",
              message: "Click on the map to analyze elevation data",
              duration: 3000
            });
          }
          break;
      }
    },
    [isDistanceMeasuring, isPolygonDrawing, isElevationActive, addNotification]
  );

  // Panel handlers
  const handleTogglePanel = useCallback(
    (panelName: string) => {
      switch (panelName) {
        case "search":
          setShowSearchSystem(!showSearchSystem);
          break;
        case "region":
          setShowRegionPanel(!showRegionPanel);
          break;
        case "users":
          setShowUserGroupsPanel(!showUserGroupsPanel);
          break;
        case "dashboard":
          setShowManagerDashboard(!showManagerDashboard);
          break;
        case "import":
          setShowDataImport(!showDataImport);
          break;
        case "infrastructure":
          setShowInfrastructureData(!showInfrastructureData);
          break;
        case "data":
          setShowDataManager(!showDataManager);
          break;
        case "layout":
          setShowLayoutManager(!showLayoutManager);
          break;
      }
    },
    [
      showSearchSystem,
      showRegionPanel,
      showUserGroupsPanel,
      showManagerDashboard,
      showDataImport,
      showInfrastructureData,
      showDataManager,
      showLayoutManager
    ]
  );

  // Search system handlers
  const handleSearchResultSelect = useCallback(
    (result: SearchResult) => {
      console.log("Selected search result:", result);
      addNotification({
        type: "info",
        title: "Location Selected",
        message: `Navigating to ${result.title}`,
        duration: 2000
      });
    },
    [addNotification]
  );

  const handleNavigateToLocation = useCallback(
    (coords: Coordinates) => {
      console.log("Navigating to:", coords);
      addNotification({
        type: "success",
        title: "Navigation",
        message: `Navigating to coordinates: ${coords.lat.toFixed(
          4
        )}, ${coords.lng.toFixed(4)}`,
        duration: 2000
      });
    },
    [addNotification]
  );

  const render = (status: any) => {
    if (status === "LOADING") {
      return (
        <div className="flex items-center justify-center h-full bg-blue-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-primary-600">Loading Google Maps...</p>
          </div>
        </div>
      );
    }

    if (status === "FAILURE") {
      return (
        <div className="flex items-center justify-center h-full bg-red-50">
          <div className="text-center p-6">
            <p className="text-red-600 text-lg font-semibold mb-2">
              Failed to load Google Maps
            </p>
            <p className="text-red-500 text-sm mb-4">
              Please check your API key configuration
            </p>
            <div className="text-xs text-gray-600 bg-gray-100 p-3 rounded">
              <p>Common issues:</p>
              <ul className="list-disc list-inside mt-2 text-left">
                <li>Invalid API key</li>
                <li>Maps JavaScript API not enabled</li>
                <li>Billing not enabled in Google Cloud</li>
                <li>Domain restrictions blocking localhost</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative h-full w-full">
        {/* Main Google Maps Component */}
        <GoogleMap
          center={{ lat: center[0], lng: center[1] }}
          zoom={zoom}
          onMapReady={(map) => {
            setMapInstance(map);
            if (onMapReady) onMapReady(map);
          }}
        />

        {/* Live Coordinate Display - Smaller & More Compact */}
        <div className="fixed bottom-6 right-0 z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 min-w-[180px] max-w-[200px]">
            <div className="px-2 py-1.5 border-b border-gray-200/50">
              <h3 className="text-xs font-semibold text-gray-900 flex items-center">
                📍 <span className="ml-1">Live Coordinates</span>
              </h3>
            </div>
            <div className="p-2">
              <LiveCoordinateDisplay map={mapInstance} />
            </div>
          </div>
        </div>

        {/* Map Controls Panel */}
        <MapControlsPanel
          map={mapInstance}
          currentMapType={currentMapType}
          onMapTypeChange={setCurrentMapType}
        />


        {/* Floating Tool Panel */}
        <FloatingToolPanel
          user={user}
          isAdmin={isAdmin}
          isDistanceMeasuring={isDistanceMeasuring}
          isPolygonDrawing={isPolygonDrawing}
          isElevationActive={isElevationActive}
          showSearchSystem={showSearchSystem}
          showRegionPanel={showRegionPanel}
          showUserGroupsPanel={showUserGroupsPanel}
          showManagerDashboard={showManagerDashboard}
          showDataImport={showDataImport}
          showInfrastructureData={showInfrastructureData}
          showDataManager={showDataManager}
          showLayoutManager={showLayoutManager}
          onToolActivation={handleToolActivation}
          onTogglePanel={handleTogglePanel}
        />


        {/* Tool Components */}
        <DistanceMeasurementTool
          isActive={isDistanceMeasuring}
          onToggle={() => handleToolActivation('distance')}
          map={mapInstance}
          mapWidth={800}
          mapHeight={600}
        />

        <PolygonDrawingTool
          isActive={isPolygonDrawing}
          onToggle={() => handleToolActivation('polygon')}
          map={mapInstance}
          mapWidth={800}
          mapHeight={600}
        />

        <ElevationTool
          isActive={isElevationActive}
          onToggle={() => handleToolActivation('elevation')}
          map={mapInstance}
          mapWidth={800}
          mapHeight={600}
        />

        <GeofencingSystem
          assignedStates={assignedStates}
          isActive={isGeofencingActive}
          mapWidth={800}
          mapHeight={600}
          onGeofenceViolation={(point, violationType) => {
            addNotification({
              type: "error",
              title: "Access Denied",
              message: `You cannot work in this area. Please stay within your assigned regions: ${assignedStates.join(
                ", "
              )}`,
              duration: 8000
            });
          }}
        />

        {/* Panel Components */}
        {showRegionPanel && (
          <RegionAssignmentSystem
            isAdmin={isAdmin}
            currentUserId={user?.id || ""}
            onAssignmentChange={(assignments) => {
              console.log("Region assignments updated:", assignments);
            }}
          />
        )}

        {showUserGroupsPanel && (
          <UserGroupsManagement
            isOpen={showUserGroupsPanel}
            onClose={() => setShowUserGroupsPanel(false)}
            currentUserId={user?.id || ""}
          />
        )}

        {showManagerDashboard && (
          <ManagerDashboard
            isOpen={showManagerDashboard}
            onClose={() => setShowManagerDashboard(false)}
            currentUserId={user?.id || ""}
          />
        )}

        {showDataImport && (
          <DataImportSystem
            isOpen={showDataImport}
            onClose={() => setShowDataImport(false)}
            currentUserId={user?.id || ""}
          />
        )}

        {showInfrastructureData && (
          <InfrastructureDataManagement
            isOpen={showInfrastructureData}
            onClose={() => setShowInfrastructureData(false)}
            currentUserId={user?.id || ""}
            userRole={user?.role || "viewer"}
          />
        )}

        {showSearchSystem && (
          <ComprehensiveSearchSystem
            isOpen={showSearchSystem}
            onClose={() => setShowSearchSystem(false)}
            currentUserId={user?.id || ""}
            userRole={user?.role || "viewer"}
            onResultSelect={handleSearchResultSelect}
            onNavigateToLocation={handleNavigateToLocation}
          />
        )}

        {showDataManager && (
          <DataManager
            onClose={() => setShowDataManager(false)}
            onItemLoad={(item: SavedDataItem) => {
              console.log("Loading saved data:", item);
              addNotification({
                type: "success",
                message: `Loaded ${item.name}`,
                duration: 3000
              });
            }}
          />
        )}

        {/* Layout Manager */}
        {showLayoutManager && (
          <LayoutManager
            isOpen={showLayoutManager}
            onClose={() => setShowLayoutManager(false)}
          />
        )}

        {/* User Region Panel (Non-Admin) */}
        {!isAdmin && assignedStates.length > 0 && (
          <div className="absolute bottom-20 left-4 z-20">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="text-sm font-medium text-yellow-800">
                Assigned Regions
              </div>
              <div className="text-xs text-yellow-600 mt-1">
                {assignedStates.join(", ")}
              </div>
            </div>
          </div>
        )}

        {/* Geofence Violation Alerts */}
        {violations.length > 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
              <div className="flex items-start space-x-3">
                <div className="text-red-600 text-xl">⚠️</div>
                <div>
                  <h4 className="text-sm font-bold text-red-800">
                    Geofence Violation Detected
                  </h4>
                  <p className="text-xs text-red-700 mt-1">
                    You attempted to work outside your assigned regions. Please
                    stay within: {assignedStates.join(", ")}
                  </p>
                  <div className="mt-2">
                    <button
                      onClick={clearViolations}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <GeofencingSystem
          assignedStates={assignedStates}
          isActive={isGeofencingActive}
          mapWidth={800}
          mapHeight={600}
          onGeofenceViolation={(point, violationType) => {
            addNotification({
              type: "error",
              title: "Access Denied",
              message: `You cannot work in this area. Please stay within your assigned regions: ${assignedStates.join(
                ", "
              )}`,
              duration: 8000
            });
          }}
        />

        {/* Panel Components */}
        {showRegionPanel && (
          <RegionAssignmentSystem
            isAdmin={isAdmin}
            currentUserId={user?.id || ""}
            onAssignmentChange={(assignments) => {
              console.log("Region assignments updated:", assignments);
            }}
          />
        )}

        {showUserGroupsPanel && (
          <UserGroupsManagement
            isOpen={showUserGroupsPanel}
            onClose={() => setShowUserGroupsPanel(false)}
            currentUserId={user?.id || ""}
          />
        )}

        {showManagerDashboard && (
          <ManagerDashboard
            isOpen={showManagerDashboard}
            onClose={() => setShowManagerDashboard(false)}
            currentUserId={user?.id || ""}
          />
        )}

        {showDataImport && (
          <DataImportSystem
            isOpen={showDataImport}
            onClose={() => setShowDataImport(false)}
            currentUserId={user?.id || ""}
          />
        )}

        {showInfrastructureData && (
          <InfrastructureDataManagement
            isOpen={showInfrastructureData}
            onClose={() => setShowInfrastructureData(false)}
            currentUserId={user?.id || ""}
            userRole={user?.role || "viewer"}
          />
        )}

        {showSearchSystem && (
          <ComprehensiveSearchSystem
            isOpen={showSearchSystem}
            onClose={() => setShowSearchSystem(false)}
            currentUserId={user?.id || ""}
            userRole={user?.role || "viewer"}
            onResultSelect={handleSearchResultSelect}
            onNavigateToLocation={handleNavigateToLocation}
          />
        )}

        {showDataManager && (
          <DataManager
            onClose={() => setShowDataManager(false)}
            onItemLoad={(item: SavedDataItem) => {
              console.log("Loading saved data:", item);
              addNotification({
                type: "success",
                message: `Loaded ${item.name}`,
                duration: 3000
              });
            }}
          />
        )}

        {/* Layout Manager */}
        {showLayoutManager && (
          <LayoutManager
            isOpen={showLayoutManager}
            onClose={() => setShowLayoutManager(false)}
          />
        )}

        {/* User Region Panel (Non-Admin) */}
        {!isAdmin && assignedStates.length > 0 && (
          <div className="absolute bottom-20 left-4 z-20">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="text-yellow-600 text-lg">📍</div>
                <div>
                  <h4 className="text-sm font-bold text-yellow-800">
                    Your Assigned Regions
                  </h4>
                  <p className="text-xs text-yellow-700">
                    {assignedStates.join(", ")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Violation Warning Overlay */}
        {violations.length > 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
              <div className="flex items-start space-x-3">
                <div className="text-red-600 text-xl">⚠️</div>
                <div>
                  <h4 className="text-sm font-bold text-red-800">
                    Geofence Violation Detected
                  </h4>
                  <p className="text-xs text-red-700 mt-1">
                    You attempted to work outside your assigned regions. Please
                    stay within: {assignedStates.join(", ")}
                  </p>
                  <div className="mt-2">
                    <button
                      onClick={clearViolations}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full bg-yellow-50">
        <div className="text-center p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Google Maps API Key Required
          </h3>
          <p className="text-yellow-700 text-sm mb-4">
            Please add your Google Maps API key to the .env file:
          </p>
          <code className="bg-yellow-100 px-3 py-1 rounded text-xs">
            REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
          </code>
        </div>
      </div>
    );
  }

  return (
    <Wrapper
      apiKey={apiKey}
      render={render}
      libraries={["geometry", "places"]}
    />
  );
};

export default ComprehensiveGoogleMapInterface;
