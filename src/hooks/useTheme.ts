import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ThemeConfig, AccessibilityConfig, KeyboardShortcut, ToastNotification, UIState } from '../types';

// Default theme configurations
const lightTheme: ThemeConfig = {
  mode: 'light',
  colors: {
    primary: '#3B82F6',
    secondary: '#6B7280',
    accent: '#10B981',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  },
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
};

const darkTheme: ThemeConfig = {
  ...lightTheme,
  mode: 'dark',
  colors: {
    primary: '#60A5FA',
    secondary: '#9CA3AF',
    accent: '#34D399',
    background: '#111827',
    surface: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: '#374151',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA'
  }
};

const defaultAccessibility: AccessibilityConfig = {
  highContrast: false,
  reducedMotion: false,
  fontSize: 'medium',
  focusVisible: true,
  screenReaderMode: false,
  keyboardNavigation: true
};

interface ThemeContextType {
  uiState: UIState;
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  updateAccessibility: (config: Partial<AccessibilityConfig>) => void;
  addNotification: (notification: Omit<ToastNotification, 'id'>) => void;
  removeNotification: (id: string) => void;
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (id: string) => void;
  setLoading: (key: string, loading: boolean, message?: string, progress?: number) => void;
  toggleSidebar: () => void;
  toggleFullscreen: () => void;
  getCurrentTheme: () => ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const useThemeProvider = () => {
  const [uiState, setUiState] = useState<UIState>(() => {
    // Load saved preferences from localStorage
    const savedTheme = localStorage.getItem('opti-connect-theme');
    const savedAccessibility = localStorage.getItem('opti-connect-accessibility');

    const initialTheme = savedTheme ? JSON.parse(savedTheme) : lightTheme;
    const initialAccessibility = savedAccessibility ? JSON.parse(savedAccessibility) : defaultAccessibility;

    return {
      theme: initialTheme,
      accessibility: initialAccessibility,
      shortcuts: [],
      notifications: [],
      loadingStates: {},
      sidebarCollapsed: false,
      fullscreenMode: false,
      currentBreakpoint: 'lg'
    };
  });

  const getCurrentTheme = useCallback((): ThemeConfig => {
    if (uiState.theme.mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? darkTheme : lightTheme;
    }
    return uiState.theme.mode === 'dark' ? darkTheme : lightTheme;
  }, [uiState.theme.mode]);

  const toggleTheme = useCallback(() => {
    setUiState(prev => {
      const newMode = prev.theme.mode === 'light' ? 'dark' : 'light';
      const newTheme = newMode === 'dark' ? darkTheme : lightTheme;
      localStorage.setItem('opti-connect-theme', JSON.stringify(newTheme));
      return {
        ...prev,
        theme: newTheme
      };
    });
  }, []);

  const setThemeMode = useCallback((mode: 'light' | 'dark' | 'system') => {
    setUiState(prev => {
      let newTheme: ThemeConfig;
      if (mode === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        newTheme = { ...(prefersDark ? darkTheme : lightTheme), mode: 'system' };
      } else {
        newTheme = mode === 'dark' ? darkTheme : lightTheme;
      }
      localStorage.setItem('opti-connect-theme', JSON.stringify(newTheme));
      return {
        ...prev,
        theme: newTheme
      };
    });
  }, []);

  const updateAccessibility = useCallback((config: Partial<AccessibilityConfig>) => {
    setUiState(prev => {
      const newAccessibility = { ...prev.accessibility, ...config };
      localStorage.setItem('opti-connect-accessibility', JSON.stringify(newAccessibility));
      return {
        ...prev,
        accessibility: newAccessibility
      };
    });
  }, []);

  const addNotification = useCallback((notification: Omit<ToastNotification, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: ToastNotification = {
      id,
      duration: 5000,
      dismissible: true,
      persistent: false,
      ...notification
    };

    setUiState(prev => ({
      ...prev,
      notifications: [...prev.notifications, newNotification]
    }));

    // Auto-remove non-persistent notifications
    if (!newNotification.persistent && newNotification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setUiState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id)
    }));
  }, []);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setUiState(prev => ({
      ...prev,
      shortcuts: [...prev.shortcuts.filter(s => s.id !== shortcut.id), shortcut]
    }));
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setUiState(prev => ({
      ...prev,
      shortcuts: prev.shortcuts.filter(s => s.id !== id)
    }));
  }, []);

  const setLoading = useCallback((key: string, loading: boolean, message?: string, progress?: number) => {
    setUiState(prev => ({
      ...prev,
      loadingStates: {
        ...prev.loadingStates,
        [key]: {
          isLoading: loading,
          message,
          progress,
          type: 'spinner'
        }
      }
    }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setUiState(prev => ({
      ...prev,
      sidebarCollapsed: !prev.sidebarCollapsed
    }));
  }, []);

  const toggleFullscreen = useCallback(() => {
    setUiState(prev => ({
      ...prev,
      fullscreenMode: !prev.fullscreenMode
    }));
  }, []);

  // Handle system theme changes
  useEffect(() => {
    if (uiState.theme.mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        setUiState(prev => ({
          ...prev,
          theme: { ...getCurrentTheme(), mode: 'system' }
        }));
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [uiState.theme.mode, getCurrentTheme]);

  // Handle responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'xs';

      if (width >= 1536) breakpoint = '2xl';
      else if (width >= 1280) breakpoint = 'xl';
      else if (width >= 1024) breakpoint = 'lg';
      else if (width >= 768) breakpoint = 'md';
      else if (width >= 640) breakpoint = 'sm';

      setUiState(prev => ({
        ...prev,
        currentBreakpoint: breakpoint
      }));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (!uiState.accessibility.keyboardNavigation) return;

      const shortcut = uiState.shortcuts.find(s =>
        s.enabled &&
        s.key && event.key &&
        s.key.toLowerCase() === event.key.toLowerCase() &&
        !!s.ctrlKey === event.ctrlKey &&
        !!s.altKey === event.altKey &&
        !!s.shiftKey === event.shiftKey &&
        !!s.metaKey === event.metaKey
      );

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [uiState.shortcuts, uiState.accessibility.keyboardNavigation]);

  // Apply additional theme properties (ThemeProvider handles main theme switching)
  useEffect(() => {
    const theme = getCurrentTheme();
    const root = document.documentElement;

    // Apply CSS custom properties for theme variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });

    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });

    // Apply animation duration (avoid conflicts with ThemeProvider)
    if (uiState.accessibility.reducedMotion) {
      root.style.setProperty('--animation-duration-theme', '0.01ms');
    } else {
      root.style.setProperty('--animation-duration-theme', theme.animations.duration.normal);
    }

    // Note: Main theme classes are handled by ThemeProvider to avoid conflicts

  }, [getCurrentTheme, uiState.accessibility]);

  return {
    uiState,
    toggleTheme,
    setThemeMode,
    updateAccessibility,
    addNotification,
    removeNotification,
    registerShortcut,
    unregisterShortcut,
    setLoading,
    toggleSidebar,
    toggleFullscreen,
    getCurrentTheme
  };
};

export { ThemeContext };