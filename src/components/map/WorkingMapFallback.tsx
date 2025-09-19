import React, { useState, useCallback } from 'react';
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

const WorkingMapFallback: React.FC = () => {
  const { user } = useAuth();
  const { uiState, setLoading, addNotification } = useTheme();
  const { saveData, loadData } = useDataManager();
  const [zoom, setZoom] = useState(5);
  const [coordinates, setCoordinates] = useState({ lat: 20.5937, lng: 78.9629 });
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isDistanceMeasuring, setIsDistanceMeasuring] = useState(false);
  const [isPolygonDrawing, setIsPolygonDrawing] = useState(false);
  const [isElevationActive, setIsElevationActive] = useState(false);
  const [showRegionPanel, setShowRegionPanel] = useState(false);
  const [showUserGroupsPanel, setShowUserGroupsPanel] = useState(false);
  const [showManagerDashboard, setShowManagerDashboard] = useState(false);
  const [showDataImport, setShowDataImport] = useState(false);
  const [showInfrastructureData, setShowInfrastructureData] = useState(false);
  const [showSearchSystem, setShowSearchSystem] = useState(false);
  const [showDataManager, setShowDataManager] = useState(false);
  const [geofenceViolations, setGeofenceViolations] = useState<Array<{
    point: { lat: number; lng: number };
    timestamp: Date;
    type: string;
  }>>([]);

  // Get user's assigned states (empty array for admin means access to all states)
  const assignedStates = user?.assignedStates || [];
  const isAdmin = user?.role === 'admin';
  const isGeofencingActive = !isAdmin && assignedStates.length > 0;

  // Initialize geofencing validation
  const { validatePoint, violations, clearViolations } = useGeofencing(
    assignedStates,
    isGeofencingActive
  );

  // Handle geofence violations
  const handleGeofenceViolation = useCallback((point: { lat: number; lng: number }, violationType: string) => {
    setGeofenceViolations(prev => [...prev, {
      point,
      timestamp: new Date(),
      type: violationType
    }]);

    // Show notification to user instead of alert
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('showNotification', {
        detail: {
          type: 'error',
          title: 'Access Denied',
          message: `You cannot work in this area. Please stay within your assigned regions: ${assignedStates.join(', ')}`,
          duration: 8000
        }
      }));
    }
  }, [assignedStates]);

  // Tool click handlers with geofencing validation
  const handleToolClick = useCallback((toolName: string, clickHandler: () => void) => {
    return () => {
      if (isGeofencingActive) {
        // For now, just activate the tool. Validation happens on individual clicks within tools
        clickHandler();
      } else {
        clickHandler();
      }
    };
  }, [isGeofencingActive]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't update mouse coordinates when tools are active to avoid interference
    if (isDistanceMeasuring || isPolygonDrawing || isElevationActive) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Simple coordinate calculation for demo
    const lat = 37.6 - (y / rect.height) * (37.6 - 6.4);
    const lng = 68.1 + (x / rect.width) * (97.25 - 68.1);

    setMouseCoords({ lat, lng });
  };

  const handleZoomIn = () => setZoom(Math.min(zoom + 1, 18));
  const handleZoomOut = () => setZoom(Math.max(zoom - 1, 1));
  const handleResetView = () => {
    setZoom(5);
    setCoordinates({ lat: 20.5937, lng: 78.9629 });
    setMouseCoords(null);
  };

  // Search system handlers
  const handleSearchResultSelect = useCallback((result: SearchResult) => {
    console.log('Selected search result:', result);
    // Here you would typically update the map state, show details, etc.
  }, []);

  const handleNavigateToLocation = useCallback((coords: Coordinates) => {
    setCoordinates(coords);
    setZoom(15); // Zoom in when navigating to a specific location
    console.log('Navigating to:', coords);
  }, []);

  const getActiveToolInfo = () => {
    if (isDistanceMeasuring) return { name: 'Distance Measurement', icon: '📏', description: 'Click on map to measure distances' };
    if (isPolygonDrawing) return { name: 'Polygon Drawing', icon: '🔺', description: 'Click to draw polygon boundaries' };
    if (isElevationActive) return { name: 'Elevation Analysis', icon: '⛰️', description: 'Click to analyze elevation data' };
    if (showRegionPanel) return { name: 'Region Assignment', icon: '🗺️', description: 'Manage user region assignments' };
    return null;
  };

  const activeToolInfo = getActiveToolInfo();

  return (
    <div className="relative h-full w-full bg-gradient-to-br from-blue-100 via-green-50 to-blue-200 overflow-hidden">
      {/* Active Tool Status Indicator */}
      {activeToolInfo && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 animate-fade-in">
          <span className="text-lg">{activeToolInfo.icon}</span>
          <div className="text-sm">
            <div className="font-semibold">{activeToolInfo.name}</div>
            <div className="text-blue-100 text-xs">{activeToolInfo.description}</div>
          </div>
        </div>
      )}
      {/* Simulated Map Background */}
      <div
        className="absolute inset-0 cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMouseCoords(null)}
        style={{
          backgroundImage: `
            radial-gradient(circle at 30% 60%, rgba(34, 197, 94, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 70% 40%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)
          `,
        }}
      >
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: `${40 + zoom * 5}px ${40 + zoom * 5}px`,
          }}
        />

        {/* Simulated Cities/Points */}
        <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-red-500 rounded-full shadow-lg animate-pulse">
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-700 whitespace-nowrap">
            Mumbai
          </div>
        </div>
        <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-red-500 rounded-full shadow-lg animate-pulse">
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-700 whitespace-nowrap">
            Delhi
          </div>
        </div>
        <div className="absolute top-2/3 left-2/5 w-3 h-3 bg-red-500 rounded-full shadow-lg animate-pulse">
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-700 whitespace-nowrap">
            Bangalore
          </div>
        </div>
        <div className="absolute top-2/3 left-3/5 w-3 h-3 bg-red-500 rounded-full shadow-lg animate-pulse">
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-700 whitespace-nowrap">
            Chennai
          </div>
        </div>

        {/* Network Coverage Areas */}
        <div className="absolute top-1/4 left-1/4 w-24 h-24 border-2 border-blue-400 rounded-full opacity-30 animate-ping"></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-green-400 rounded-full opacity-40 animate-pulse"></div>
        <div className="absolute top-3/4 left-1/3 w-20 h-20 border-2 border-purple-400 rounded-full opacity-35 animate-bounce"></div>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
        {/* Search Button */}
        <div className="bg-white rounded-lg shadow-lg p-1">
          <button
            onClick={() => setShowSearchSystem(!showSearchSystem)}
            className={`block p-2 rounded transition-colors ${
              showSearchSystem
                ? 'bg-cyan-100 text-cyan-600 hover:bg-cyan-200'
                : 'hover:bg-gray-100'
            }`}
            title="Comprehensive Search"
          >
            <span className="text-sm">🔍</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-1">
          <button
            onClick={handleZoomIn}
            className="block p-2 hover:bg-gray-100 rounded-t transition-colors"
            title="Zoom In"
          >
            <span className="text-lg font-bold">+</span>
          </button>
          <button
            onClick={handleZoomOut}
            className="block p-2 hover:bg-gray-100 rounded-b transition-colors border-t border-gray-200"
            title="Zoom Out"
          >
            <span className="text-lg font-bold">-</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-1 border border-gray-200">
          <button
            onClick={handleResetView}
            className="block p-3 hover:bg-gray-100 rounded transition-all duration-200 text-gray-700"
            title="Reset View"
            aria-label="Reset View"
          >
            <span className="text-lg">🏠</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-1 border-2 transition-all duration-200">
          <button
            onClick={handleToolClick('distance', () => {
              setIsDistanceMeasuring(!isDistanceMeasuring);
              if (!isDistanceMeasuring) {
                setIsPolygonDrawing(false);
                setIsElevationActive(false);
              }
            })}
            className={`block p-3 rounded transition-all duration-200 relative ${
              isDistanceMeasuring
                ? 'bg-blue-500 text-white shadow-lg scale-105 ring-2 ring-blue-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Distance Measurement Tool"
            aria-label="Distance Measurement Tool"
            aria-pressed={isDistanceMeasuring}
          >
            <span className="text-lg">📏</span>
            {isDistanceMeasuring && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full animate-pulse" />
            )}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-1 border-2 transition-all duration-200">
          <button
            onClick={handleToolClick('polygon', () => {
              setIsPolygonDrawing(!isPolygonDrawing);
              if (!isPolygonDrawing) {
                setIsDistanceMeasuring(false);
                setIsElevationActive(false);
              }
            })}
            className={`block p-3 rounded transition-all duration-200 relative ${
              isPolygonDrawing
                ? 'bg-blue-500 text-white shadow-lg scale-105 ring-2 ring-blue-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Polygon Drawing Tool"
            aria-label="Polygon Drawing Tool"
            aria-pressed={isPolygonDrawing}
          >
            <span className="text-lg">🔺</span>
            {isPolygonDrawing && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full animate-pulse" />
            )}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-1 border-2 transition-all duration-200">
          <button
            onClick={handleToolClick('elevation', () => {
              setIsElevationActive(!isElevationActive);
              if (!isElevationActive) {
                setIsDistanceMeasuring(false);
                setIsPolygonDrawing(false);
              }
            })}
            className={`block p-3 rounded transition-all duration-200 relative ${
              isElevationActive
                ? 'bg-blue-500 text-white shadow-lg scale-105 ring-2 ring-blue-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Elevation Analysis Tool"
            aria-label="Elevation Analysis Tool"
            aria-pressed={isElevationActive}
          >
            <span className="text-lg">⛰️</span>
            {isElevationActive && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full animate-pulse" />
            )}
          </button>
        </div>

        {/* Region Assignment Button (Admin Only) */}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow-lg p-1 border-2 transition-all duration-200">
            <button
              onClick={() => setShowRegionPanel(!showRegionPanel)}
              className={`block p-3 rounded transition-all duration-200 relative ${
                showRegionPanel
                  ? 'bg-blue-500 text-white shadow-lg scale-105 ring-2 ring-blue-300'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
              title="Region Assignment System"
              aria-label="Region Assignment System"
              aria-pressed={showRegionPanel}
            >
              <span className="text-lg">🗺️</span>
              {showRegionPanel && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full animate-pulse" />
              )}
            </button>
          </div>
        )}

        {/* User Groups Management Button (Admin Only) */}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow-lg p-1">
            <button
              onClick={() => setShowUserGroupsPanel(!showUserGroupsPanel)}
              className={`block p-2 rounded transition-colors ${
                showUserGroupsPanel
                  ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                  : 'hover:bg-gray-100'
              }`}
              title="User Groups Management"
            >
              <span className="text-sm">👥</span>
            </button>
          </div>
        )}

        {/* Manager Dashboard Button (Admin/Manager Only) */}
        {(isAdmin || user?.role === 'manager') && (
          <div className="bg-white rounded-lg shadow-lg p-1">
            <button
              onClick={() => setShowManagerDashboard(!showManagerDashboard)}
              className={`block p-2 rounded transition-colors ${
                showManagerDashboard
                  ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                  : 'hover:bg-gray-100'
              }`}
              title="Manager Dashboard"
            >
              <span className="text-sm">📊</span>
            </button>
          </div>
        )}

        {/* Data Import System Button (Admin/Manager Only) */}
        {(isAdmin || user?.role === 'manager') && (
          <div className="bg-white rounded-lg shadow-lg p-1">
            <button
              onClick={() => setShowDataImport(!showDataImport)}
              className={`block p-2 rounded transition-colors ${
                showDataImport
                  ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                  : 'hover:bg-gray-100'
              }`}
              title="Data Import System"
            >
              <span className="text-sm">📤</span>
            </button>
          </div>
        )}

        {/* Infrastructure Data Management Button (Admin/Manager/Technician) */}
        {(isAdmin || user?.role === 'manager' || user?.role === 'technician') && (
          <div className="bg-white rounded-lg shadow-lg p-1">
            <button
              onClick={() => setShowInfrastructureData(!showInfrastructureData)}
              className={`block p-2 rounded transition-colors ${
                showInfrastructureData
                  ? 'bg-teal-100 text-teal-600 hover:bg-teal-200'
                  : 'hover:bg-gray-100'
              }`}
              title="Infrastructure Data Management"
            >
              <span className="text-sm">🏗️</span>
            </button>
          </div>
        )}

        {/* Data Manager Button */}
        <div className="bg-white rounded-lg shadow-lg p-1">
          <button
            onClick={() => setShowDataManager(!showDataManager)}
            className={`block p-2 rounded transition-colors ${
              showDataManager
                ? 'bg-violet-100 text-violet-600 hover:bg-violet-200'
                : 'hover:bg-gray-100'
            }`}
            title="Data Manager"
          >
            <span className="text-sm">💾</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg px-3 py-2">
          <div className="text-xs text-gray-600 font-medium">
            Zoom: {zoom}
          </div>
        </div>
      </div>

      {/* Map Type Selector and Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-white rounded-lg shadow-lg p-3 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm">🗺️</span>
              <span className="text-sm font-medium text-gray-700">Roadmap</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">📋</span>
              <span className="text-xs text-gray-500">Demo Mode</span>
            </div>
          </div>

        </div>
      </div>

      {/* Live Coordinates Display */}
      {mouseCoords && (
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-white rounded-lg shadow-lg p-3 min-w-56">
            <div className="text-xs text-gray-500 mb-1 font-medium">
              Coordinates (Decimal)
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600 w-8">Lat:</span>
                <span className="text-sm font-mono text-gray-900">
                  {mouseCoords.lat.toFixed(6)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600 w-8">Lng:</span>
                <span className="text-sm font-mono text-gray-900">
                  {mouseCoords.lng.toFixed(6)}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-400">
                Hover to update coordinates
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Banner */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl p-6 max-w-md text-center border border-blue-200">
          <div className="text-blue-600 mb-4">
            <span className="text-4xl">🗺️</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Opti Connect Interactive Map
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Interactive map simulation showing network infrastructure across India.
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Network Nodes</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Coverage Areas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-w-sm">
          <div className="flex items-start space-x-2">
            <span className="text-green-600 mt-0.5">⚙️</span>
            <div>
              <h4 className="text-sm font-medium text-green-800">Interactive Demo Map</h4>
              <p className="text-xs text-green-700 mt-1">
                Fully functional map simulation with coordinate tracking and zoom controls.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Distance Measurement Tool */}
      <DistanceMeasurementTool
        isActive={isDistanceMeasuring}
        onToggle={() => setIsDistanceMeasuring(!isDistanceMeasuring)}
        mapWidth={800}
        mapHeight={600}
      />

      {/* Polygon Drawing Tool */}
      <PolygonDrawingTool
        isActive={isPolygonDrawing}
        onToggle={() => setIsPolygonDrawing(!isPolygonDrawing)}
        mapWidth={800}
        mapHeight={600}
      />

      {/* Elevation Tool */}
      <ElevationTool
        isActive={isElevationActive}
        onToggle={() => setIsElevationActive(!isElevationActive)}
        mapWidth={800}
        mapHeight={600}
      />

      {/* Geofencing System */}
      <GeofencingSystem
        assignedStates={assignedStates}
        isActive={isGeofencingActive}
        mapWidth={800}
        mapHeight={600}
        onGeofenceViolation={handleGeofenceViolation}
      />

      {/* Region Assignment System */}
      {showRegionPanel && (
        <RegionAssignmentSystem
          isAdmin={isAdmin}
          currentUserId={user?.id || ''}
          onAssignmentChange={(assignments) => {
            console.log('Region assignments updated:', assignments);
          }}
        />
      )}

      {/* User Groups Management System */}
      {showUserGroupsPanel && (
        <UserGroupsManagement
          isOpen={showUserGroupsPanel}
          onClose={() => setShowUserGroupsPanel(false)}
          currentUserId={user?.id || ''}
        />
      )}

      {/* Manager Dashboard */}
      {showManagerDashboard && (
        <ManagerDashboard
          isOpen={showManagerDashboard}
          onClose={() => setShowManagerDashboard(false)}
          currentUserId={user?.id || ''}
        />
      )}

      {/* Data Import System */}
      {showDataImport && (
        <DataImportSystem
          isOpen={showDataImport}
          onClose={() => setShowDataImport(false)}
          currentUserId={user?.id || ''}
        />
      )}

      {/* Infrastructure Data Management */}
      {showInfrastructureData && (
        <InfrastructureDataManagement
          isOpen={showInfrastructureData}
          onClose={() => setShowInfrastructureData(false)}
          currentUserId={user?.id || ''}
          userRole={user?.role || 'viewer'}
        />
      )}

      {/* Comprehensive Search System */}
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

      {/* Data Manager */}
      {showDataManager && (
        <DataManager
          onClose={() => setShowDataManager(false)}
          onItemLoad={(item: SavedDataItem) => {
            // Handle loading saved data based on type
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
        <div className="absolute top-4 right-4 z-20">
          <RegionAssignmentSystem
            isAdmin={false}
            currentUserId={user?.id || ''}
          />
        </div>
      )}

      {/* Geofence Violation Alerts */}
      {violations.length > 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
            <div className="flex items-start space-x-3">
              <div className="text-red-600 text-xl">⚠️</div>
              <div>
                <h4 className="text-sm font-bold text-red-800">Geofence Violation Detected</h4>
                <p className="text-xs text-red-700 mt-1">
                  You attempted to work outside your assigned regions. Please stay within: {assignedStates.join(', ')}
                </p>
                <div className="mt-2">
                  <button
                    onClick={clearViolations}
                    className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
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

export default WorkingMapFallback;