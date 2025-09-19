import React, { useState, useCallback } from 'react';
import { GoogleMapsComponent } from './GoogleMapsComponent';
import DistanceMeasurementTool from './DistanceMeasurementTool';
import PolygonDrawingTool from './PolygonDrawingTool';
import ElevationTool from './ElevationTool';
import GeofencingSystem, { useGeofencing } from './GeofencingSystem';
import RegionAssignmentSystem from '../admin/RegionAssignmentSystem';
import UserGroupsManagement from '../admin/UserGroupsManagement';
import ManagerDashboard from '../admin/ManagerDashboard';
import DataImportSystem from '../admin/DataImportSystem';
import InfrastructureDataManagement from '../admin/InfrastructureDataManagement';
import ComprehensiveSearchSystem from '../search/ComprehensiveSearchSystem';
import DataManager from '../data/DataManager';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useDataManager } from '../../hooks/useDataManager';
import { SearchResult, Coordinates, SavedDataItem } from '../../types';
import {
  MapIcon,
  MagnifyingGlassIcon,
  CogIcon,
  UsersIcon,
  ChartBarIcon,
  ArrowUpTrayIcon,
  BuildingOfficeIcon,
  DocumentMagnifyingGlassIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

export const IntegratedGoogleMapsInterface: React.FC = () => {
  const { user } = useAuth();
  const { uiState, addNotification } = useTheme();
  const { saveData, loadData } = useDataManager();

  // Tool states
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isDistanceMeasuring, setIsDistanceMeasuring] = useState(false);
  const [isPolygonDrawing, setIsPolygonDrawing] = useState(false);
  const [isElevationActive, setIsElevationActive] = useState(false);

  // Panel states
  const [showRegionPanel, setShowRegionPanel] = useState(false);
  const [showUserGroupsPanel, setShowUserGroupsPanel] = useState(false);
  const [showManagerDashboard, setShowManagerDashboard] = useState(false);
  const [showDataImport, setShowDataImport] = useState(false);
  const [showInfrastructureData, setShowInfrastructureData] = useState(false);
  const [showSearchSystem, setShowSearchSystem] = useState(false);
  const [showDataManager, setShowDataManager] = useState(false);

  // User role checks
  const assignedStates = user?.assignedStates || [];
  const isAdmin = user?.role === 'admin';
  const isGeofencingActive = !isAdmin && assignedStates.length > 0;

  // Initialize geofencing validation
  const { validatePoint, violations, clearViolations } = useGeofencing(
    assignedStates,
    isGeofencingActive
  );

  // Tool handlers
  const handleToolActivation = useCallback((toolName: string) => {
    // Deactivate all tools first
    setIsDistanceMeasuring(false);
    setIsPolygonDrawing(false);
    setIsElevationActive(false);
    setActiveTool(null);

    // Activate the selected tool
    switch (toolName) {
      case 'distance':
        if (!isDistanceMeasuring) {
          setIsDistanceMeasuring(true);
          setActiveTool('distance');
          addNotification({
            type: 'info',
            title: 'Distance Tool Activated',
            message: 'Click on the map to start measuring distances',
            duration: 3000
          });
        }
        break;
      case 'polygon':
        if (!isPolygonDrawing) {
          setIsPolygonDrawing(true);
          setActiveTool('polygon');
          addNotification({
            type: 'info',
            title: 'Polygon Tool Activated',
            message: 'Click on the map to start drawing polygons',
            duration: 3000
          });
        }
        break;
      case 'elevation':
        if (!isElevationActive) {
          setIsElevationActive(true);
          setActiveTool('elevation');
          addNotification({
            type: 'info',
            title: 'Elevation Tool Activated',
            message: 'Click on the map to analyze elevation data',
            duration: 3000
          });
        }
        break;
    }
  }, [isDistanceMeasuring, isPolygonDrawing, isElevationActive, addNotification]);

  const handleToolComplete = useCallback((toolType: string, data: any) => {
    console.log(`${toolType} tool completed with data:`, data);

    addNotification({
      type: 'success',
      title: `${toolType.charAt(0).toUpperCase() + toolType.slice(1)} Completed`,
      message: 'Results have been recorded',
      duration: 3000
    });
  }, [addNotification]);

  // Search system handlers
  const handleSearchResultSelect = useCallback((result: SearchResult) => {
    console.log('Selected search result:', result);
    addNotification({
      type: 'info',
      title: 'Location Selected',
      message: `Navigating to ${result.title}`,
      duration: 2000
    });
  }, [addNotification]);

  const handleNavigateToLocation = useCallback((coords: Coordinates) => {
    console.log('Navigating to:', coords);
    addNotification({
      type: 'success',
      title: 'Navigation',
      message: `Navigating to coordinates: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
      duration: 2000
    });
  }, [addNotification]);

  return (
    <div className="relative h-full w-full">
      {/* Main Google Maps Component */}
      <GoogleMapsComponent
        activeTool={activeTool}
        onToolComplete={handleToolComplete}
      />

      {/* Tool Control Panel */}
      <div className="absolute top-16 left-4 z-30 flex flex-col space-y-2">
        {/* Search Button */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <button
            onClick={() => setShowSearchSystem(!showSearchSystem)}
            className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center ${
              showSearchSystem
                ? 'bg-cyan-500 text-white shadow-lg scale-105'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Comprehensive Search"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Distance Measurement Tool */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <button
            onClick={() => handleToolActivation('distance')}
            className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center relative ${
              isDistanceMeasuring
                ? 'bg-blue-500 text-white shadow-lg scale-105 ring-2 ring-blue-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Distance Measurement Tool"
            aria-pressed={isDistanceMeasuring}
          >
            <span className="text-lg">📏</span>
            {isDistanceMeasuring && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full animate-pulse" />
            )}
          </button>
        </div>

        {/* Polygon Drawing Tool */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <button
            onClick={() => handleToolActivation('polygon')}
            className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center relative ${
              isPolygonDrawing
                ? 'bg-blue-500 text-white shadow-lg scale-105 ring-2 ring-blue-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Polygon Drawing Tool"
            aria-pressed={isPolygonDrawing}
          >
            <span className="text-lg">🔺</span>
            {isPolygonDrawing && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full animate-pulse" />
            )}
          </button>
        </div>

        {/* Elevation Analysis Tool */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <button
            onClick={() => handleToolActivation('elevation')}
            className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center relative ${
              isElevationActive
                ? 'bg-blue-500 text-white shadow-lg scale-105 ring-2 ring-blue-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Elevation Analysis Tool"
            aria-pressed={isElevationActive}
          >
            <span className="text-lg">⛰️</span>
            {isElevationActive && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full animate-pulse" />
            )}
          </button>
        </div>

        {/* Admin Tools Section */}
        {isAdmin && (
          <>
            {/* Region Assignment Tool */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              <button
                onClick={() => setShowRegionPanel(!showRegionPanel)}
                className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center relative ${
                  showRegionPanel
                    ? 'bg-blue-500 text-white shadow-lg scale-105 ring-2 ring-blue-300'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                title="Region Assignment System"
              >
                <MapIcon className="h-5 w-5" />
                {showRegionPanel && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full animate-pulse" />
                )}
              </button>
            </div>

            {/* User Groups Management */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              <button
                onClick={() => setShowUserGroupsPanel(!showUserGroupsPanel)}
                className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center ${
                  showUserGroupsPanel
                    ? 'bg-indigo-500 text-white shadow-lg scale-105'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                title="User Groups Management"
              >
                <UsersIcon className="h-5 w-5" />
              </button>
            </div>
          </>
        )}

        {/* Manager/Admin Tools */}
        {(isAdmin || user?.role === 'manager') && (
          <>
            {/* Manager Dashboard */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              <button
                onClick={() => setShowManagerDashboard(!showManagerDashboard)}
                className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center ${
                  showManagerDashboard
                    ? 'bg-emerald-500 text-white shadow-lg scale-105'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                title="Manager Dashboard"
              >
                <ChartBarIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Data Import System */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              <button
                onClick={() => setShowDataImport(!showDataImport)}
                className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center ${
                  showDataImport
                    ? 'bg-orange-500 text-white shadow-lg scale-105'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                title="Data Import System"
              >
                <ArrowUpTrayIcon className="h-5 w-5" />
              </button>
            </div>
          </>
        )}

        {/* Infrastructure Data Management */}
        {(isAdmin || user?.role === 'manager' || user?.role === 'technician') && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            <button
              onClick={() => setShowInfrastructureData(!showInfrastructureData)}
              className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center ${
                showInfrastructureData
                  ? 'bg-teal-500 text-white shadow-lg scale-105'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
              title="Infrastructure Data Management"
            >
              <BuildingOfficeIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Data Manager */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <button
            onClick={() => setShowDataManager(!showDataManager)}
            className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center ${
              showDataManager
                ? 'bg-violet-500 text-white shadow-lg scale-105'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Data Manager"
          >
            <ArchiveBoxIcon className="h-5 w-5" />
          </button>
        </div>
      </div>


      {/* Tool Components */}
      <DistanceMeasurementTool
        isActive={isDistanceMeasuring}
        onToggle={() => setIsDistanceMeasuring(!isDistanceMeasuring)}
        mapWidth={800}
        mapHeight={600}
      />

      <PolygonDrawingTool
        isActive={isPolygonDrawing}
        onToggle={() => setIsPolygonDrawing(!isPolygonDrawing)}
        mapWidth={800}
        mapHeight={600}
      />

      <ElevationTool
        isActive={isElevationActive}
        onToggle={() => setIsElevationActive(!isElevationActive)}
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
            type: 'error',
            title: 'Access Denied',
            message: `You cannot work in this area. Please stay within your assigned regions: ${assignedStates.join(', ')}`,
            duration: 8000
          });
        }}
      />

      {/* Panel Components */}
      {showRegionPanel && (
        <RegionAssignmentSystem
          isAdmin={isAdmin}
          currentUserId={user?.id || ''}
          onAssignmentChange={(assignments) => {
            console.log('Region assignments updated:', assignments);
          }}
        />
      )}

      {showUserGroupsPanel && (
        <UserGroupsManagement
          isOpen={showUserGroupsPanel}
          onClose={() => setShowUserGroupsPanel(false)}
          currentUserId={user?.id || ''}
        />
      )}

      {showManagerDashboard && (
        <ManagerDashboard
          isOpen={showManagerDashboard}
          onClose={() => setShowManagerDashboard(false)}
          currentUserId={user?.id || ''}
        />
      )}

      {showDataImport && (
        <DataImportSystem
          isOpen={showDataImport}
          onClose={() => setShowDataImport(false)}
          currentUserId={user?.id || ''}
        />
      )}

      {showInfrastructureData && (
        <InfrastructureDataManagement
          isOpen={showInfrastructureData}
          onClose={() => setShowInfrastructureData(false)}
          currentUserId={user?.id || ''}
          userRole={user?.role || 'viewer'}
        />
      )}

      {showSearchSystem && (
        <ComprehensiveSearchSystem
          isOpen={showSearchSystem}
          onClose={() => setShowSearchSystem(false)}
          currentUserId={user?.id || ''}
          userRole={user?.role || 'viewer'}
          onResultSelect={handleSearchResultSelect}
          onNavigateToLocation={handleNavigateToLocation}
        />
      )}

      {showDataManager && (
        <DataManager
          onClose={() => setShowDataManager(false)}
          onItemLoad={(item: SavedDataItem) => {
            console.log('Loading saved data:', item);
            addNotification({
              type: 'success',
              message: `Loaded ${item.name}`,
              duration: 3000
            });
          }}
        />
      )}

      {/* User Region Panel (Non-Admin) */}
      {!isAdmin && assignedStates.length > 0 && (
        <div className="absolute top-4 right-16 z-20">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-sm font-medium text-yellow-800">
              Assigned Regions
            </div>
            <div className="text-xs text-yellow-600 mt-1">
              {assignedStates.join(', ')}
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
                  You attempted to work outside your assigned regions. Please stay within: {assignedStates.join(', ')}
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