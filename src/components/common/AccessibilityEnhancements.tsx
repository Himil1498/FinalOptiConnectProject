import React, { useEffect, useRef } from 'react';

// Skip Link Component for keyboard navigation
export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a
    href={href}
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
  >
    {children}
  </a>
);

// Live region for screen reader announcements
interface LiveRegionProps {
  message: string;
  level?: 'polite' | 'assertive';
  clearAfter?: number;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  level = 'polite',
  clearAfter = 5000
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && ref.current) {
      ref.current.textContent = message;

      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          if (ref.current) {
            ref.current.textContent = '';
          }
        }, clearAfter);

        return () => clearTimeout(timer);
      }
    }
  }, [message, clearAfter]);

  return (
    <div
      ref={ref}
      aria-live={level}
      aria-atomic="true"
      className="sr-only"
    />
  );
};

// Focus management for modals and overlays
interface FocusTrapProps {
  children: React.ReactNode;
  active: boolean;
  restoreFocus?: boolean;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active,
  restoreFocus = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements in the container
    const getFocusableElements = () => {
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
      ].join(', ');

      return Array.from(
        containerRef.current!.querySelectorAll(focusableSelectors)
      ) as HTMLElement[];
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement || currentIndex === -1) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement || currentIndex === -1) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus to the previously focused element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, restoreFocus]);

  if (!active) return null;

  return (
    <div ref={containerRef} className="contents">
      {children}
    </div>
  );
};

// High contrast mode detection
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = React.useState(false);

  useEffect(() => {
    const checkHighContrast = () => {
      // Check for Windows high contrast mode
      if (window.matchMedia) {
        const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
        setIsHighContrast(highContrastQuery.matches);

        const handleChange = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
        highContrastQuery.addEventListener('change', handleChange);

        return () => highContrastQuery.removeEventListener('change', handleChange);
      }
    };

    checkHighContrast();
  }, []);

  return isHighContrast;
};

// Reduced motion detection
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// ARIA attributes helper component
interface AriaLabelledByProps {
  id: string;
  children: React.ReactNode;
}

export const AriaLabelledBy: React.FC<AriaLabelledByProps> = ({ id, children }) => (
  <div id={id} className="sr-only">
    {children}
  </div>
);

// Keyboard navigation announcer
interface KeyboardAnnouncerProps {
  shortcuts: Array<{
    key: string;
    description: string;
    action?: () => void;
  }>;
}

export const KeyboardAnnouncer: React.FC<KeyboardAnnouncerProps> = ({ shortcuts }) => {
  const [showHelp, setShowHelp] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Show keyboard shortcuts on Ctrl/Cmd + /
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        setShowHelp(true);
      }

      // Hide help on Escape
      if (event.key === 'Escape' && showHelp) {
        setShowHelp(false);
      }

      // Execute shortcut actions
      shortcuts.forEach(shortcut => {
        if (event.key === shortcut.key && shortcut.action) {
          if (shortcut.key === 'Escape' ||
              (!event.ctrlKey && !event.metaKey && !event.altKey)) {
            shortcut.action();
          }
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, showHelp]);

  if (!showHelp) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          Keyboard Shortcuts
        </h2>
        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {shortcut.description}
              </span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowHelp(false)}
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Close (Esc)
        </button>
      </div>
    </div>
  );
};

// Color contrast utilities
export const ensureContrast = (foreground: string, background: string): string => {
  // This is a simplified contrast checker
  // In a real implementation, you'd calculate the actual contrast ratio
  const getColorBrightness = (color: string): number => {
    // Remove # if present
    color = color.replace('#', '');

    // Convert to RGB
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);

    // Calculate brightness using standard formula
    return (r * 299 + g * 587 + b * 114) / 1000;
  };

  const fgBrightness = getColorBrightness(foreground);
  const bgBrightness = getColorBrightness(background);

  // If contrast is too low, return a high contrast alternative
  if (Math.abs(fgBrightness - bgBrightness) < 125) {
    return bgBrightness > 127 ? '#000000' : '#ffffff';
  }

  return foreground;
};

export default {
  SkipLink,
  LiveRegion,
  FocusTrap,
  useHighContrast,
  useReducedMotion,
  AriaLabelledBy,
  KeyboardAnnouncer,
  ensureContrast
};