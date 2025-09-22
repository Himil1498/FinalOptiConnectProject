import React, { ReactNode } from 'react';
import { Z_INDEX } from '../../constants/zIndex';

interface ToolboxContainerProps {
  title: string;
  isActive: boolean;
  onToggle: () => void;
  children: ReactNode;
  position: {
    left: string;
    top: string;
    bottom?: string;
    width?: string;
  };
  minHeight?: string;
  className?: string;
  zIndex?: number;
}

/**
 * Unified toolbox container for consistent UI across all map tools
 * Standardizes: width (320px), height (from navbar), spacing, typography, and layout
 */
const ToolboxContainer: React.FC<ToolboxContainerProps> = ({
  title,
  isActive,
  onToggle,
  children,
  position,
  minHeight = "500px", // Increased height for better content visibility
  className = "",
  zIndex = Z_INDEX.TOOLBOX_BASE
}) => {
  if (!isActive) return null;

  return (
    <div
      className={`fixed animate-in slide-in-from-left-4 duration-300 layout-transition ${className}`}
      style={{
        left: position.left,
        top: position.top,
        bottom: position.bottom,
        width: position.width || 'clamp(280px, 320px, min(320px, calc(100vw - 80px)))',
        zIndex,
        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), top 0.3s cubic-bezier(0.4, 0, 0.2, 1), bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'left, top, bottom, transform'
      }}
    >
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col h-full">
        {/* Consistent Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-xl">
          <h3 className="text-sm font-bold text-gray-900 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            {title}
          </h3>
          <button
            onClick={onToggle}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 min-w-[70px] h-7 flex items-center justify-center shadow-sm ${
              isActive
                ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
            }`}
          >
            {isActive ? 'Stop' : 'Start'}
          </button>
        </div>

        {/* Scrollable Content Area - Enhanced overflow handling */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-visible px-4 py-3 space-y-4 toolbox-scrollbar bg-gradient-to-b from-white to-gray-50/50">
          <div className="w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolboxContainer;