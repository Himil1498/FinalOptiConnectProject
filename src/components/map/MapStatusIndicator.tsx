import React from "react";
import LiveCoordinateDisplay from "./LiveCoordinateDisplay";
import { MapStatusIndicatorProps } from "./types/MapInterfaces";

const MapStatusIndicator: React.FC<MapStatusIndicatorProps> = ({
  assignedStates,
  isAdmin,
  violations,
  clearViolations,
  mapInstance
}) => {
  return (
    <>
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
    </>
  );
};

export default MapStatusIndicator;