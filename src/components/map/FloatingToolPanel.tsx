import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  UsersIcon,
  ChartBarIcon,
  ArrowUpTrayIcon,
  BuildingOfficeIcon,
  ArchiveBoxIcon,
  MapIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useFullscreen } from '../../hooks/useFullscreen';
import { themeClasses, buttonVariants, focusStyles, componentPatterns } from '../../utils/lightThemeHelper';
import SimpleTooltip from '../common/SimpleTooltip';

interface FloatingToolPanelProps {
  user: any;
  isAdmin: boolean;

  // Tool states
  isDistanceMeasuring: boolean;
  isPolygonDrawing: boolean;
  isElevationActive: boolean;

  // Panel states
  showSearchSystem: boolean;
  showRegionPanel: boolean;
  showUserGroupsPanel: boolean;
  showManagerDashboard: boolean;
  showDataImport: boolean;
  showInfrastructureData: boolean;
  showDataManager: boolean;
  showLayoutManager: boolean;

  // Handlers
  onToolActivation: (toolName: string) => void;
  onTogglePanel: (panelName: string) => void;
}

const FloatingToolPanel: React.FC<FloatingToolPanelProps> = ({
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
  onToolActivation,
  onTogglePanel,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { isFullscreen } = useFullscreen();

  // Simple tool activation without multi-tool functionality
  const handleToolActivation = (toolId: string) => {
    if (toolId === 'search') {
      onTogglePanel('search');
    } else {
      onToolActivation(toolId);
    }
  };

  const tools = [
    {
      id: 'search',
      icon: MagnifyingGlassIcon,
      label: 'Search',
      isActive: showSearchSystem, // Use actual tool state
      color: 'cyan',
      iconColor: 'text-cyan-600',
      onClick: () => handleToolActivation('search')
    },
    {
      id: 'distance',
      icon: '📏',
      label: 'Distance',
      isActive: isDistanceMeasuring, // Use actual tool state
      color: 'blue',
      iconColor: 'text-blue-600',
      onClick: () => handleToolActivation('distance')
    },
    {
      id: 'polygon',
      icon: '🔺',
      label: 'Polygon',
      isActive: isPolygonDrawing, // Use actual tool state
      color: 'green',
      iconColor: 'text-green-600',
      onClick: () => handleToolActivation('polygon')
    },
    {
      id: 'elevation',
      icon: '⛰️',
      label: 'Elevation',
      isActive: isElevationActive, // Use actual tool state
      color: 'purple',
      iconColor: 'text-purple-600',
      onClick: () => handleToolActivation('elevation')
    }
  ];

  const adminTools = [
    {
      id: 'region',
      icon: MapIcon,
      label: 'Regions',
      isActive: showRegionPanel,
      color: 'blue',
      iconColor: 'text-blue-600',
      onClick: () => onTogglePanel('region')
    },
    {
      id: 'users',
      icon: UsersIcon,
      label: 'Users',
      isActive: showUserGroupsPanel,
      color: 'indigo',
      iconColor: 'text-indigo-600',
      onClick: () => onTogglePanel('users')
    }
  ];

  const managerTools = [
    {
      id: 'dashboard',
      icon: ChartBarIcon,
      label: 'Dashboard',
      isActive: showManagerDashboard,
      color: 'emerald',
      iconColor: 'text-emerald-600',
      onClick: () => onTogglePanel('dashboard')
    },
    {
      id: 'import',
      icon: ArrowUpTrayIcon,
      label: 'Import',
      isActive: showDataImport,
      color: 'orange',
      iconColor: 'text-orange-600',
      onClick: () => onTogglePanel('import')
    }
  ];

  const dataTools = [
    {
      id: 'infrastructure',
      icon: BuildingOfficeIcon,
      label: 'Infrastructure',
      isActive: showInfrastructureData,
      color: 'teal',
      iconColor: 'text-teal-600',
      onClick: () => onTogglePanel('infrastructure')
    },
    {
      id: 'data',
      icon: ArchiveBoxIcon,
      label: 'Data Manager',
      isActive: showDataManager,
      color: 'violet',
      iconColor: 'text-violet-600',
      onClick: () => onTogglePanel('data')
    },
    {
      id: 'layout',
      icon: Bars3Icon,
      label: 'Layout Manager',
      isActive: showLayoutManager,
      color: 'indigo',
      iconColor: 'text-indigo-600',
      onClick: () => onTogglePanel('layout')
    }
  ];

  if (isMinimized) {
    return (
      <div className={`fixed top-1/2 transform -translate-y-1/2 z-50 transition-all duration-300 ${
        isFullscreen ? 'left-2' : 'left-4'
      }`}>
        <button
          onClick={() => setIsMinimized(false)}
          className={`${themeClasses.background.elevated} ${themeClasses.interactive.default}
                   ${themeClasses.border.default} rounded-full p-3 ${themeClasses.shadow.lg}
                   transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-xl
                   hover:-translate-y-1 active:scale-95 active:translate-y-0 ${focusStyles.button}`}
          title="Expand Tools"
        >
          <Bars3Icon className={`h-5 w-5 ${themeClasses.text.secondary}`} />
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed top-16 left-0 h-[calc(100vh-4rem)] z-50
                    transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-52'}
                    ${isFullscreen ? '' : ''}`}>
      <div className={`h-full bg-gradient-to-b from-white to-gray-50/95 backdrop-blur-sm border-r border-gray-200/50 shadow-xl flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-2 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white`}>
          {!isCollapsed && (
            <h3 className={`text-xs font-semibold text-gray-800 flex items-center`}>
              <Bars3Icon className="w-4 h-4 mr-2 text-indigo-600" />
              Tools Panel
            </h3>
          )}
          <SimpleTooltip content={isCollapsed ? 'Expand Panel' : 'Collapse Panel'} position="right">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-2 ${themeClasses.interactive.subtle} rounded transition-all duration-300 ease-in-out ${focusStyles.default}
                         hover:scale-110 hover:bg-gray-100 hover:shadow-md active:scale-95`}
            >
            {isCollapsed ? (
              <ChevronRightIcon className={`h-4 w-4 ${themeClasses.text.tertiary}`} />
            ) : (
              <ChevronLeftIcon className={`h-4 w-4 ${themeClasses.text.tertiary}`} />
            )}
            </button>
          </SimpleTooltip>
        </div>

        {/* Tools Grid */}
        <div className={`flex-1 overflow-y-auto p-2 space-y-3 ${isCollapsed ? 'scrollbar-hide' : 'custom-scrollbar'}`}>
          {/* Core Tools Section */}
          {!isCollapsed && (
            <div className="mb-1">
              <h4 className={`text-xs font-medium text-blue-600 uppercase tracking-wide mb-1 flex items-center`}>
                <MapIcon className="w-3 h-3 mr-1" />
                Map Tools
              </h4>
            </div>
          )}
          <div className={`grid gap-1 ${isCollapsed ? 'grid-cols-1' : 'grid-cols-1'}`}>
            {tools.map((tool) => {
              const toolButton = (
                <button
                  key={tool.id}
                  onClick={tool.onClick}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-start px-3 py-2'}
                            rounded-lg transition-all duration-300 ease-in-out text-xs font-medium ${focusStyles.default}
                            border border-transparent hover:border-gray-200 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5
                            active:scale-95 active:translate-y-0 cursor-pointer
                            ${tool.isActive
                              ? `bg-gradient-to-r from-${tool.color}-500 to-${tool.color}-600 text-white shadow-xl border-${tool.color}-600 transform scale-105 shadow-${tool.color}-200`
                              : `bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 hover:from-white hover:to-gray-50 hover:text-gray-900 hover:shadow-gray-200`
                            }`}
                >
                  <div className={`${isCollapsed ? 'flex justify-center' : 'flex items-center'}`}>
                    {typeof tool.icon === 'string' ? (
                      <span className="text-sm">{tool.icon}</span>
                    ) : (
                      <tool.icon className={`h-4 w-4 ${tool.isActive ? 'text-white' : tool.iconColor || 'text-gray-600'}`} />
                    )}
                  </div>
                  {!isCollapsed && <span className="ml-3 flex-1 text-left">{tool.label}</span>}
                  {tool.isActive && !isCollapsed && (
                    <div className="ml-auto w-2 h-2 bg-white/80 rounded-full animate-pulse shadow-sm" />
                  )}
                </button>
              );

              return isCollapsed ? (
                <SimpleTooltip key={tool.id} content={tool.label} position="right">
                  {toolButton}
                </SimpleTooltip>
              ) : (
                toolButton
              );
            })}
          </div>

          {/* Admin Tools Section */}
          {isAdmin && (
            <>
              {!isCollapsed && (
                <div className="mb-1">
                  <div className="relative mb-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-gray-500">
                        <ShieldCheckIcon className="w-3 h-3 inline mr-1" />
                      </span>
                    </div>
                  </div>
                  <h4 className={`text-xs font-medium text-indigo-600 uppercase tracking-wide mb-1`}>
                    Admin Tools
                  </h4>
                </div>
              )}
              <div className={`grid gap-1 ${isCollapsed ? 'grid-cols-1' : 'grid-cols-1'}`}>
                {adminTools.map((tool) => (
              <button
                key={tool.id}
                onClick={tool.onClick}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-start px-3 py-2'}
                          rounded-lg transition-all duration-300 ease-in-out text-xs font-medium ${focusStyles.default}
                          border border-transparent hover:border-gray-200 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5
                          active:scale-95 active:translate-y-0 cursor-pointer
                          ${tool.isActive
                            ? `bg-gradient-to-r from-${tool.color}-500 to-${tool.color}-600 text-white shadow-lg border-${tool.color}-600 transform scale-105`
                            : `bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 hover:text-gray-900`
                          }`}
                title={tool.label}
              >
                <div className={`${isCollapsed ? 'flex justify-center' : 'flex items-center'}`}>
                  <tool.icon className={`h-4 w-4 ${tool.isActive ? 'text-white' : tool.iconColor || 'text-gray-600'}`} />
                </div>
                {!isCollapsed && <span className="ml-3 flex-1 text-left">{tool.label}</span>}
                {tool.isActive && !isCollapsed && (
                  <div className="ml-auto w-2 h-2 bg-white/80 rounded-full animate-pulse shadow-sm" />
                )}
              </button>
                ))}
              </div>
            </>
          )}

          {/* Manager Tools Section */}
          {(isAdmin || user?.role === 'manager') && (
            <>
              {!isCollapsed && (
                <div className="mb-2">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gradient bg-gradient-to-r from-transparent via-emerald-300 to-transparent"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">
                        <WrenchScrewdriverIcon className="w-4 h-4 inline mr-1" />
                      </span>
                    </div>
                  </div>
                  <h4 className={`text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2`}>
                    Manager Tools
                  </h4>
                </div>
              )}
              <div className={`grid gap-1 ${isCollapsed ? 'grid-cols-1' : 'grid-cols-1'}`}>
                {managerTools.map((tool) => (
              <button
                key={tool.id}
                onClick={tool.onClick}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-start px-3 py-2'}
                          rounded-lg transition-all duration-300 ease-in-out text-xs font-medium ${focusStyles.default}
                          border border-transparent hover:border-gray-200 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5
                          active:scale-95 active:translate-y-0 cursor-pointer
                          ${tool.isActive
                            ? `bg-gradient-to-r from-${tool.color}-500 to-${tool.color}-600 text-white shadow-lg border-${tool.color}-600 transform scale-105`
                            : `bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 hover:text-gray-900`
                          }`}
                title={tool.label}
              >
                <div className={`${isCollapsed ? 'flex justify-center' : 'flex items-center'}`}>
                  <tool.icon className={`h-4 w-4 ${tool.isActive ? 'text-white' : tool.iconColor || 'text-gray-600'}`} />
                </div>
                {!isCollapsed && <span className="ml-3 flex-1 text-left">{tool.label}</span>}
                {tool.isActive && !isCollapsed && (
                  <div className="ml-auto w-2 h-2 bg-white/80 rounded-full animate-pulse shadow-sm" />
                )}
              </button>
                ))}
              </div>
            </>
          )}

          {/* Data Tools Section */}
          <>
            {!isCollapsed && (
              <div className="mb-2">
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gradient bg-gradient-to-r from-transparent via-violet-300 to-transparent"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      <CubeIcon className="w-4 h-4 inline mr-1" />
                    </span>
                  </div>
                </div>
                <h4 className={`text-xs font-semibold text-violet-600 uppercase tracking-wide mb-2`}>
                  Data Tools
                </h4>
              </div>
            )}
            <div className={`grid gap-1 ${isCollapsed ? 'grid-cols-1' : 'grid-cols-1'}`}>
              {dataTools.map((tool) => (
              <button
                key={tool.id}
                onClick={tool.onClick}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-start px-3 py-2'}
                          rounded-lg transition-all duration-300 ease-in-out text-xs font-medium ${focusStyles.default}
                          border border-transparent hover:border-gray-200 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5
                          active:scale-95 active:translate-y-0 cursor-pointer
                          ${tool.isActive
                            ? `bg-gradient-to-r from-${tool.color}-500 to-${tool.color}-600 text-white shadow-lg border-${tool.color}-600 transform scale-105`
                            : `bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 hover:text-gray-900`
                          }`}
                title={tool.label}
              >
                <div className={`${isCollapsed ? 'flex justify-center' : 'flex items-center'}`}>
                  <tool.icon className={`h-4 w-4 ${tool.isActive ? 'text-white' : tool.iconColor || 'text-gray-600'}`} />
                </div>
                {!isCollapsed && <span className="ml-3 flex-1 text-left">{tool.label}</span>}
                {tool.isActive && !isCollapsed && (
                  <div className="ml-auto w-2 h-2 bg-white/80 rounded-full animate-pulse shadow-sm" />
                )}
              </button>
              ))}
            </div>
          </>
        </div>

      </div>

    </div>
  );
};

export default FloatingToolPanel;