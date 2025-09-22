import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Wrapper } from "@googlemaps/react-wrapper";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { usePanelManager } from "../common/PanelManager";
import { useGeofencing } from "./GeofencingSystem";
import { WorkflowPreset } from "../workflow/WorkflowPresets";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { SearchResult, Coordinates, SavedDataItem } from "../../types";

// Import refactored components
import MapContainer from "./MapContainer";
import MapToolsPanel from "./MapToolsPanel";
import MapStatusIndicator from "./MapStatusIndicator";
import MapDataOverlay from "./MapDataOverlay";
import AdminPanelManager from "./AdminPanelManager";
import WorkflowManager from "./WorkflowManager";

// Import map components
import GoogleMapContainer from "./GoogleMapContainer";
import LiveCoordinateDisplay from "./LiveCoordinateDisplay";
import MapControlsPanel from "./MapControlsPanel";
import FloatingToolPanel from "./FloatingToolPanel";
import MultiToolManager from "./MultiToolManager";
import DistanceMeasurementTool from "./DistanceMeasurementTool";
// import DistanceMeasurementToolV2 from "./DistanceMeasurementToolV2";
// import SimpleDistanceTool from "./SimpleDistanceTool";
// import UltraSimpleDistanceTool from "./UltraSimpleDistanceTool";
import PolygonDrawingTool from "./PolygonDrawingTool";
import ElevationTool from "./ElevationTool";
import GeofencingSystem from "./GeofencingSystem";
// import DistanceToolDebugger from "./DistanceToolDebugger";

// Import admin components
import RegionAssignmentSystem from "../admin/RegionAssignmentSystem";
import UserGroupsManagement from "../admin/UserGroupsManagement";
import ManagerDashboard from "../admin/ManagerDashboard";
import DataImportSystem from "../admin/DataImportSystem";
import InfrastructureDataManagement from "../admin/InfrastructureDataManagement";

// Import search and data components
import ComprehensiveSearchSystem from "../search/ComprehensiveSearchSystem";
import DataManager from "../data/DataManager";

// Import common components
import LayoutManager from "../common/LayoutManager";
import KeyboardShortcuts from "../common/KeyboardShortcuts";

// Import workflow components
import WorkflowPresets from "../workflow/WorkflowPresets";

// Import custom hooks
import {
  useMapEventHandlers,
  useWorkflowHandlers,
  usePanelHandlers
} from "./hooks/useMapEventHandlers";

// Import types
import { ComprehensiveGoogleMapInterfaceProps } from "./types/MapInterfaces";

const ComprehensiveGoogleMapInterface: React.FC<
  ComprehensiveGoogleMapInterfaceProps
> = ({ onMapReady }) => {
  const { center, zoom } = useSelector((state: RootState) => state.map);
  const { user } = useAuth();
  const { addNotification } = useTheme();

  // Tool states
  const [isDistanceMeasuring, setIsDistanceMeasuring] = useState(false);
  const [isPolygonDrawing, setIsPolygonDrawing] = useState(false);
  const [isElevationActive, setIsElevationActive] = useState(false);
  const [multiToolMode, setMultiToolMode] = useState(false);
  const [distanceToolHasData, setDistanceToolHasData] = useState(false);
  const [polygonToolHasData, setPolygonToolHasData] = useState(false);
  const [elevationToolHasData, setElevationToolHasData] = useState(false);
  const [activePrimaryTool, setActivePrimaryTool] = useState<string | null>(
    null
  );

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
  const [showWorkflowPresets, setShowWorkflowPresets] = useState(false);

  // Workflow system states
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowPreset | null>(
    null
  );
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState(0);

  // Panel manager hook
  const { registerPanel } = usePanelManager();

  // Register the live coordinates panel
  useEffect(() => {
    registerPanel("live-coordinates", {
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

  // Tool handlers - Enhanced for multi-tool support
  const handleToolActivation = useCallback(
    (toolName: string) => {
      // Handle tool toggling with multi-tool support
      switch (toolName) {
        case "distance":
          if (isDistanceMeasuring) {
            // If already active, deactivate
            setIsDistanceMeasuring(false);
            if (activePrimaryTool === "distance") setActivePrimaryTool(null);
            addNotification({
              type: "info",
              title: "Distance Tool Deactivated",
              message: "Distance measurement stopped",
              duration: 2000
            });
          } else {
            // In multi-tool mode, don't deactivate other tools
            if (!multiToolMode) {
              setIsPolygonDrawing(false);
              setIsElevationActive(false);
            }
            setIsDistanceMeasuring(true);
            setActivePrimaryTool("distance");
            addNotification({
              type: "info",
              title: "Distance Tool Activated",
              message: multiToolMode
                ? "Distance tool active (primary) - other tools remain available"
                : "Click on the map to start measuring distances",
              duration: 3000
            });
          }
          break;
        case "polygon":
          if (isPolygonDrawing) {
            // If already active, deactivate
            setIsPolygonDrawing(false);
            if (activePrimaryTool === "polygon") setActivePrimaryTool(null);
            addNotification({
              type: "info",
              title: "Polygon Tool Deactivated",
              message: "Polygon drawing stopped",
              duration: 2000
            });
          } else {
            // In multi-tool mode, don't deactivate other tools
            if (!multiToolMode) {
              setIsDistanceMeasuring(false);
              setIsElevationActive(false);
            }
            setIsPolygonDrawing(true);
            setActivePrimaryTool("polygon");
            addNotification({
              type: "info",
              title: "Polygon Tool Activated",
              message: multiToolMode
                ? "Polygon tool active (primary) - other tools remain available"
                : "Click on the map to start drawing polygons",
              duration: 3000
            });
          }
          break;
        case "elevation":
          if (isElevationActive) {
            // If already active, deactivate
            setIsElevationActive(false);
            if (activePrimaryTool === "elevation") setActivePrimaryTool(null);
            addNotification({
              type: "info",
              title: "Elevation Tool Deactivated",
              message: "Elevation analysis stopped",
              duration: 2000
            });
          } else {
            // In multi-tool mode, don't deactivate other tools
            if (!multiToolMode) {
              setIsDistanceMeasuring(false);
              setIsPolygonDrawing(false);
            }
            setIsElevationActive(true);
            setActivePrimaryTool("elevation");
            addNotification({
              type: "info",
              title: "Elevation Tool Activated",
              message: multiToolMode
                ? "Elevation tool active (primary) - other tools remain available"
                : "Click on the map to analyze elevation data",
              duration: 3000
            });
          }
          break;
      }
    },
    [
      isDistanceMeasuring,
      isPolygonDrawing,
      isElevationActive,
      multiToolMode,
      activePrimaryTool,
      addNotification
    ]
  );

  // Multi-tool mode toggle
  const toggleMultiToolMode = useCallback(() => {
    setMultiToolMode((prev) => {
      const newMode = !prev;
      addNotification({
        type: "info",
        title: newMode
          ? "Multi-Tool Mode Activated"
          : "Multi-Tool Mode Deactivated",
        message: newMode
          ? "You can now use multiple tools simultaneously with smart suggestions"
          : "Tools will now work in exclusive mode",
        duration: 4000
      });
      return newMode;
    });
  }, [addNotification]);

  // Prepare active tools data for MultiToolManager
  const activeToolsData = useMemo(
    () => [
      {
        id: "distance",
        name: "Distance Measurement",
        isActive: isDistanceMeasuring,
        hasData: distanceToolHasData,
        dataType: "measurements"
      },
      {
        id: "polygon",
        name: "Polygon Drawing",
        isActive: isPolygonDrawing,
        hasData: polygonToolHasData,
        dataType: "polygons"
      },
      {
        id: "elevation",
        name: "Elevation Analysis",
        isActive: isElevationActive,
        hasData: elevationToolHasData,
        dataType: "elevation_profiles"
      }
    ],
    [
      isDistanceMeasuring,
      isPolygonDrawing,
      isElevationActive,
      distanceToolHasData,
      polygonToolHasData,
      elevationToolHasData
    ]
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
        case "workflow":
          setShowWorkflowPresets(!showWorkflowPresets);
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
      showLayoutManager,
      showWorkflowPresets
    ]
  );

  // Search system handlers
  const handleSearchResultSelect = useCallback(
    (result: SearchResult) => {
      // Handle selected search result
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
      // Navigate to coordinates
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

  // Workflow system handlers
  const handleWorkflowStart = useCallback(
    (workflow: WorkflowPreset) => {
      setActiveWorkflow(workflow);
      setCurrentWorkflowStep(0);
      setShowWorkflowPresets(false);

      // Activate the first tool in the workflow
      if (workflow.steps.length > 0) {
        const firstStep = workflow.steps[0];
        handleToolActivation(firstStep.toolId);
      }

      addNotification({
        type: "success",
        title: "Workflow Started",
        message: `Starting "${workflow.name}" - Step 1: ${workflow.steps[0]?.title}`,
        duration: 4000
      });
    },
    [handleToolActivation, addNotification]
  );

  const handleWorkflowAdvance = useCallback(() => {
    if (
      activeWorkflow &&
      currentWorkflowStep < activeWorkflow.steps.length - 1
    ) {
      const nextStep = currentWorkflowStep + 1;
      setCurrentWorkflowStep(nextStep);

      // Activate the next tool
      const nextStepData = activeWorkflow.steps[nextStep];
      handleToolActivation(nextStepData.toolId);

      addNotification({
        type: "info",
        title: "Workflow Advanced",
        message: `Step ${nextStep + 1}: ${nextStepData.title}`,
        duration: 3000
      });
    } else if (activeWorkflow) {
      // Workflow completed
      setActiveWorkflow(null);
      setCurrentWorkflowStep(0);
      addNotification({
        type: "success",
        title: "Workflow Completed",
        message: `"${activeWorkflow.name}" completed successfully!`,
        duration: 4000
      });
    }
  }, [
    activeWorkflow,
    currentWorkflowStep,
    handleToolActivation,
    addNotification
  ]);

  const handleWorkflowCancel = useCallback(() => {
    if (activeWorkflow) {
      setActiveWorkflow(null);
      setCurrentWorkflowStep(0);
      addNotification({
        type: "warning",
        title: "Workflow Cancelled",
        message: `"${activeWorkflow.name}" was cancelled`,
        duration: 3000
      });
    }
  }, [activeWorkflow, addNotification]);

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
        <GoogleMapContainer
          center={center}
          zoom={zoom}
          onMapReady={(map: google.maps.Map) => {
            setMapInstance(map);
            if (onMapReady) onMapReady(map);
          }}
        />

        {/* Live Coordinate Display - Smaller & More Compact */}
        <div className="fixed bottom-16 right-0 z-50">
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
          multiToolMode={multiToolMode}
          onMultiToolToggle={toggleMultiToolMode}
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
          showWorkflowPresets={showWorkflowPresets}
          onToolActivation={handleToolActivation}
          onTogglePanel={handleTogglePanel}
        />

        {/* Multi-Tool System Manager */}
        {multiToolMode && (
          <MultiToolManager
            activeTools={activeToolsData}
            onToolActivation={handleToolActivation}
          />
        )}

        {/* Tool Components */}
        <DistanceMeasurementTool
          isActive={isDistanceMeasuring}
          onToggle={() => handleToolActivation("distance")}
          map={mapInstance}
          mapWidth={800}
          mapHeight={600}
          onDataChange={setDistanceToolHasData}
          isPrimaryTool={activePrimaryTool === "distance"}
          multiToolMode={multiToolMode}
        />

        <PolygonDrawingTool
          isActive={isPolygonDrawing}
          onToggle={() => handleToolActivation("polygon")}
          map={mapInstance}
          mapWidth={800}
          mapHeight={600}
          onDataChange={setPolygonToolHasData}
          isPrimaryTool={activePrimaryTool === "polygon"}
          multiToolMode={multiToolMode}
        />

        <ElevationTool
          isActive={isElevationActive}
          onToggle={() => handleToolActivation("elevation")}
          map={mapInstance}
          mapWidth={800}
          mapHeight={600}
          onDataChange={setElevationToolHasData}
          isPrimaryTool={activePrimaryTool === "elevation"}
          multiToolMode={multiToolMode}
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
              // Region assignments updated
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
              // Loading saved data
              addNotification({
                type: "success",
                message: `Loaded ${item.name}`,
                duration: 3000
              });
            }}
            activeTools={{
              distance: {
                isActive: isDistanceMeasuring,
                hasData: distanceToolHasData
              },
              polygon: {
                isActive: isPolygonDrawing,
                hasData: polygonToolHasData
              },
              elevation: {
                isActive: isElevationActive,
                hasData: elevationToolHasData
              }
            }}
            onToolDataSave={(toolId, data) => {
              addNotification({
                type: "info",
                title: "Tool Data Saved",
                message: `${toolId} data has been saved to the data manager`,
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
              // Region assignments updated
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
              // Loading saved data
              addNotification({
                type: "success",
                message: `Loaded ${item.name}`,
                duration: 3000
              });
            }}
            activeTools={{
              distance: {
                isActive: isDistanceMeasuring,
                hasData: distanceToolHasData
              },
              polygon: {
                isActive: isPolygonDrawing,
                hasData: polygonToolHasData
              },
              elevation: {
                isActive: isElevationActive,
                hasData: elevationToolHasData
              }
            }}
            onToolDataSave={(toolId, data) => {
              addNotification({
                type: "info",
                title: "Tool Data Saved",
                message: `${toolId} data has been saved to the data manager`,
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

        {/* Workflow Presets System */}
        <WorkflowPresets
          isActive={showWorkflowPresets}
          onClose={() => setShowWorkflowPresets(false)}
          onWorkflowStart={handleWorkflowStart}
          activeWorkflow={activeWorkflow}
          currentStep={currentWorkflowStep}
        />

        {/* Global Keyboard Shortcuts */}
        <KeyboardShortcuts
          onToolActivation={handleToolActivation}
          onWorkflowOpen={() => setShowWorkflowPresets(true)}
          onDataManagerOpen={() => setShowDataManager(true)}
          onSearchOpen={() => setShowSearchSystem(true)}
        />

        {/* Active Workflow Status Bar */}
        {activeWorkflow && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg px-6 py-3 shadow-lg">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
                  <span className="font-semibold">{activeWorkflow.name}</span>
                </div>
                <div className="text-sm opacity-90">
                  Step {currentWorkflowStep + 1} of{" "}
                  {activeWorkflow.steps.length}:{" "}
                  {activeWorkflow.steps[currentWorkflowStep]?.title}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleWorkflowAdvance}
                    className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors"
                  >
                    {currentWorkflowStep < activeWorkflow.steps.length - 1
                      ? "Next Step"
                      : "Complete"}
                  </button>
                  <button
                    onClick={handleWorkflowCancel}
                    className="bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded text-sm transition-colors"
                  >
                    Cancel
                  </button>
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
