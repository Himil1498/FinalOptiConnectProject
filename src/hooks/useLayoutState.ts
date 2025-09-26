import { useState, useEffect, useCallback } from "react";
import {
  LAYOUT_DIMENSIONS,
  SIDEBAR_STATES,
  FOOTER_STATES,
  getDynamicPositioning
} from "../constants/layout";

export interface LayoutState {
  sidebarCollapsed: boolean;
  footerCollapsed: boolean;
  sidebarWidth: number;
  footerHeight: number;
  transition: string;
  toggleSidebar: () => void;
  toggleFooter: () => void;
  getPositioning: () => ReturnType<typeof getDynamicPositioning>;
}

export const useLayoutState = (): LayoutState => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [footerCollapsed, setFooterCollapsed] = useState<boolean>(false);

  // Load initial state from localStorage
  useEffect(() => {
    const savedSidebar = localStorage.getItem("sidebarCollapsed");
    const savedFooter = localStorage.getItem("footerCollapsed");
    if (savedSidebar !== null) setSidebarCollapsed(JSON.parse(savedSidebar));
    if (savedFooter !== null) setFooterCollapsed(JSON.parse(savedFooter));
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem("footerCollapsed", JSON.stringify(footerCollapsed));
  }, [footerCollapsed]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const toggleFooter = useCallback(() => {
    setFooterCollapsed((prev) => !prev);
  }, []);

  const sidebarState = sidebarCollapsed ? "COLLAPSED" : "EXPANDED";
  const footerState = footerCollapsed ? "COLLAPSED" : "EXPANDED";

  const { sidebarWidth, footerHeight, transition } = getDynamicPositioning(
    sidebarState,
    footerState
  );

  const getPositioning = useCallback(
    () => ({
      sidebarWidth,
      footerHeight,
      transition,
      navbarHeight: LAYOUT_DIMENSIONS.NAVBAR_HEIGHT,
      toolboxWidth: LAYOUT_DIMENSIONS.TOOLBOX_WIDTH,
      toolboxPadding: LAYOUT_DIMENSIONS.TOOLBOX_PADDING
    }),
    [sidebarWidth, footerHeight, transition]
  );

  return {
    sidebarCollapsed,
    footerCollapsed,
    sidebarWidth,
    footerHeight,
    transition,
    toggleSidebar,
    toggleFooter,
    getPositioning
  };
};
