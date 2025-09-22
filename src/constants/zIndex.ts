/**
 * Centralized Z-Index Constants for Telecom GIS Platform
 *
 * This file defines all z-index values used throughout the application
 * to prevent layering conflicts and ensure proper stacking order.
 */

export const Z_INDEX = {
  // Base layer (map and background elements)
  BASE: 1,

  // Map overlays and drawing elements
  MAP_OVERLAY: 10,
  MAP_MARKERS: 15,
  MAP_LINES: 16,
  MAP_POLYGONS: 17,

  // Interface elements
  NAVIGATION: 30,
  SIDEBAR: 40,
  MAP_CONTROLS: 50,

  // Tool panels and containers
  TOOLBOX_BASE: 1000,
  TOOLBOX_DISTANCE: 1010,
  TOOLBOX_POLYGON: 1020,
  TOOLBOX_ELEVATION: 1030,
  TOOLBOX_MULTI: 1040,

  // Floating panels
  FLOATING_PANEL: 1500,
  SEARCH_RESULTS: 1600,

  // Dropdowns and menus
  DROPDOWN: 2000,
  CONTEXT_MENU: 2100,

  // Dialogs and modals
  DIALOG_BACKDROP: 5000,
  DIALOG: 5001,
  STANDARD_DIALOG: 5002,

  // Notifications and toasts
  NOTIFICATION: 8000,
  TOAST: 8100,

  // Tooltips
  TOOLTIP: 9000,

  // Top-level modals and overlays
  MODAL_BACKDROP: 10000,
  MODAL: 10001,
  LOADING_OVERLAY: 10002,

  // Critical system overlays
  ACCESSIBILITY_SKIP: 15000,
  ERROR_BOUNDARY: 15001,

  // Development and debug
  DEBUG_PANEL: 20000
} as const;

/**
 * Helper function to get z-index values
 */
export const getZIndex = (layer: keyof typeof Z_INDEX): number => {
  return Z_INDEX[layer];
};

/**
 * Type for z-index layer names
 */
export type ZIndexLayer = keyof typeof Z_INDEX;