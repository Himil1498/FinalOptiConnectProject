import React from "react";
import FloatingToolPanel from "./FloatingToolPanel";
import MapControlsPanel from "./MapControlsPanel";
import { MapToolsPanelProps } from "./types/MapInterfaces";

interface MapToolsPanelExtendedProps extends MapToolsPanelProps {
  mapInstance: google.maps.Map | null;
  currentMapType: string;
  onMapTypeChange: (mapType: string) => void;
  multiToolMode: boolean;
  onMultiToolToggle: () => void;
}

const MapToolsPanel: React.FC<MapToolsPanelExtendedProps> = ({
  user,
  isAdmin,
  isDistanceMeasuring,
  isPolygonDrawing,
  isElevationActive,
  showSearchSystem,
  showRegionPanel,
  showUserGroupsPanel,
  showManagerDashboard,
  showDataImport,
  showInfrastructureData,
  showDataManager,
  showLayoutManager,
  showWorkflowPresets,
  showKMLLayers,
  onToolActivation,
  onTogglePanel,
  mapInstance,
  currentMapType,
  onMapTypeChange,
  multiToolMode,
  onMultiToolToggle
}) => {
  return (
    <>
      {/* Map Controls Panel */}
      <MapControlsPanel
        map={mapInstance}
        currentMapType={currentMapType}
        onMapTypeChange={onMapTypeChange}
        multiToolMode={multiToolMode}
        onMultiToolToggle={onMultiToolToggle}
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
        showKMLLayers={showKMLLayers}
        onToolActivation={onToolActivation}
        onTogglePanel={onTogglePanel}
      />
    </>
  );
};

export default MapToolsPanel;