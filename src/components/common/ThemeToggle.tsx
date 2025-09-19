import React from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../hooks/useTheme';
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
  const { uiState, toggleTheme, setThemeMode } = useTheme();
  const currentMode = uiState.theme.mode;

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

  const getThemeIcon = () => {
    switch (currentMode) {
      case 'dark':
        return <MoonIcon className={iconSizes[size]} />;
      case 'system':
        return <ComputerDesktopIcon className={iconSizes[size]} />;
      default:
        return <SunIcon className={iconSizes[size]} />;
    }
  };

  const getThemeLabel = () => {
    switch (currentMode) {
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'Light';
    }
  };

  const getTooltipText = () => {
    switch (currentMode) {
      case 'dark':
        return 'Switch to light mode';
      case 'system':
        return 'Switch to light mode';
      default:
        return 'Switch to dark mode';
    }
  };

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <select
          value={currentMode}
          onChange={(e) => setThemeMode(e.target.value as 'light' | 'dark' | 'system')}
          className={`
            ${sizeClasses[size]}
            bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-colors duration-200
          `}
        >
          <option value="light">☀️ Light</option>
          <option value="dark">🌙 Dark</option>
          <option value="system">💻 System</option>
        </select>
      </div>
    );
  }

  const buttonContent = (
    <button
      onClick={toggleTheme}
      className={`
        ${sizeClasses[size]}
        ${variant === 'button'
          ? 'bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-100'
          : 'hover:bg-gray-100 rounded'
        }
        ${showLabel ? 'px-3 gap-2' : ''}
        flex items-center justify-center text-gray-700
        transition-all duration-200 ${className}
      `}
      aria-label={getTooltipText()}
    >
      {getThemeIcon()}
      {showLabel && (
        <span className="text-sm font-medium">{getThemeLabel()}</span>
      )}
    </button>
  );

  if (showLabel || variant === 'icon') {
    return buttonContent;
  }

  return (
    <EnhancedTooltip
      content={getTooltipText()}
      position="left"
      delay={300}
    >
      {buttonContent}
    </EnhancedTooltip>
  );
};

export default ThemeToggle;