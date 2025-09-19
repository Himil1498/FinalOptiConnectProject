import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface EnhancedTooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  delay?: number;
  className?: string;
  disabled?: boolean;
}

const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  content,
  children,
  position = 'auto',
  delay = 500,
  className = '',
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const spacing = 8; // Distance from trigger element
    let finalPosition = position;
    let top = 0;
    let left = 0;

    // Auto-detect best position if position is 'auto'
    if (position === 'auto') {
      const spaceAbove = triggerRect.top;
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceLeft = triggerRect.left;
      const spaceRight = viewportWidth - triggerRect.right;

      if (spaceAbove >= tooltipRect.height + spacing && spaceAbove >= spaceBelow) {
        finalPosition = 'top';
      } else if (spaceBelow >= tooltipRect.height + spacing) {
        finalPosition = 'bottom';
      } else if (spaceRight >= tooltipRect.width + spacing) {
        finalPosition = 'right';
      } else if (spaceLeft >= tooltipRect.width + spacing) {
        finalPosition = 'left';
      } else {
        finalPosition = 'bottom'; // Fallback
      }
    }

    // Calculate position based on final position
    switch (finalPosition) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - spacing;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + spacing;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - spacing;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + spacing;
        break;
    }

    // Keep tooltip within viewport bounds
    left = Math.max(8, Math.min(left, viewportWidth - tooltipRect.width - 8));
    top = Math.max(8, Math.min(top, viewportHeight - tooltipRect.height - 8));

    setActualPosition(finalPosition as 'top' | 'bottom' | 'left' | 'right');
    setTooltipStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 9999,
    });
  };

  const showTooltip = () => {
    if (disabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Calculate position after tooltip is rendered
      setTimeout(() => calculatePosition(), 0);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isVisible) {
        calculatePosition();
      }
    };

    const handleResize = () => {
      if (isVisible) {
        calculatePosition();
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible]);

  const getArrowClasses = () => {
    const baseArrow = "absolute w-2 h-2 transform rotate-45 bg-gray-900";

    switch (actualPosition) {
      case 'top':
        return `${baseArrow} bottom-[-4px] left-1/2 -translate-x-1/2`;
      case 'bottom':
        return `${baseArrow} top-[-4px] left-1/2 -translate-x-1/2`;
      case 'left':
        return `${baseArrow} right-[-4px] top-1/2 -translate-y-1/2`;
      case 'right':
        return `${baseArrow} left-[-4px] top-1/2 -translate-y-1/2`;
      default:
        return `${baseArrow} bottom-[-4px] left-1/2 -translate-x-1/2`;
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={`inline-block ${className}`}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>

      {isVisible && content && (
        <div
          ref={tooltipRef}
          style={{
            ...tooltipStyle,
            transform: 'translate3d(0, 0, 0)'
          }}
          className={`
            px-3 py-2 text-sm font-medium text-white bg-gray-900
            rounded-lg shadow-lg border border-gray-200
            max-w-xs break-words pointer-events-none
            animate-in fade-in-0 zoom-in-95 duration-200
            will-change-transform
          `}
          role="tooltip"
          aria-label={content}
        >
          {content}
          <div className={getArrowClasses()} />
        </div>
      )}
    </>
  );
};

export default EnhancedTooltip;