import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  MinusIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';
import { themeClasses, focusStyles, componentPatterns, iconColors } from '../../utils/lightThemeHelper';

export interface PanelPosition {
  x: number;
  y: number;
}

export interface SnapZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface DraggablePanelProps {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultPosition?: PanelPosition;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  canMinimize?: boolean;
  canMaximize?: boolean;
  canClose?: boolean;
  canResize?: boolean;
  snapZones?: SnapZone[];
  snapThreshold?: number;
  onClose?: () => void;
  onPositionChange?: (position: PanelPosition) => void;
  onMinimize?: (minimized: boolean) => void;
  onMaximize?: (maximized: boolean) => void;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  zIndex?: number;
  isVisible?: boolean;
}


const DraggablePanel: React.FC<DraggablePanelProps> = ({
  id,
  title,
  children,
  defaultPosition = { x: 50, y: 50 },
  minWidth = 280,
  minHeight = 200,
  maxWidth,
  maxHeight,
  canMinimize = true,
  canMaximize = true,
  canClose = false,
  canResize = true,
  snapZones = [],
  snapThreshold = 30,
  onClose,
  onPositionChange,
  onMinimize,
  onMaximize,
  className = '',
  headerClassName = '',
  contentClassName = '',
  zIndex = 50,
  isVisible = true
}) => {
  const [position, setPosition] = useState<PanelPosition>(defaultPosition);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [dimensions, setDimensions] = useState({ width: minWidth, height: minHeight });

  const panelRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Get screen dimensions for maximize functionality
  const getScreenDimensions = useCallback(() => {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }, []);


  // Handle minimize
  const handleMinimize = useCallback(() => {
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
    onMinimize?.(newMinimized);
  }, [isMinimized, onMinimize]);

  // Handle maximize
  const handleMaximize = useCallback(() => {
    const newMaximized = !isMaximized;
    setIsMaximized(newMaximized);

    if (newMaximized) {
      const screen = getScreenDimensions();
      setDimensions({ width: screen.width - 40, height: screen.height - 40 });
      setPosition({ x: 20, y: 20 });
    } else {
      setDimensions({ width: minWidth, height: minHeight });
    }

    onMaximize?.(newMaximized);
  }, [isMaximized, onMaximize, getScreenDimensions, minWidth, minHeight]);

  // Handle close
  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // Save panel state to localStorage
  useEffect(() => {
    const panelState = {
      position,
      dimensions,
      isMinimized,
      isMaximized
    };
    localStorage.setItem(`panel-${id}`, JSON.stringify(panelState));
  }, [id, position, dimensions, isMinimized, isMaximized]);

  // Load panel state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`panel-${id}`);
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setPosition(state.position || defaultPosition);
        setDimensions(state.dimensions || { width: minWidth, height: minHeight });
        setIsMinimized(state.isMinimized || false);
        setIsMaximized(state.isMaximized || false);
      } catch (error) {
        console.warn(`Failed to load panel state for ${id}:`, error);
      }
    }
  }, [id, defaultPosition, minWidth, minHeight]);

  if (!isVisible) {
    return null;
  }

  const panelStyle = {
    width: isMaximized ? dimensions.width : isMinimized ? 'auto' : dimensions.width,
    height: isMinimized ? 'auto' : isMaximized ? dimensions.height : dimensions.height,
    zIndex: zIndex,
  };

  return (
    <>

      <div
        ref={nodeRef}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y
        }}
      >
        <motion.div
          className={`select-none ${className}`}
          style={panelStyle}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{
            opacity: 1,
            scale: 1,
            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.3)'
          }}
          transition={{ duration: 0.2 }}
        >
          <div
            ref={panelRef}
            className={`${componentPatterns.panel} rounded-xl bg-opacity-95 overflow-hidden ${themeClasses.shadow.xl}`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b ${themeClasses.border.default} ${headerClassName}`}
            >
              <div className="flex items-center space-x-3">
                <h3 className={`text-sm font-semibold ${themeClasses.text.primary} select-none`}>
                  {title}
                </h3>
              </div>

              <div className="flex items-center space-x-1">
                {canMinimize && (
                  <button
                    onClick={handleMinimize}
                    className={`p-1 rounded ${themeClasses.interactive.subtle} transition-colors ${focusStyles.default}`}
                    title={isMinimized ? 'Restore' : 'Minimize'}
                  >
                    <MinusIcon className={`h-4 w-4 ${themeClasses.text.secondary}`} />
                  </button>
                )}

                {canMaximize && (
                  <button
                    onClick={handleMaximize}
                    className={`p-1 rounded ${themeClasses.interactive.subtle} transition-colors ${focusStyles.default}`}
                    title={isMaximized ? 'Restore' : 'Maximize'}
                  >
                    {isMaximized ? (
                      <ArrowsPointingInIcon className={`h-4 w-4 ${themeClasses.text.secondary}`} />
                    ) : (
                      <ArrowsPointingOutIcon className={`h-4 w-4 ${themeClasses.text.secondary}`} />
                    )}
                  </button>
                )}

                {canClose && (
                  <button
                    onClick={handleClose}
                    className={`p-1 rounded hover:bg-red-100 transition-colors ${focusStyles.default}`}
                    title="Close"
                  >
                    <XMarkIcon className={`h-4 w-4 ${iconColors.error}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`overflow-hidden ${contentClassName}`}
                >
                  <div className="p-4">
                    {children}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      </div>
    </>
  );
};

export default DraggablePanel;