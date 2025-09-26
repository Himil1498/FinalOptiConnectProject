// export const LAYOUT_DIMENSIONS = {
//   NAVBAR_HEIGHT: 80, // 20 * 4px (top-20 in Tailwind)
//   FOOTER_HEIGHT: 60, // Standard footer height
//   SIDEBAR_WIDTH_DEFAULT: 280, // Default sidebar width from useSidebarAwarePositioning
//   SIDEBAR_WIDTH_COLLAPSED: 80, // Collapsed sidebar width
//   TOOLBOX_PADDING: 16, // Standard padding
//   TOOLBOX_WIDTH: 320 // Current toolbox width
// } as const;

// export const TOOLBOX_POSITIONING = {
//   // Fixed positioning constraints
//   top: LAYOUT_DIMENSIONS.NAVBAR_HEIGHT,
//   bottom: LAYOUT_DIMENSIONS.FOOTER_HEIGHT,
//   padding: LAYOUT_DIMENSIONS.TOOLBOX_PADDING,
//   width: LAYOUT_DIMENSIONS.TOOLBOX_WIDTH
// } as const;

export const LAYOUT_DIMENSIONS = {
  NAVBAR_HEIGHT: 80, // 20 * 4px (top-20 in Tailwind)
  FOOTER_HEIGHT_DEFAULT: 60, // Standard footer height when expanded
  FOOTER_HEIGHT_COLLAPSED: 30, // Collapsed footer height
  SIDEBAR_WIDTH_DEFAULT: 280, // Default sidebar width when expanded
  SIDEBAR_WIDTH_COLLAPSED: 80, // Collapsed sidebar width
  TOOLBOX_PADDING: 16, // Standard padding
  TOOLBOX_WIDTH: 320, // Current toolbox width
  TRANSITION_DURATION: 300 // Animation duration in ms
} as const;

// Sidebar state configurations
export const SIDEBAR_STATES = {
  EXPANDED: {
    width: LAYOUT_DIMENSIONS.SIDEBAR_WIDTH_DEFAULT,
    label: "Expanded",
    icon: "collapse"
  },
  COLLAPSED: {
    width: LAYOUT_DIMENSIONS.SIDEBAR_WIDTH_COLLAPSED,
    label: "Collapsed",
    icon: "expand"
  }
} as const;

// Footer state configurations
export const FOOTER_STATES = {
  EXPANDED: {
    height: LAYOUT_DIMENSIONS.FOOTER_HEIGHT_DEFAULT,
    label: "Expanded",
    icon: "collapse"
  },
  COLLAPSED: {
    height: LAYOUT_DIMENSIONS.FOOTER_HEIGHT_COLLAPSED,
    label: "Collapsed",
    icon: "expand"
  }
} as const;

export const TOOLBOX_POSITIONING = {
  // Fixed positioning constraints (using default expanded values)
  top: LAYOUT_DIMENSIONS.NAVBAR_HEIGHT,
  bottom: LAYOUT_DIMENSIONS.FOOTER_HEIGHT_DEFAULT,
  padding: LAYOUT_DIMENSIONS.TOOLBOX_PADDING,
  width: LAYOUT_DIMENSIONS.TOOLBOX_WIDTH
} as const;

// Dynamic positioning helpers
export const getDynamicPositioning = (
  sidebarState: keyof typeof SIDEBAR_STATES,
  footerState: keyof typeof FOOTER_STATES
) => ({
  sidebarWidth: SIDEBAR_STATES[sidebarState].width,
  footerHeight: FOOTER_STATES[footerState].height,
  transition: `all ${LAYOUT_DIMENSIONS.TRANSITION_DURATION}ms ease-in-out`
});
