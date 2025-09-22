export const LAYOUT_DIMENSIONS = {
  NAVBAR_HEIGHT: 80, // 20 * 4px (top-20 in Tailwind)
  FOOTER_HEIGHT: 60, // Standard footer height
  SIDEBAR_WIDTH_DEFAULT: 280, // Default sidebar width from useSidebarAwarePositioning
  SIDEBAR_WIDTH_COLLAPSED: 80, // Collapsed sidebar width
  TOOLBOX_PADDING: 16, // Standard padding
  TOOLBOX_WIDTH: 320 // Current toolbox width
} as const;

export const TOOLBOX_POSITIONING = {
  // Fixed positioning constraints
  top: LAYOUT_DIMENSIONS.NAVBAR_HEIGHT,
  bottom: LAYOUT_DIMENSIONS.FOOTER_HEIGHT,
  padding: LAYOUT_DIMENSIONS.TOOLBOX_PADDING,
  width: LAYOUT_DIMENSIONS.TOOLBOX_WIDTH
} as const;
