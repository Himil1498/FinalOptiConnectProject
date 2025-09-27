import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  MapPinIcon
} from "@heroicons/react/24/outline";
import { useFullscreen } from "../../hooks/useFullscreen";
import {
  themeClasses,
  buttonVariants,
  focusStyles,
  componentPatterns
} from "../../utils/lightThemeHelper";
import SimpleTooltip from "../common/SimpleTooltip";

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
  showWorkflowPresets: boolean;
  showKMLLayers: boolean;

  // Infrastructure data visibility
  showPOPData?: boolean;
  showSubPOPData?: boolean;
  showManualData?: boolean;

  // Handlers
  onToolActivation: (toolName: string) => void;
  onTogglePanel: (panelName: string) => void;
  onTogglePOPData?: (show: boolean) => void;
  onToggleSubPOPData?: (show: boolean) => void;
  onToggleManualData?: (show: boolean) => void;
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
  showWorkflowPresets,
  showKMLLayers,
  showPOPData = false,
  showSubPOPData = false,
  showManualData = false,
  onToolActivation,
  onTogglePanel,
  onTogglePOPData,
  onToggleSubPOPData,
  onToggleManualData
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isFullscreen } = useFullscreen();
  const navigate = useNavigate();

  // Detect sidebar collapse state
  useEffect(() => {
    const checkSidebarState = () => {
      const selectors = [
        ".dashboard-sidebar",
        '[class*="sidebar"]',
        'nav[class*="left"]',
        "aside",
        '[class*="navigation"]'
      ];

      let sidebar = null;
      for (const selector of selectors) {
        sidebar = document.querySelector(selector);
        if (sidebar) break;
      }

      if (sidebar) {
        const rect = sidebar.getBoundingClientRect();
        setSidebarCollapsed(rect.width < 80);
      }
    };

    checkSidebarState();
    const observer = new MutationObserver(checkSidebarState);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"]
    });

    window.addEventListener("resize", checkSidebarState);
    document.addEventListener("click", checkSidebarState);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", checkSidebarState);
      document.removeEventListener("click", checkSidebarState);
    };
  }, []);

  // Simple tool activation without multi-tool functionality
  const handleToolActivation = (toolId: string) => {
    if (toolId === "search") {
      onTogglePanel("search");
    } else {
      onToolActivation(toolId);
    }
  };

  const tools = [
    {
      id: "workflow",
      icon: "🚀",
      label: "Workflows",
      isActive: showWorkflowPresets,
      color: "indigo",
      iconColor: "text-indigo-600",
      onClick: () => onTogglePanel("workflow")
    },
    {
      id: "search",
      icon: MagnifyingGlassIcon,
      label: "Search",
      isActive: showSearchSystem, // Use actual tool state
      color: "cyan",
      iconColor: "text-cyan-600",
      onClick: () => handleToolActivation("search")
    },
    {
      id: "distance",
      icon: "📏",
      label: "Distance",
      isActive: isDistanceMeasuring, // Use actual tool state
      color: "blue",
      iconColor: "text-blue-600",
      onClick: () => handleToolActivation("distance")
    },
    {
      id: "polygon",
      icon: "🔺",
      label: "Polygon",
      isActive: isPolygonDrawing, // Use actual tool state
      color: "green",
      iconColor: "text-green-600",
      onClick: () => handleToolActivation("polygon")
    },
    {
      id: "elevation",
      icon: "⛰️",
      label: "Elevation",
      isActive: isElevationActive, // Use actual tool state
      color: "purple",
      iconColor: "text-purple-600",
      onClick: () => handleToolActivation("elevation")
    }
  ];

  const adminTools = [
    {
      id: "users",
      icon: UsersIcon,
      label: "Users",
      isActive: showUserGroupsPanel,
      color: "indigo",
      iconColor: "text-indigo-600",
      onClick: () => navigate("/users")
    }
  ];

  const dataTools = [
    {
      id: "infrastructure",
      icon: BuildingOfficeIcon,
      label: "Infrastructure",
      isActive: showInfrastructureData,
      color: "teal",
      iconColor: "text-teal-600",
      onClick: () => navigate("/infrastructure")
    },
    {
      id: "data",
      icon: ArchiveBoxIcon,
      label: "Data Manager",
      isActive: showDataManager,
      color: "violet",
      iconColor: "text-violet-600",
      onClick: () => navigate("/data-manager")
    },
    {
      id: "layout",
      icon: Bars3Icon,
      label: "Layout Manager",
      isActive: showLayoutManager,
      color: "indigo",
      iconColor: "text-indigo-600",
      onClick: () => onTogglePanel("layout")
    }
  ];

  if (isMinimized) {
    return (
      <div
        className={`fixed top-1/2 transform -translate-y-1/2 z-50 transition-all duration-300 ${
          isFullscreen ? "left-2" : "left-4"
        }`}
      >
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
    <div
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] z-50
                    transition-all duration-300 ${isCollapsed ? "w-12" : "w-52"}
                    ${isFullscreen ? "" : ""}
                    max-w-[calc(100vw-40px)] sm:max-w-none`}
    >
      <div
        className={`h-full bg-gradient-to-b from-white via-gray-50/98 to-gray-100/95 backdrop-blur-sm border-r-2 border-gray-200/60 shadow-2xl flex flex-col`}
      >
        {/* Header - Enhanced with better styling */}
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          } p-3 border-b-2 border-gray-200/80 bg-gradient-to-r from-white via-gray-50 to-white shadow-sm`}
        >
          {!isCollapsed && (
            <h3 className={`text-sm font-bold text-gray-900 flex items-center`}>
              <Bars3Icon className="w-5 h-5 mr-2 text-indigo-600" />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Tools Panel
              </span>
            </h3>
          )}
          <SimpleTooltip
            content={isCollapsed ? "Expand Panel" : "Collapse Panel"}
            position="right"
          >
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`relative group p-2 ${
                themeClasses.interactive.subtle
              } rounded-lg transition-all duration-300 ease-in-out ${
                focusStyles.default
              }
                         hover:scale-110 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-lg hover:border-blue-200 border border-transparent active:scale-95
                         ${
                           isCollapsed
                             ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                             : ""
                         }`}
            >
              {/* Animated background glow */}
              <div
                className={`absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${
                  isCollapsed ? "opacity-10" : ""
                }`}
              ></div>

              {/* Icon container with enhanced styling */}
              <div className="relative flex items-center justify-center">
                {isCollapsed ? (
                  <div className="flex items-center">
                    <ChevronRightIcon
                      className={`h-4 w-4 ${themeClasses.text.tertiary} group-hover:text-blue-600 transition-colors duration-200`}
                    />
                    <div className="ml-1 w-1 h-4 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div className="mr-1 w-1 h-4 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-200"></div>
                    <ChevronLeftIcon
                      className={`h-4 w-4 ${themeClasses.text.tertiary} group-hover:text-blue-600 transition-colors duration-200`}
                    />
                  </div>
                )}
              </div>

              {/* Pulse animation for collapsed state */}
              {isCollapsed && (
                <div className="absolute inset-0 rounded-lg border-2 border-blue-300 opacity-0 animate-ping"></div>
              )}
            </button>
          </SimpleTooltip>
        </div>

        {/* Tools Grid */}
        <div
          className={`flex-1 overflow-y-auto p-2 space-y-3 ${
            isCollapsed ? "scrollbar-hide" : "custom-scrollbar"
          }`}
        >
          {/* Core Tools Section */}
          {!isCollapsed && (
            <div className="mb-1">
              <h4
                className={`text-xs font-bold text-blue-700 uppercase tracking-wider mb-1 flex items-center`}
              >
                <MapIcon className="w-4 h-4 mr-1.5" />
                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Map Tools
                </span>
              </h4>
            </div>
          )}
          <div
            className={`grid gap-1 ${
              isCollapsed ? "grid-cols-1" : "grid-cols-1"
            }`}
          >
            {tools.map((tool) => {
              const toolButton = (
                <button
                  key={tool.id}
                  onClick={tool.onClick}
                  className={`w-full flex items-center ${
                    isCollapsed
                      ? "justify-center p-2"
                      : "justify-start px-3 py-2"
                  }
                            rounded-lg transition-all duration-300 ease-in-out text-sm font-medium ${
                              focusStyles.default
                            }
                            border border-transparent hover:border-gray-200 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5
                            active:scale-95 active:translate-y-0 cursor-pointer
                            ${
                              tool.isActive
                                ? `bg-gradient-to-r from-${tool.color}-500 to-${tool.color}-600 text-white shadow-xl border-${tool.color}-600 transform scale-105 shadow-${tool.color}-200`
                                : `bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 hover:from-white hover:to-gray-50 hover:text-gray-900 hover:shadow-gray-200`
                            }`}
                >
                  <div
                    className={`${
                      isCollapsed ? "flex justify-center" : "flex items-center"
                    }`}
                  >
                    {typeof tool.icon === "string" ? (
                      <span
                        className={`${isCollapsed ? "text-lg" : "text-sm"}`}
                      >
                        {tool.icon}
                      </span>
                    ) : (
                      <tool.icon
                        className={`${isCollapsed ? "h-6 w-6" : "h-4 w-4"} ${
                          tool.isActive
                            ? "text-white"
                            : tool.iconColor || "text-gray-600"
                        }`}
                      />
                    )}
                  </div>
                  {!isCollapsed && (
                    <span className="ml-3 flex-1 text-left">{tool.label}</span>
                  )}
                  {tool.isActive && !isCollapsed && (
                    <div className="ml-auto w-2 h-2 bg-white/80 rounded-full animate-pulse shadow-sm" />
                  )}
                </button>
              );

              return isCollapsed ? (
                <SimpleTooltip
                  key={tool.id}
                  content={tool.label}
                  position="right"
                >
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
                  <div className="relative mb-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gradient border-indigo-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 py-1 bg-white text-gray-500 rounded-full border border-indigo-200 shadow-sm">
                        <ShieldCheckIcon className="w-3 h-3 inline mr-1 text-indigo-500" />
                        <span className="text-indigo-600 font-semibold">
                          Admin
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div
                className={`grid gap-1 ${
                  isCollapsed ? "grid-cols-1" : "grid-cols-1"
                }`}
              >
                {adminTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={tool.onClick}
                    className={`w-full flex items-center ${
                      isCollapsed
                        ? "justify-center p-2"
                        : "justify-start px-3 py-2"
                    }
                          rounded-lg transition-all duration-300 ease-in-out text-sm font-medium ${
                            focusStyles.default
                          }
                          border border-transparent hover:border-gray-200 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5
                          active:scale-95 active:translate-y-0 cursor-pointer
                          ${
                            tool.isActive
                              ? `bg-gradient-to-r from-${tool.color}-500 to-${tool.color}-600 text-white shadow-lg border-${tool.color}-600 transform scale-105`
                              : `bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 hover:text-gray-900`
                          }`}
                    title={tool.label}
                  >
                    <div
                      className={`${
                        isCollapsed
                          ? "flex justify-center"
                          : "flex items-center"
                      }`}
                    >
                      <tool.icon
                        className={`${isCollapsed ? "h-6 w-6" : "h-4 w-4"} ${
                          tool.isActive
                            ? "text-white"
                            : tool.iconColor || "text-gray-600"
                        }`}
                      />
                    </div>
                    {!isCollapsed && (
                      <span className="ml-3 flex-1 text-left">
                        {tool.label}
                      </span>
                    )}
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
                <div className="relative mb-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gradient border-violet-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 py-1 bg-white text-gray-500 rounded-full border border-violet-200 shadow-sm">
                      <CubeIcon className="w-3 h-3 inline mr-1 text-violet-500" />
                      <span className="text-violet-600 font-semibold">
                        Data
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div
              className={`grid gap-1 ${
                isCollapsed ? "grid-cols-1" : "grid-cols-1"
              }`}
            >
              {dataTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={tool.onClick}
                  className={`w-full flex items-center ${
                    isCollapsed
                      ? "justify-center p-2"
                      : "justify-start px-3 py-2"
                  }
                          rounded-lg transition-all duration-300 ease-in-out text-sm font-medium ${
                            focusStyles.default
                          }
                          border border-transparent hover:border-gray-200 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5
                          active:scale-95 active:translate-y-0 cursor-pointer
                          ${
                            tool.isActive
                              ? `bg-gradient-to-r from-${tool.color}-500 to-${tool.color}-600 text-white shadow-lg border-${tool.color}-600 transform scale-105`
                              : `bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 hover:text-gray-900`
                          }`}
                  title={tool.label}
                >
                  <div
                    className={`${
                      isCollapsed ? "flex justify-center" : "flex items-center"
                    }`}
                  >
                    <tool.icon
                      className={`${isCollapsed ? "h-6 w-6" : "h-4 w-4"} ${
                        tool.isActive
                          ? "text-white"
                          : tool.iconColor || "text-gray-600"
                      }`}
                    />
                  </div>
                  {!isCollapsed && (
                    <span className="ml-3 flex-1 text-left">{tool.label}</span>
                  )}
                  {tool.isActive && !isCollapsed && (
                    <div className="ml-auto w-2 h-2 bg-white/80 rounded-full animate-pulse shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </>

          {/* Infrastructure Visibility Section */}
          {(onTogglePOPData || onToggleSubPOPData || onToggleManualData) && (
            <>
              {!isCollapsed && (
                <div className="mb-2">
                  <div className="relative mb-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gradient border-blue-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 py-1 bg-white text-gray-500 rounded-full border border-blue-200 shadow-sm">
                        <BuildingOfficeIcon className="w-3 h-3 inline mr-1 text-blue-500" />
                        <span className="text-blue-600 font-semibold">
                          Infrastructure
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div className={`space-y-1 ${isCollapsed ? "px-1" : "px-0"}`}>
                {/* POP Data Toggle */}
                {onTogglePOPData && (
                  <div
                    className={`flex items-center ${
                      isCollapsed ? "justify-center" : "justify-between"
                    }
                                  bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-2`}
                  >
                    {!isCollapsed && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">📡</span>
                        <span className="text-xs font-medium text-red-700">
                          POP Data
                        </span>
                      </div>
                    )}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showPOPData}
                        onChange={(e) => onTogglePOPData(e.target.checked)}
                        className="sr-only peer"
                        title={isCollapsed ? "Toggle POP Data" : ""}
                      />
                      <div className="relative w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                )}

                {/* Sub POP Data Toggle */}
                {onToggleSubPOPData && (
                  <div
                    className={`flex items-center ${
                      isCollapsed ? "justify-center" : "justify-between"
                    }
                                  bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-2`}
                  >
                    {!isCollapsed && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">🏢</span>
                        <span className="text-xs font-medium text-green-700">
                          Sub POP
                        </span>
                      </div>
                    )}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showSubPOPData}
                        onChange={(e) => onToggleSubPOPData(e.target.checked)}
                        className="sr-only peer"
                        title={isCollapsed ? "Toggle Sub POP Data" : ""}
                      />
                      <div className="relative w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>
                )}

                {/* Manual Data Toggle */}
                {onToggleManualData && (
                  <div
                    className={`flex items-center ${
                      isCollapsed ? "justify-center" : "justify-between"
                    }
                                  bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-2`}
                  >
                    {!isCollapsed && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">✏️</span>
                        <span className="text-xs font-medium text-blue-700">
                          Manual
                        </span>
                      </div>
                    )}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showManualData}
                        onChange={(e) => onToggleManualData(e.target.checked)}
                        className="sr-only peer"
                        title={isCollapsed ? "Toggle Manual Data" : ""}
                      />
                      <div className="relative w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FloatingToolPanel;
