import React, { useState, useEffect } from "react";
import {
  InformationCircleIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  MapIcon,
  WifiIcon
} from "@heroicons/react/24/outline";

interface FooterProps {
  isMapView?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Footer: React.FC<FooterProps> = ({
  isMapView = false,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const currentYear = new Date().getFullYear();
  const [sidebarWidth, setSidebarWidth] = useState(0);

  // Detect sidebar width
  useEffect(() => {
    const checkSidebarState = () => {
      const selectors = [
        ".dashboard-sidebar",
        '[class*="sidebar"]',
        'nav[class*="left"]',
        "aside",
        '[class*="navigation"]',
        '[class*="menu"]',
        ".fixed.left-0",
        ".fixed.inset-y-0"
      ];

      let sidebar = null;
      for (const selector of selectors) {
        sidebar = document.querySelector(selector);
        if (sidebar) break;
      }

      if (sidebar) {
        const rect = sidebar.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(sidebar);
        const isVisible =
          computedStyle.display !== "none" &&
          computedStyle.visibility !== "hidden" &&
          rect.width > 0;

        if (isVisible) {
          setSidebarWidth(rect.width);
        } else {
          setSidebarWidth(0);
        }
      } else {
        setSidebarWidth(0);
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

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", checkSidebarState);
    };
  }, []);

  if (isCollapsed) {
    return (
      <footer
        className="fixed bottom-0 right-0 bg-white text-gray-900 border-t border-gray-200 shadow-lg z-40"
        style={{ left: `${sidebarWidth}px` }}
      >
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <MapIcon className="h-4 w-4 text-blue-400 mr-2" />
              <span className="text-sm font-medium text-gray-900">
                Opti Connect GIS Platform
              </span>
            </div>
            <div className="flex items-center text-green-600">
              <WifiIcon className="h-3 w-3 mr-1" />
              <span className="text-xs">Connected</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleCollapse}
              className="text-gray-600 hover:text-gray-900 text-xs px-2 py-1 rounded transition-colors"
              title="Expand footer"
            >
              ↑ Expand
            </button>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className="fixed bottom-0 right-0 bg-white text-gray-900 border-t border-gray-200 shadow-lg z-40"
      style={{ left: `${sidebarWidth}px` }}
    >
      <div className="px-4 py-3">
        {/* Main Footer Content */}
        <div className="flex items-center justify-between mb-2">
          {/* Left Section - Branding */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <MapIcon className="h-5 w-5 text-blue-400 mr-2" />
              <div>
                <span className="text-sm font-bold text-gray-900">
                  Opti Connect GIS Platform
                </span>
                <span className="text-xs text-gray-500 ml-2">v2.1.0</span>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="hidden md:flex items-center space-x-4 text-xs">
              <div className="flex items-center text-green-600">
                <WifiIcon className="h-3 w-3 mr-1" />
                <span>Connected</span>
              </div>
              {isMapView && (
                <div className="flex items-center text-blue-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-1 animate-pulse"></div>
                  <span>Live Data</span>
                </div>
              )}
            </div>
          </div>

          {/* Center Section - Quick Actions */}
          <div className="hidden lg:flex items-center space-x-3">
            <button
              className="flex items-center px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-md transition-colors"
              title="Help & Documentation"
            >
              <QuestionMarkCircleIcon className="h-3 w-3 mr-1" />
              Help
            </button>
            <button
              className="flex items-center px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-md transition-colors"
              title="Settings"
            >
              <CogIcon className="h-3 w-3 mr-1" />
              Settings
            </button>
            <button
              className="flex items-center px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-md transition-colors"
              title="About"
            >
              <InformationCircleIcon className="h-3 w-3 mr-1" />
              About
            </button>
          </div>

          {/* Right Section - Legal & Collapse */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3 text-xs text-gray-500">
              <button className="hover:text-gray-900 transition-colors">
                Privacy
              </button>
              <button className="hover:text-gray-900 transition-colors">
                Terms
              </button>
              <span>© {currentYear}</span>
            </div>
            <button
              onClick={onToggleCollapse}
              className="text-gray-600 hover:text-gray-900 text-xs px-2 py-1 rounded transition-colors"
              title="Collapse footer"
            >
              ↓ Collapse
            </button>
          </div>
        </div>

        {/* Bottom Line - Additional Info */}
        <div className="text-xs text-gray-400 text-center lg:text-left">
          Professional telecommunications infrastructure management system
        </div>
      </div>
    </footer>
  );
};

export default Footer;
