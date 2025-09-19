import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  BookmarkIcon,
  ArrowPathIcon,
  MinusIcon,
  WindowIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { usePanelManager } from './PanelManager';
import DraggablePanel from './DraggablePanel';
import { themeClasses, buttonVariants, focusStyles, componentPatterns, iconColors } from '../../utils/lightThemeHelper';

interface LayoutManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const LayoutManager: React.FC<LayoutManagerProps> = ({ isOpen, onClose }) => {
  const {
    panels,
    layouts,
    currentLayout,
    showPanel,
    hidePanel,
    minimizeAll,
    restoreAll,
    saveLayout,
    loadLayout,
    deleteLayout,
    resetToDefaults,
    bringToFront
  } = usePanelManager();

  const [newLayoutName, setNewLayoutName] = useState('');
  const [newLayoutDescription, setNewLayoutDescription] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleSaveLayout = () => {
    if (newLayoutName.trim()) {
      saveLayout(newLayoutName.trim(), newLayoutDescription.trim());
      setNewLayoutName('');
      setNewLayoutDescription('');
      setShowSaveDialog(false);
    }
  };

  const handleTogglePanel = (panelId: string) => {
    const panel = panels[panelId];
    if (panel?.isVisible) {
      hidePanel(panelId);
    } else {
      showPanel(panelId);
    }
  };

  const panelNames: Record<string, string> = {
    'live-coordinates': '📍 Live Coordinates',
    'search-system': '🔍 Search System',
    'tools-panel': '🛠️ Tools Panel',
    'analytics-dashboard': '📊 Analytics Dashboard',
    'data-manager': '🗃️ Data Manager',
    'admin-panel': '⚙️ Admin Panel',
    'user-management': '👥 User Management',
  };

  const getVisiblePanelsCount = () => {
    return Object.values(panels).filter(panel => panel.isVisible).length;
  };

  const getMinimizedPanelsCount = () => {
    return Object.values(panels).filter(panel => panel.isVisible && panel.isMinimized).length;
  };

  if (!isOpen) return null;

  return (
    <DraggablePanel
      id="layout-manager"
      title="🎛️ Layout Manager"
      defaultPosition={{ x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 300 }}
      minWidth={400}
      minHeight={500}
      canMinimize={true}
      canMaximize={true}
      canClose={true}
      onClose={onClose}
      zIndex={200}
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">
              {getVisiblePanelsCount()}
            </div>
            <div className="text-xs text-blue-700">Panels</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">
              {getMinimizedPanelsCount()}
            </div>
            <div className="text-xs text-orange-700">Minimized</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              {layouts.length}
            </div>
            <div className="text-xs text-green-700">Layouts</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center">
            <Cog6ToothIcon className="h-4 w-4 mr-2" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={minimizeAll}
              className="flex items-center justify-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <MinusIcon className="h-4 w-4 mr-2" />
              Minimize All
            </button>
            <button
              onClick={restoreAll}
              className="flex items-center justify-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <WindowIcon className="h-4 w-4 mr-2" />
              Restore All
            </button>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center justify-center p-2 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors text-sm"
            >
              <BookmarkIcon className="h-4 w-4 mr-2" />
              Save Layout
            </button>
            <button
              onClick={resetToDefaults}
              className="flex items-center justify-center p-2 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors text-sm"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Reset
            </button>
          </div>
        </div>

        {/* Panel Controls */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center">
            <WindowIcon className="h-4 w-4 mr-2" />
            Panel Controls
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(panels).map(([panelId, panel]) => (
              <div
                key={panelId}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">
                    {panelNames[panelId] || panelId}
                  </span>
                  {panel.isMinimized && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                      Minimized
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleTogglePanel(panelId)}
                  className={`p-1 rounded transition-colors ${
                    panel.isVisible
                      ? 'bg-green-100 hover:bg-green-200'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  title={panel.isVisible ? 'Hide Panel' : 'Show Panel'}
                >
                  {panel.isVisible ? (
                    <EyeIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeSlashIcon className="h-4 w-4 text-gray-600" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Layouts */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center">
            <BookmarkIcon className="h-4 w-4 mr-2" />
            Saved Layouts
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {layouts.map((layout) => (
              <div
                key={layout.id}
                className={`p-3 rounded-lg border-2 transition-all ${
                  currentLayout === layout.id
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-700">
                      {layout.name}
                    </div>
                    {layout.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {layout.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {currentLayout !== layout.id && (
                      <button
                        onClick={() => loadLayout(layout.id)}
                        className="p-1 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
                        title="Load Layout"
                      >
                        <ArrowPathIcon className="h-4 w-4 text-blue-600" />
                      </button>
                    )}
                    {!layout.id.startsWith('default') && !layout.id.startsWith('analysis') &&
                     !layout.id.startsWith('minimal') && !layout.id.startsWith('admin') && (
                      <button
                        onClick={() => deleteLayout(layout.id)}
                        className="p-1 bg-red-100 hover:bg-red-200 rounded transition-colors"
                        title="Delete Layout"
                      >
                        <TrashIcon className="h-4 w-4 text-red-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Layout Dialog */}
        <AnimatePresence>
          {showSaveDialog && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[300]"
              onClick={() => setShowSaveDialog(false)}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                className="bg-white p-6 rounded-xl shadow-xl border border-gray-200 w-96"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Save Current Layout
                  </h3>
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Layout Name
                    </label>
                    <input
                      type="text"
                      value={newLayoutName}
                      onChange={(e) => setNewLayoutName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-700"
                      placeholder="Enter layout name..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newLayoutDescription}
                      onChange={(e) => setNewLayoutDescription(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-700 h-20"
                      placeholder="Describe this layout..."
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveLayout}
                      disabled={!newLayoutName.trim()}
                      className="flex-1 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                    >
                      Save Layout
                    </button>
                    <button
                      onClick={() => setShowSaveDialog(false)}
                      className="flex-1 p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DraggablePanel>
  );
};

export default LayoutManager;