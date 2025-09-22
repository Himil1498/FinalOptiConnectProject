import React, { useState, useRef, useEffect } from 'react';

interface SimpleTooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactElement;
  className?: string;
}

const SimpleTooltip: React.FC<SimpleTooltipProps> = ({
  content,
  position = 'top',
  children,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 8;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + 8;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.left - tooltipRect.width - 8;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.right + 8;
          break;
      }

      // Keep tooltip within viewport and avoid sidebar
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      // Detect sidebar width to avoid positioning behind it
      let sidebarWidth = 0;
      const sidebarSelectors = [
        ".dashboard-sidebar",
        '[class*="sidebar"]',
        'nav[class*="left"]',
        "aside",
        '[class*="navigation"]',
        '[class*="menu"]',
        ".fixed.left-0",
        ".fixed.inset-y-0"
      ];

      for (const selector of sidebarSelectors) {
        const sidebar = document.querySelector(selector);
        if (sidebar) {
          const sidebarRect = sidebar.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(sidebar);
          const isVisible =
            computedStyle.display !== "none" &&
            computedStyle.visibility !== "hidden" &&
            sidebarRect.width > 0;

          if (isVisible && sidebarRect.left <= 10) { // Left-positioned sidebar
            sidebarWidth = sidebarRect.width + 16; // Add some padding
            break;
          }
        }
      }

      // Adjust positioning to avoid sidebar overlap
      const minLeft = Math.max(8, sidebarWidth);

      if (left < minLeft) left = minLeft;
      if (left + tooltipRect.width > viewport.width - 8) {
        left = viewport.width - tooltipRect.width - 8;
      }
      if (top < 8) top = 8;
      if (top + tooltipRect.height > viewport.height - 8) {
        top = viewport.height - tooltipRect.height - 8;
      }

      // If positioning 'left' would put tooltip behind sidebar, switch to 'right'
      if (position === 'left' && left <= sidebarWidth) {
        // Recalculate for right position
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + 8;

        // Ensure it still fits in viewport
        if (left + tooltipRect.width > viewport.width - 8) {
          // If right doesn't work either, position above/below
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          left = Math.max(minLeft, Math.min(left, viewport.width - tooltipRect.width - 8));
          top = triggerRect.top > viewport.height / 2
            ? triggerRect.top - tooltipRect.height - 8
            : triggerRect.bottom + 8;
        }
      }

      setTooltipStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 9999
      });
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <>
      {React.cloneElement(children as React.ReactElement<any>, {
        ref: triggerRef,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        className: `${(children.props as any).className || ''} ${className}`.trim()
      })}

      {isVisible && (
        <div
          ref={tooltipRef}
          style={tooltipStyle}
          className={`
            bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg
            pointer-events-none whitespace-nowrap max-w-xs
            transition-opacity duration-200
            ${isVisible ? 'opacity-100' : 'opacity-0'}
          `}
        >
          {content}
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
              position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
              position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
              'left-[-4px] top-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </>
  );
};

export default SimpleTooltip;