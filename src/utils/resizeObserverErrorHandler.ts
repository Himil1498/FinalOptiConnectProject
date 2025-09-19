import React from 'react';

// Handle ResizeObserver loop errors which are common in React applications
// These errors are usually harmless and occur when DOM changes happen too quickly

let isResizeObserverLoopErrorHandled = false;

export const handleResizeObserverError = () => {
  if (isResizeObserverLoopErrorHandled) return;

  // Suppress ResizeObserver loop errors globally
  const originalError = window.console.error;

  window.console.error = (...args: any[]) => {
    const errorMessage = args[0]?.toString() || '';

    // Suppress ResizeObserver loop errors
    if (
      errorMessage.includes('ResizeObserver loop completed with undelivered notifications') ||
      errorMessage.includes('ResizeObserver loop limit exceeded')
    ) {
      // Silently ignore these errors as they're usually harmless
      return;
    }

    // Log all other errors normally
    originalError.apply(window.console, args);
  };

  // Also handle unhandled promise rejections related to ResizeObserver
  const originalRejectionHandler = window.onunhandledrejection;

  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason?.toString() || '';

    if (
      reason.includes('ResizeObserver loop') ||
      reason.includes('resize observer')
    ) {
      event.preventDefault();
      return;
    }

    if (originalRejectionHandler) {
      originalRejectionHandler.call(window, event);
    }
  };

  isResizeObserverLoopErrorHandled = true;
};

// Debounced resize observer to prevent loops
export class DebouncedResizeObserver {
  private observer: ResizeObserver;
  private callbacks: Map<Element, () => void> = new Map();
  private timeouts: Map<Element, NodeJS.Timeout> = new Map();

  constructor(private debounceMs: number = 100) {
    this.observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const callback = this.callbacks.get(entry.target);
        if (callback) {
          // Clear existing timeout
          const existingTimeout = this.timeouts.get(entry.target);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          // Set new debounced timeout
          const timeout = setTimeout(() => {
            callback();
            this.timeouts.delete(entry.target);
          }, this.debounceMs);

          this.timeouts.set(entry.target, timeout);
        }
      });
    });
  }

  observe(element: Element, callback: () => void) {
    this.callbacks.set(element, callback);
    this.observer.observe(element);
  }

  unobserve(element: Element) {
    const timeout = this.timeouts.get(element);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(element);
    }

    this.callbacks.delete(element);
    this.observer.unobserve(element);
  }

  disconnect() {
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts.clear();
    this.callbacks.clear();
    this.observer.disconnect();
  }
}

// React hook for debounced resize observer
export const useDebouncedResizeObserver = (
  callback: () => void,
  dependencies: any[] = [],
  debounceMs: number = 100
) => {
  const callbackRef = React.useRef(callback);
  const observerRef = React.useRef<DebouncedResizeObserver | null>(null);

  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  React.useEffect(() => {
    if (!observerRef.current) {
      observerRef.current = new DebouncedResizeObserver(debounceMs);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [debounceMs]);

  const ref = React.useCallback((element: Element | null) => {
    if (observerRef.current) {
      if (element) {
        observerRef.current.observe(element, () => {
          callbackRef.current();
        });
      }
    }
  }, dependencies);

  return ref;
};

