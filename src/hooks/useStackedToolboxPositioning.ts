import { useState, useEffect, useCallback, useRef } from 'react';

interface ToolboxInfo {
  id: string;
  isActive: boolean;
  height: number;
}

const activeToolboxes = new Map<string, ToolboxInfo>();
const listeners = new Set<() => void>();

// Global state management for stacked toolboxes
export const useStackedToolboxPositioning = (toolboxId: string, isActive: boolean) => {
  const [position, setPosition] = useState({ top: '80px', height: 0 });
  const lastHeightRef = useRef<number>(0);

  const updatePosition = useCallback(() => {
    const sortedToolboxes = Array.from(activeToolboxes.values())
      .filter(tb => tb.isActive)
      .sort((a, b) => a.id.localeCompare(b.id)); // Sort by ID for consistent ordering

    let currentTop = 80; // Start 80px from navbar for proper spacing
    const toolboxIndex = sortedToolboxes.findIndex(tb => tb.id === toolboxId);

    // Calculate top position based on previous toolboxes
    for (let i = 0; i < toolboxIndex; i++) {
      currentTop += sortedToolboxes[i].height + 12; // Increased gap for better spacing
    }

    // Detect footer height dynamically
    const getFooterHeight = () => {
      const footer = document.querySelector('footer');
      if (footer) {
        const rect = footer.getBoundingClientRect();
        return rect.height;
      }
      return 60; // Default footer height fallback
    };

    const footerHeight = getFooterHeight();
    const spacingFromFooter = 80; // Required spacing above footer

    // Calculate maximum allowable top position
    // window.innerHeight - footer height - spacing above footer - minimum toolbox height
    const maxTop = window.innerHeight - footerHeight - spacingFromFooter - 300;
    const finalTop = Math.min(currentTop, Math.max(80, maxTop)); // Ensure minimum 80px from top

    setPosition(prev => {
      const newTop = `${finalTop}px`;
      // Only update if position actually changed
      if (prev.top !== newTop) {
        return {
          top: newTop,
          height: prev.height
        };
      }
      return prev;
    });
  }, [toolboxId]);

  // Register this toolbox
  useEffect(() => {
    if (isActive) {
      activeToolboxes.set(toolboxId, {
        id: toolboxId,
        isActive: true,
        height: 350 // Default height that respects spacing constraints
      });
    } else {
      activeToolboxes.delete(toolboxId);
    }

    // Notify all listeners
    listeners.forEach(listener => listener());

    return () => {
      activeToolboxes.delete(toolboxId);
      listeners.forEach(listener => listener());
    };
  }, [toolboxId, isActive]);

  // Listen for changes, window resize, and footer state changes
  useEffect(() => {
    listeners.add(updatePosition);
    updatePosition();

    const handleResize = () => {
      updatePosition();
    };

    // Observe footer changes for expand/collapse states
    const observeFooter = () => {
      const footer = document.querySelector('footer');
      if (footer) {
        const observer = new MutationObserver(() => {
          // Delay to allow DOM to update after state change
          setTimeout(updatePosition, 100);
        });

        observer.observe(footer, {
          attributes: true,
          childList: true,
          subtree: true,
          attributeFilter: ['class', 'style']
        });

        return observer;
      }
      return null;
    };

    const footerObserver = observeFooter();

    // Also observe document body for footer changes
    const bodyObserver = new MutationObserver(() => {
      const footer = document.querySelector('footer');
      if (footer) {
        updatePosition();
      }
    });

    bodyObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Listen for footer expand/collapse clicks
    const handleFooterClick = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target && (
        target.textContent?.includes('Expand') ||
        target.textContent?.includes('Collapse') ||
        target.closest('button')?.textContent?.includes('Expand') ||
        target.closest('button')?.textContent?.includes('Collapse')
      )) {
        // Delay to allow footer state change to complete
        setTimeout(updatePosition, 200);
      }
    };

    document.addEventListener('click', handleFooterClick);
    window.addEventListener('resize', handleResize);

    return () => {
      listeners.delete(updatePosition);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('click', handleFooterClick);
      if (footerObserver) footerObserver.disconnect();
      bodyObserver.disconnect();
    };
  }, [updatePosition]);

  // Function to update height when measured
  const updateHeight = useCallback((height: number) => {
    // Prevent unnecessary updates with the same height
    if (lastHeightRef.current === height) {
      return;
    }

    const toolbox = activeToolboxes.get(toolboxId);
    if (toolbox && toolbox.height !== height) {
      lastHeightRef.current = height;
      toolbox.height = height;
      activeToolboxes.set(toolboxId, toolbox);
      // Debounce listener calls to prevent infinite loops
      setTimeout(() => {
        listeners.forEach(listener => listener());
      }, 0);
    }
  }, [toolboxId]);

  return {
    top: position.top,
    updateHeight
  };
};