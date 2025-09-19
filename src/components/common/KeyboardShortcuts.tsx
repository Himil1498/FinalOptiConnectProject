import React, { useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';

const KeyboardShortcuts: React.FC = () => {
  const { registerShortcut, unregisterShortcut, toggleTheme, toggleSidebar, addNotification } = useTheme();

  useEffect(() => {
    // Register default keyboard shortcuts
    const shortcuts: Array<{
      id: string;
      key: string;
      ctrlKey?: boolean;
      altKey?: boolean;
      shiftKey?: boolean;
      metaKey?: boolean;
      description: string;
      action: () => void;
      category: 'navigation' | 'search' | 'tools' | 'data' | 'general';
      enabled: boolean;
    }> = [
      {
        id: 'toggle-theme',
        key: 't',
        ctrlKey: true,
        description: 'Toggle theme (Ctrl+T)',
        category: 'general',
        enabled: true,
        action: () => {
          toggleTheme();
          addNotification({
            type: 'info',
            message: 'Theme toggled',
            duration: 2000
          });
        }
      },
      {
        id: 'toggle-sidebar',
        key: 'b',
        ctrlKey: true,
        description: 'Toggle sidebar (Ctrl+B)',
        category: 'navigation',
        enabled: true,
        action: () => {
          toggleSidebar();
          addNotification({
            type: 'info',
            message: 'Sidebar toggled',
            duration: 2000
          });
        }
      },
      {
        id: 'search',
        key: 'k',
        ctrlKey: true,
        description: 'Open search (Ctrl+K)',
        category: 'search',
        enabled: true,
        action: () => {
          const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            addNotification({
              type: 'info',
              message: 'Search focused',
              duration: 1000
            });
          }
        }
      },
      {
        id: 'escape',
        key: 'Escape',
        description: 'Close modals/overlays (Esc)',
        category: 'navigation',
        enabled: true,
        action: () => {
          // Close any open modals or overlays
          const modals = document.querySelectorAll('[role="dialog"], .modal, .overlay');
          modals.forEach(modal => {
            const closeBtn = modal.querySelector('[aria-label*="close"], .close, .modal-close');
            if (closeBtn) {
              (closeBtn as HTMLElement).click();
            }
          });
        }
      },
      {
        id: 'help',
        key: '?',
        shiftKey: true,
        description: 'Show keyboard shortcuts (?)',
        category: 'general',
        enabled: true,
        action: () => {
          addNotification({
            type: 'info',
            title: 'Keyboard Shortcuts',
            message: 'Ctrl+T: Toggle theme, Ctrl+B: Toggle sidebar, Ctrl+K: Search, ?: Help',
            duration: 5000
          });
        }
      }
    ];

    shortcuts.forEach(shortcut => registerShortcut(shortcut));

    return () => {
      shortcuts.forEach(shortcut => unregisterShortcut(shortcut.id));
    };
  }, [registerShortcut, unregisterShortcut, toggleTheme, toggleSidebar, addNotification]);

  return null; // This component doesn't render anything
};

export default KeyboardShortcuts;