import React from 'react';
import { SunIcon } from '@heroicons/react/24/outline';
import EnhancedTooltip from './EnhancedTooltip';

interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'dropdown' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  variant = 'button',
  size = 'md',
  showLabel = false
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const buttonContent = (
    <div
      className={`
        ${sizeClasses[size]}
        ${variant === 'button'
          ? 'bg-white rounded-lg shadow-lg border border-gray-200'
          : 'rounded'
        }
        ${showLabel ? 'px-3 gap-2' : ''}
        flex items-center justify-center text-gray-700
        ${className}
      `}
      aria-label="Light theme enabled"
    >
      <SunIcon className={iconSizes[size]} />
      {showLabel && (
        <span className="text-sm font-medium">Light</span>
      )}
    </div>
  );

  if (showLabel || variant === 'icon') {
    return buttonContent;
  }

  return (
    <EnhancedTooltip
      content="Light theme enabled"
      position="left"
      delay={300}
    >
      {buttonContent}
    </EnhancedTooltip>
  );
};

export default ThemeToggle;