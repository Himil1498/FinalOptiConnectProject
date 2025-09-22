import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../../hooks/useTheme';
import StandardDialog from './StandardDialog';

interface KeyboardShortcutsProps {
  onToolActivation?: (toolId: string) => void;
  onWorkflowOpen?: () => void;
  onDataManagerOpen?: () => void;
  onSearchOpen?: () => void;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  onToolActivation,
  onWorkflowOpen,
  onDataManagerOpen,
  onSearchOpen
}) => {
  const { registerShortcut, unregisterShortcut, toggleTheme, toggleSidebar, addNotification } = useTheme();
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);

  // Use refs to store stable references for functions
  const onToolActivationRef = useRef(onToolActivation);
  const onWorkflowOpenRef = useRef(onWorkflowOpen);
  const onDataManagerOpenRef = useRef(onDataManagerOpen);
  const onSearchOpenRef = useRef(onSearchOpen);

  // Update refs when props change
  useEffect(() => {
    onToolActivationRef.current = onToolActivation;
    onWorkflowOpenRef.current = onWorkflowOpen;
    onDataManagerOpenRef.current = onDataManagerOpen;
    onSearchOpenRef.current = onSearchOpen;
  });

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
      // Enhanced tool shortcuts
      {
        id: 'activate-distance-tool',
        key: 'd',
        ctrlKey: true,
        description: 'Activate Distance Tool (Ctrl+D)',
        category: 'tools',
        enabled: true,
        action: () => {
          onToolActivationRef.current?.('distance');
          addNotification({
            type: 'info',
            message: 'Distance tool activated',
            duration: 2000
          });
        }
      },
      {
        id: 'activate-polygon-tool',
        key: 'p',
        ctrlKey: true,
        description: 'Activate Polygon Tool (Ctrl+P)',
        category: 'tools',
        enabled: true,
        action: () => {
          onToolActivationRef.current?.('polygon');
          addNotification({
            type: 'info',
            message: 'Polygon tool activated',
            duration: 2000
          });
        }
      },
      {
        id: 'activate-elevation-tool',
        key: 'e',
        ctrlKey: true,
        description: 'Activate Elevation Tool (Ctrl+E)',
        category: 'tools',
        enabled: true,
        action: () => {
          onToolActivationRef.current?.('elevation');
          addNotification({
            type: 'info',
            message: 'Elevation tool activated',
            duration: 2000
          });
        }
      },
      {
        id: 'open-workflows',
        key: 'w',
        ctrlKey: true,
        description: 'Open Workflow Presets (Ctrl+W)',
        category: 'tools',
        enabled: true,
        action: () => {
          onWorkflowOpenRef.current?.();
          addNotification({
            type: 'info',
            message: 'Workflow presets opened',
            duration: 2000
          });
        }
      },
      {
        id: 'open-data-manager',
        key: 'm',
        ctrlKey: true,
        description: 'Open Data Manager (Ctrl+M)',
        category: 'data',
        enabled: true,
        action: () => {
          onDataManagerOpenRef.current?.();
          addNotification({
            type: 'info',
            message: 'Data Manager opened',
            duration: 2000
          });
        }
      },
      {
        id: 'save-current-work',
        key: 's',
        ctrlKey: true,
        description: 'Save Current Work (Ctrl+S)',
        category: 'data',
        enabled: true,
        action: () => {
          // Trigger save for currently active tool
          const activeToolSaveBtn = document.querySelector('[data-save-button]:not([disabled])');
          if (activeToolSaveBtn) {
            (activeToolSaveBtn as HTMLElement).click();
            addNotification({
              type: 'success',
              message: 'Work saved',
              duration: 2000
            });
          } else {
            addNotification({
              type: 'warning',
              message: 'No active work to save',
              duration: 2000
            });
          }
        }
      },
      {
        id: 'export-data',
        key: 'e',
        ctrlKey: true,
        shiftKey: true,
        description: 'Export Data (Ctrl+Shift+E)',
        category: 'data',
        enabled: true,
        action: () => {
          // Trigger export for currently active tool
          const activeExportBtn = document.querySelector('[data-export-button]:not([disabled])');
          if (activeExportBtn) {
            (activeExportBtn as HTMLElement).click();
            addNotification({
              type: 'success',
              message: 'Data export initiated',
              duration: 2000
            });
          } else {
            addNotification({
              type: 'warning',
              message: 'No data to export',
              duration: 2000
            });
          }
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
          if (onSearchOpenRef.current) {
            onSearchOpenRef.current();
            addNotification({
              type: 'info',
              message: 'Search opened',
              duration: 2000
            });
          } else {
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
          setShowShortcutsDialog(true);
        }
      }
    ];

    shortcuts.forEach(shortcut => registerShortcut(shortcut));

    return () => {
      shortcuts.forEach(shortcut => unregisterShortcut(shortcut.id));
    };
  }, [registerShortcut, unregisterShortcut]);

  return (
    <StandardDialog
      isOpen={showShortcutsDialog}
      onClose={() => setShowShortcutsDialog(false)}
      title="⌨️ Keyboard Shortcuts"
      size="lg"
    >
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Navigation Shortcuts */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              🧭 Navigation
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Toggle sidebar</span>
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+B</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Close modals</span>
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Esc</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Search</span>
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+K</kbd>
              </div>
            </div>
          </div>

          {/* Tool Shortcuts */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              🔧 Tools
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Distance Tool</span>
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+D</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Polygon Tool</span>
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+P</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Elevation Tool</span>
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+E</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Workflow Presets</span>
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+W</kbd>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              💾 Data Management
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Save work</span>
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+S</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Export data</span>
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+Shift+E</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Data Manager</span>
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+M</kbd>
              </div>
            </div>
          </div>

          {/* General */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              ⚙️ General
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Toggle theme</span>
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+T</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Show shortcuts</span>
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">?</kbd>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Pro Tip:</strong> Most shortcuts work when tools are active. Save and export shortcuts work with the currently focused tool.
          </p>
        </div>
      </div>
    </StandardDialog>
  )
};

export default KeyboardShortcuts;