import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { PanelPosition } from './DraggablePanel';

export interface PanelState {
  id: string;
  isVisible: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  position: PanelPosition;
  zIndex: number;
}

export interface PanelLayout {
  id: string;
  name: string;
  description: string;
  panels: Record<string, Partial<PanelState>>;
}

interface PanelManagerContextType {
  panels: Record<string, PanelState>;
  layouts: PanelLayout[];
  currentLayout: string | null;
  activePanel: string | null;
  registerPanel: (id: string, initialState?: Partial<PanelState>) => void;
  unregisterPanel: (id: string) => void;
  updatePanel: (id: string, updates: Partial<PanelState>) => void;
  showPanel: (id: string) => void;
  hidePanel: (id: string) => void;
  bringToFront: (id: string) => void;
  minimizeAll: () => void;
  restoreAll: () => void;
  saveLayout: (name: string, description?: string) => void;
  loadLayout: (layoutId: string) => void;
  deleteLayout: (layoutId: string) => void;
  resetToDefaults: () => void;
  getHighestZIndex: () => number;
}

const PanelManagerContext = createContext<PanelManagerContextType | null>(null);

export const usePanelManager = () => {
  const context = useContext(PanelManagerContext);
  if (!context) {
    throw new Error('usePanelManager must be used within a PanelManagerProvider');
  }
  return context;
};

interface PanelManagerProviderProps {
  children: React.ReactNode;
}

// Default panel configurations
const DEFAULT_PANELS: Record<string, PanelState> = {
  'live-coordinates': {
    id: 'live-coordinates',
    isVisible: true,
    isMinimized: false,
    isMaximized: false,
    position: { x: 20, y: 20 },
    zIndex: 1000,
  },
  'search-system': {
    id: 'search-system',
    isVisible: false,
    isMinimized: false,
    isMaximized: false,
    position: { x: 20, y: 320 },
    zIndex: 1001,
  },
  'tools-panel': {
    id: 'tools-panel',
    isVisible: true,
    isMinimized: false,
    isMaximized: false,
    position: { x: 20, y: 620 },
    zIndex: 1002,
  },
  'analytics-dashboard': {
    id: 'analytics-dashboard',
    isVisible: false,
    isMinimized: false,
    isMaximized: false,
    position: { x: window.innerWidth - 420, y: 20 },
    zIndex: 1003,
  },
  'data-manager': {
    id: 'data-manager',
    isVisible: false,
    isMinimized: false,
    isMaximized: false,
    position: { x: window.innerWidth - 420, y: 320 },
    zIndex: 1004,
  },
};

// Predefined layouts
const DEFAULT_LAYOUTS: PanelLayout[] = [
  {
    id: 'default',
    name: 'Default Layout',
    description: 'Standard layout with essential panels',
    panels: {
      'live-coordinates': { isVisible: true, position: { x: 20, y: 20 } },
      'tools-panel': { isVisible: true, position: { x: 20, y: 620 } },
    },
  },
  {
    id: 'analysis',
    name: 'Analysis Layout',
    description: 'Optimized for data analysis work',
    panels: {
      'live-coordinates': { isVisible: true, position: { x: 20, y: 20 } },
      'analytics-dashboard': { isVisible: true, position: { x: window.innerWidth - 420, y: 20 } },
      'data-manager': { isVisible: true, position: { x: window.innerWidth - 420, y: 400 } },
      'tools-panel': { isVisible: true, position: { x: 20, y: 620 } },
    },
  },
  {
    id: 'minimal',
    name: 'Minimal Layout',
    description: 'Clean layout with minimal panels',
    panels: {
      'live-coordinates': { isVisible: true, position: { x: 20, y: 20 }, isMinimized: true },
    },
  },
  {
    id: 'admin',
    name: 'Admin Layout',
    description: 'Layout for administrative tasks',
    panels: {
      'live-coordinates': { isVisible: true, position: { x: 20, y: 20 } },
      'search-system': { isVisible: true, position: { x: 20, y: 320 } },
      'analytics-dashboard': { isVisible: true, position: { x: window.innerWidth - 420, y: 20 } },
      'data-manager': { isVisible: true, position: { x: window.innerWidth - 420, y: 400 } },
    },
  },
];

export const PanelManagerProvider: React.FC<PanelManagerProviderProps> = ({ children }) => {
  const [panels, setPanels] = useState<Record<string, PanelState>>({});
  const [layouts, setLayouts] = useState<PanelLayout[]>(DEFAULT_LAYOUTS);
  const [currentLayout, setCurrentLayout] = useState<string | null>('default');
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [highestZIndex, setHighestZIndex] = useState(1010);

  // Load saved state from localStorage
  useEffect(() => {
    const savedPanels = localStorage.getItem('panel-manager-state');
    const savedLayouts = localStorage.getItem('panel-manager-layouts');

    if (savedPanels) {
      try {
        const parsedPanels = JSON.parse(savedPanels);
        setPanels({ ...DEFAULT_PANELS, ...parsedPanels });
      } catch (error) {
        console.warn('Failed to load panel state:', error);
        setPanels(DEFAULT_PANELS);
      }
    } else {
      setPanels(DEFAULT_PANELS);
    }

    if (savedLayouts) {
      try {
        const parsedLayouts = JSON.parse(savedLayouts);
        setLayouts([...DEFAULT_LAYOUTS, ...parsedLayouts]);
      } catch (error) {
        console.warn('Failed to load layouts:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever panels change
  useEffect(() => {
    localStorage.setItem('panel-manager-state', JSON.stringify(panels));
  }, [panels]);

  // Save layouts to localStorage whenever layouts change
  useEffect(() => {
    const customLayouts = layouts.filter(layout => !DEFAULT_LAYOUTS.find(dl => dl.id === layout.id));
    localStorage.setItem('panel-manager-layouts', JSON.stringify(customLayouts));
  }, [layouts]);

  const registerPanel = useCallback((id: string, initialState?: Partial<PanelState>) => {
    setPanels(prev => {
      if (prev[id]) return prev; // Already registered

      const defaultState = DEFAULT_PANELS[id] || {
        id,
        isVisible: false,
        isMinimized: false,
        isMaximized: false,
        position: { x: 50, y: 50 },
        zIndex: 1000,
      };

      return {
        ...prev,
        [id]: { ...defaultState, ...initialState },
      };
    });
  }, []);

  const unregisterPanel = useCallback((id: string) => {
    setPanels(prev => {
      const { [id]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const updatePanel = useCallback((id: string, updates: Partial<PanelState>) => {
    setPanels(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  }, []);

  const showPanel = useCallback((id: string) => {
    updatePanel(id, { isVisible: true });
    bringToFront(id);
  }, [updatePanel]);

  const hidePanel = useCallback((id: string) => {
    updatePanel(id, { isVisible: false });
  }, [updatePanel]);

  const getHighestZIndex = useCallback(() => {
    return Math.max(...Object.values(panels).map(panel => panel.zIndex), highestZIndex);
  }, [panels, highestZIndex]);

  const bringToFront = useCallback((id: string) => {
    const newZIndex = getHighestZIndex() + 1;
    setHighestZIndex(newZIndex);
    updatePanel(id, { zIndex: newZIndex });
    setActivePanel(id);
  }, [getHighestZIndex, updatePanel]);

  const minimizeAll = useCallback(() => {
    setPanels(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(id => {
        if (updated[id].isVisible && !updated[id].isMinimized) {
          updated[id] = { ...updated[id], isMinimized: true };
        }
      });
      return updated;
    });
  }, []);

  const restoreAll = useCallback(() => {
    setPanels(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(id => {
        if (updated[id].isMinimized) {
          updated[id] = { ...updated[id], isMinimized: false };
        }
      });
      return updated;
    });
  }, []);

  const saveLayout = useCallback((name: string, description = '') => {
    const newLayout: PanelLayout = {
      id: `custom-${Date.now()}`,
      name,
      description,
      panels: { ...panels },
    };

    setLayouts(prev => [...prev, newLayout]);
    setCurrentLayout(newLayout.id);
  }, [panels]);

  const loadLayout = useCallback((layoutId: string) => {
    const layout = layouts.find(l => l.id === layoutId);
    if (!layout) return;

    setPanels(prev => {
      const updated = { ...prev };

      // Apply layout settings
      Object.entries(layout.panels).forEach(([panelId, panelSettings]) => {
        if (updated[panelId]) {
          updated[panelId] = { ...updated[panelId], ...panelSettings };
        }
      });

      return updated;
    });

    setCurrentLayout(layoutId);
  }, [layouts]);

  const deleteLayout = useCallback((layoutId: string) => {
    // Don't allow deletion of default layouts
    if (DEFAULT_LAYOUTS.find(layout => layout.id === layoutId)) return;

    setLayouts(prev => prev.filter(layout => layout.id !== layoutId));

    if (currentLayout === layoutId) {
      setCurrentLayout('default');
      loadLayout('default');
    }
  }, [currentLayout, loadLayout]);

  const resetToDefaults = useCallback(() => {
    setPanels(DEFAULT_PANELS);
    setCurrentLayout('default');
  }, []);

  const contextValue: PanelManagerContextType = {
    panels,
    layouts,
    currentLayout,
    activePanel,
    registerPanel,
    unregisterPanel,
    updatePanel,
    showPanel,
    hidePanel,
    bringToFront,
    minimizeAll,
    restoreAll,
    saveLayout,
    loadLayout,
    deleteLayout,
    resetToDefaults,
    getHighestZIndex,
  };

  return (
    <PanelManagerContext.Provider value={contextValue}>
      {children}
    </PanelManagerContext.Provider>
  );
};