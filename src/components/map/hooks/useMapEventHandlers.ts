import React, { useCallback, useMemo } from "react";
import { SearchResult, Coordinates } from "../../../types";
import { WorkflowPreset } from "../../workflow/WorkflowPresets";

export interface UseMapEventHandlersProps {
  isDistanceMeasuring: boolean;
  isPolygonDrawing: boolean;
  isElevationActive: boolean;
  multiToolMode: boolean;
  addNotification: (notification: any) => void;
  setIsDistanceMeasuring: (active: boolean) => void;
  setIsPolygonDrawing: (active: boolean) => void;
  setIsElevationActive: (active: boolean) => void;
  setMultiToolMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useMapEventHandlers = ({
  isDistanceMeasuring,
  isPolygonDrawing,
  isElevationActive,
  multiToolMode,
  addNotification,
  setIsDistanceMeasuring,
  setIsPolygonDrawing,
  setIsElevationActive,
  setMultiToolMode
}: UseMapEventHandlersProps) => {

  // Tool handlers - Enhanced for multi-tool support
  const handleToolActivation = useCallback(
    (toolName: string) => {
      switch (toolName) {
        case "distance":
          if (isDistanceMeasuring) {
            setIsDistanceMeasuring(false);
            addNotification({
              type: "info",
              title: "Distance Tool Deactivated",
              message: "Distance measurement stopped",
              duration: 2000
            });
          } else {
            if (!multiToolMode) {
              setIsPolygonDrawing(false);
              setIsElevationActive(false);
            }
            setIsDistanceMeasuring(true);
            addNotification({
              type: "info",
              title: "Distance Tool Activated",
              message: multiToolMode
                ? "Distance tool active - other tools remain available"
                : "Click on the map to start measuring distances",
              duration: 3000
            });
          }
          break;

        case "polygon":
          if (isPolygonDrawing) {
            setIsPolygonDrawing(false);
            addNotification({
              type: "info",
              title: "Polygon Tool Deactivated",
              message: "Polygon drawing stopped",
              duration: 2000
            });
          } else {
            if (!multiToolMode) {
              setIsDistanceMeasuring(false);
              setIsElevationActive(false);
            }
            setIsPolygonDrawing(true);
            addNotification({
              type: "info",
              title: "Polygon Tool Activated",
              message: multiToolMode
                ? "Polygon tool active - other tools remain available"
                : "Click on the map to start drawing polygons",
              duration: 3000
            });
          }
          break;

        case "elevation":
          if (isElevationActive) {
            setIsElevationActive(false);
            addNotification({
              type: "info",
              title: "Elevation Tool Deactivated",
              message: "Elevation analysis stopped",
              duration: 2000
            });
          } else {
            if (!multiToolMode) {
              setIsDistanceMeasuring(false);
              setIsPolygonDrawing(false);
            }
            setIsElevationActive(true);
            addNotification({
              type: "info",
              title: "Elevation Tool Activated",
              message: multiToolMode
                ? "Elevation tool active - other tools remain available"
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
      addNotification,
      setIsDistanceMeasuring,
      setIsPolygonDrawing,
      setIsElevationActive
    ]
  );

  // Multi-tool mode toggle
  const toggleMultiToolMode = useCallback(() => {
    setMultiToolMode(prev => {
      const newMode = !prev;
      addNotification({
        type: "info",
        title: newMode ? "Multi-Tool Mode Activated" : "Multi-Tool Mode Deactivated",
        message: newMode
          ? "You can now use multiple tools simultaneously with smart suggestions"
          : "Tools will now work in exclusive mode",
        duration: 4000
      });
      return newMode;
    });
  }, [addNotification, setMultiToolMode]);

  // Search system handlers
  const handleSearchResultSelect = useCallback(
    (result: SearchResult) => {
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
      addNotification({
        type: "success",
        title: "Navigation",
        message: `Navigating to coordinates: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
        duration: 2000
      });
    },
    [addNotification]
  );

  return {
    handleToolActivation,
    toggleMultiToolMode,
    handleSearchResultSelect,
    handleNavigateToLocation
  };
};

export interface UseWorkflowHandlersProps {
  activeWorkflow: WorkflowPreset | null;
  currentWorkflowStep: number;
  setActiveWorkflow: (workflow: WorkflowPreset | null) => void;
  setCurrentWorkflowStep: (step: number) => void;
  setShowWorkflowPresets: (show: boolean) => void;
  handleToolActivation: (toolName: string) => void;
  addNotification: (notification: any) => void;
}

export const useWorkflowHandlers = ({
  activeWorkflow,
  currentWorkflowStep,
  setActiveWorkflow,
  setCurrentWorkflowStep,
  setShowWorkflowPresets,
  handleToolActivation,
  addNotification
}: UseWorkflowHandlersProps) => {

  const handleWorkflowStart = useCallback((workflow: WorkflowPreset) => {
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
  }, [setActiveWorkflow, setCurrentWorkflowStep, setShowWorkflowPresets, handleToolActivation, addNotification]);

  const handleWorkflowAdvance = useCallback(() => {
    if (activeWorkflow && currentWorkflowStep < activeWorkflow.steps.length - 1) {
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
  }, [activeWorkflow, currentWorkflowStep, setActiveWorkflow, setCurrentWorkflowStep, handleToolActivation, addNotification]);

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
  }, [activeWorkflow, setActiveWorkflow, setCurrentWorkflowStep, addNotification]);

  return {
    handleWorkflowStart,
    handleWorkflowAdvance,
    handleWorkflowCancel
  };
};

export interface UsePanelHandlersProps {
  showSearchSystem: boolean;
  showRegionPanel: boolean;
  showUserGroupsPanel: boolean;
  showManagerDashboard: boolean;
  showDataImport: boolean;
  showInfrastructureData: boolean;
  showDataManager: boolean;
  showLayoutManager: boolean;
  showWorkflowPresets: boolean;
  setShowSearchSystem: (show: boolean) => void;
  setShowRegionPanel: (show: boolean) => void;
  setShowUserGroupsPanel: (show: boolean) => void;
  setShowManagerDashboard: (show: boolean) => void;
  setShowDataImport: (show: boolean) => void;
  setShowInfrastructureData: (show: boolean) => void;
  setShowDataManager: (show: boolean) => void;
  setShowLayoutManager: (show: boolean) => void;
  setShowWorkflowPresets: (show: boolean) => void;
}

export const usePanelHandlers = ({
  showSearchSystem,
  showRegionPanel,
  showUserGroupsPanel,
  showManagerDashboard,
  showDataImport,
  showInfrastructureData,
  showDataManager,
  showLayoutManager,
  showWorkflowPresets,
  setShowSearchSystem,
  setShowRegionPanel,
  setShowUserGroupsPanel,
  setShowManagerDashboard,
  setShowDataImport,
  setShowInfrastructureData,
  setShowDataManager,
  setShowLayoutManager,
  setShowWorkflowPresets
}: UsePanelHandlersProps) => {

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
      showWorkflowPresets,
      setShowSearchSystem,
      setShowRegionPanel,
      setShowUserGroupsPanel,
      setShowManagerDashboard,
      setShowDataImport,
      setShowInfrastructureData,
      setShowDataManager,
      setShowLayoutManager,
      setShowWorkflowPresets
    ]
  );

  return {
    handleTogglePanel
  };
};