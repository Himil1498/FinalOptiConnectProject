import { SearchResult, Coordinates, SavedDataItem } from "../../../types";
import { WorkflowPreset } from "../../workflow/WorkflowPresets";

export interface GoogleMapProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  onMapReady?: (map: google.maps.Map) => void;
}

export interface MapContainerProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  onMapReady?: (map: google.maps.Map) => void;
}

export interface MapToolsPanelProps {
  user: any;
  isAdmin: boolean;
  isDistanceMeasuring: boolean;
  isPolygonDrawing: boolean;
  isElevationActive: boolean;
  showSearchSystem: boolean;
  showRegionPanel: boolean;
  showUserGroupsPanel: boolean;
  showManagerDashboard: boolean;
  showDataImport: boolean;
  showInfrastructureData: boolean;
  showDataManager: boolean;
  showLayoutManager: boolean;
  showWorkflowPresets: boolean;
  showKMLLayers: boolean;
  onToolActivation: (toolName: string) => void;
  onTogglePanel: (panelName: string) => void;
}

export interface MapStatusIndicatorProps {
  assignedStates: string[];
  isAdmin: boolean;
  violations: any[];
  clearViolations: () => void;
  mapInstance: google.maps.Map | null;
}

export interface MapDataOverlayProps {
  mapInstance: google.maps.Map | null;
  isDistanceMeasuring: boolean;
  isPolygonDrawing: boolean;
  isElevationActive: boolean;
  distanceToolHasData: boolean;
  polygonToolHasData: boolean;
  elevationToolHasData: boolean;
  setDistanceToolHasData: (hasData: boolean) => void;
  setPolygonToolHasData: (hasData: boolean) => void;
  setElevationToolHasData: (hasData: boolean) => void;
  onToolActivation: (toolName: string) => void;
  assignedStates: string[];
  isGeofencingActive: boolean;
  user: any;
  addNotification: (notification: any) => void;
}

export interface AdminPanelManagerProps {
  user: any;
  isAdmin: boolean;
  showRegionPanel: boolean;
  showUserGroupsPanel: boolean;
  showManagerDashboard: boolean;
  showDataImport: boolean;
  showInfrastructureData: boolean;
  showSearchSystem: boolean;
  showDataManager: boolean;
  showLayoutManager: boolean;
  setShowRegionPanel: (show: boolean) => void;
  setShowUserGroupsPanel: (show: boolean) => void;
  setShowManagerDashboard: (show: boolean) => void;
  setShowDataImport: (show: boolean) => void;
  setShowInfrastructureData: (show: boolean) => void;
  setShowSearchSystem: (show: boolean) => void;
  setShowDataManager: (show: boolean) => void;
  setShowLayoutManager: (show: boolean) => void;
  onSearchResultSelect: (result: SearchResult) => void;
  onNavigateToLocation: (coords: Coordinates) => void;
  activeTools: any;
  addNotification: (notification: any) => void;
}

export interface WorkflowManagerProps {
  showWorkflowPresets: boolean;
  setShowWorkflowPresets: (show: boolean) => void;
  activeWorkflow: WorkflowPreset | null;
  currentWorkflowStep: number;
  onWorkflowStart: (workflow: WorkflowPreset) => void;
  onWorkflowAdvance: () => void;
  onWorkflowCancel: () => void;
  onToolActivation: (toolName: string) => void;
}

export interface ToolData {
  id: string;
  name: string;
  isActive: boolean;
  hasData: boolean;
  dataType: string;
}

export interface ComprehensiveGoogleMapInterfaceProps {
  onMapReady?: (map: google.maps.Map) => void;
}