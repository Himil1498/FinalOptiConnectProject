import React, { useMemo } from "react";
import DistanceMeasurementTool from "./DistanceMeasurementTool";
import PolygonDrawingTool from "./PolygonDrawingTool";
import ElevationTool from "./ElevationTool";
import MultiToolManager from "./MultiToolManager";
import GeofencingSystem from "./GeofencingSystem";
import { MapDataOverlayProps, ToolData } from "./types/MapInterfaces";

const MapDataOverlay: React.FC<MapDataOverlayProps> = ({
  mapInstance,
  isDistanceMeasuring,
  isPolygonDrawing,
  isElevationActive,
  distanceToolHasData,
  polygonToolHasData,
  elevationToolHasData,
  setDistanceToolHasData,
  setPolygonToolHasData,
  setElevationToolHasData,
  onToolActivation,
  assignedStates,
  isGeofencingActive,
  user,
  addNotification
}) => {
  // Prepare active tools data for MultiToolManager
  const activeToolsData: ToolData[] = useMemo(() => [
    {
      id: 'distance',
      name: 'Distance Measurement',
      isActive: isDistanceMeasuring,
      hasData: distanceToolHasData,
      dataType: 'measurements'
    },
    {
      id: 'polygon',
      name: 'Polygon Drawing',
      isActive: isPolygonDrawing,
      hasData: polygonToolHasData,
      dataType: 'polygons'
    },
    {
      id: 'elevation',
      name: 'Elevation Analysis',
      isActive: isElevationActive,
      hasData: elevationToolHasData,
      dataType: 'elevation_profiles'
    }
  ], [
    isDistanceMeasuring,
    isPolygonDrawing,
    isElevationActive,
    distanceToolHasData,
    polygonToolHasData,
    elevationToolHasData
  ]);

  // Check if multi-tool mode is active (more than one tool active)
  const multiToolMode = activeToolsData.filter(tool => tool.isActive).length > 1;

  return (
    <>
      {/* Multi-Tool System Manager */}
      {multiToolMode && (
        <MultiToolManager
          activeTools={activeToolsData}
          onToolActivation={onToolActivation}
        />
      )}

      {/* Tool Components */}
      <DistanceMeasurementTool
        isActive={isDistanceMeasuring}
        onToggle={() => onToolActivation('distance')}
        map={mapInstance}
        mapWidth={800}
        mapHeight={600}
        onDataChange={setDistanceToolHasData}
      />

      <PolygonDrawingTool
        isActive={isPolygonDrawing}
        onToggle={() => onToolActivation('polygon')}
        map={mapInstance}
        mapWidth={800}
        mapHeight={600}
        onDataChange={setPolygonToolHasData}
      />

      <ElevationTool
        isActive={isElevationActive}
        onToggle={() => onToolActivation('elevation')}
        map={mapInstance}
        mapWidth={800}
        mapHeight={600}
        onDataChange={setElevationToolHasData}
      />

      {/* Geofencing System */}
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
    </>
  );
};

export default MapDataOverlay;