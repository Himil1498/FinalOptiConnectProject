import React from 'react';
import { ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import { useFullscreen } from '../../hooks/useFullscreen';
import EnhancedTooltip from './EnhancedTooltip';

interface FullscreenToggleProps {
  className?: string;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'md' | 'lg';
}

const FullscreenToggle: React.FC<FullscreenToggleProps> = ({
  className = '',
  variant = 'button',
  size = 'md'
}) => {
  const { isFullscreen, toggleFullscreen, isSupported } = useFullscreen();

  if (!isSupported) {
    return null;
  }

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

  const handleToggle = async () => {
    try {
      await toggleFullscreen();
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  const buttonContent = (
    <button
      onClick={handleToggle}
      className={`
        ${sizeClasses[size]}
        ${variant === 'button'
          ? 'bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-100'
          : 'hover:bg-gray-100 rounded'
        }
        flex items-center justify-center text-gray-700
        transition-all duration-200 ${className}
      `}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
    >
      {isFullscreen ? (
        <ArrowsPointingInIcon className={iconSizes[size]} />
      ) : (
        <ArrowsPointingOutIcon className={iconSizes[size]} />
      )}
    </button>
  );

  return (
    <EnhancedTooltip
      content={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen (F11)'}
      position="left"
      delay={300}
    >
      {buttonContent}
    </EnhancedTooltip>
  );
};

export default FullscreenToggle;