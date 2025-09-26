import React, { useState, useCallback } from 'react';
import { useTempDataState, TempDataItem } from '../../hooks/useTempDataState';
import { useDataStore } from '../../contexts/DataStoreContext';
import StandardDialog from '../common/StandardDialog';

interface TempDataViewerProps {
  isOpen: boolean;
  onClose: () => void;
  onShowOnMap?: (data: any[]) => void;
}

const TempDataViewer: React.FC<TempDataViewerProps> = ({
  isOpen,
  onClose,
  onShowOnMap
}) => {
  const {
    tempData,
    deleteTempData,
    clearAllTempData,
    moveTempDataToPermanent,
    getTempDataStats
  } = useTempDataState();

  const { saveData } = useDataStore();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isMoving, setIsMoving] = useState<string | null>(null);

  const stats = getTempDataStats();

  const handleSelectItem = useCallback((id: string, checked: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === tempData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(tempData.map(item => item.id)));
    }
  }, [selectedItems.size, tempData]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedItems.size === 0) return;

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedItems.size} temporary items?`);
    if (confirmed) {
      selectedItems.forEach(id => deleteTempData(id));
      setSelectedItems(new Set());
    }
  }, [selectedItems, deleteTempData]);

  const handleMoveToPermanent = useCallback(async (item: TempDataItem) => {
    setIsMoving(item.id);
    try {
      await moveTempDataToPermanent(item.id, async (data, name) => {
        // Convert temp data back to proper format for permanent storage
        const infraData = {
          name: `${name} (from temp)`,
          type: 'infrastructure' as const,
          description: `Data moved from temporary state: ${item.source}`,
          category: 'Temporary Import',
          tags: ['temporary', 'imported', item.type],
          source: 'manual' as const,
          data: {
            locations: data.map((d: any, index: number) => ({
              id: d.id || `temp_loc_${index}`,
              name: d.name || `Location ${index + 1}`,
              lat: d.coordinates?.[0]?.lat || 0,
              lng: d.coordinates?.[0]?.lng || 0,
              type: 'pop' as const,
              status: 'active',
              properties: d
            })),
            totalCount: data.length,
            categories: ['pop']
          }
        };

        await saveData(infraData);
      });
    } catch (error) {
      console.error('Failed to move to permanent storage:', error);
      alert('Failed to save to permanent storage. Please try again.');
    } finally {
      setIsMoving(null);
    }
  }, [moveTempDataToPermanent, saveData]);

  const handleShowOnMap = useCallback((item: TempDataItem) => {
    if (onShowOnMap) {
      onShowOnMap(item.data);
    }
  }, [onShowOnMap]);

  if (!isOpen) return null;

  return (
    <StandardDialog
      isOpen={isOpen}
      onClose={onClose}
      title="🗂️ Temporary Data Viewer"
      size="xl"
    >
      <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">

        {/* Header with Stats */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-4">
          <h3 className="text-xl font-bold mb-2">📊 Temporary Data Overview</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
              <div className="text-sm opacity-80">Items</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalDataPoints}</div>
              <div className="text-sm opacity-80">Data Points</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{Object.keys(stats.byType).length}</div>
              <div className="text-sm opacity-80">Types</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg p-4 shadow-sm flex flex-wrap items-center gap-3">
          <button
            onClick={handleSelectAll}
            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            {selectedItems.size === tempData.length ? '📋 Deselect All' : '✅ Select All'}
          </button>

          <button
            onClick={handleDeleteSelected}
            disabled={selectedItems.size === 0}
            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            🗑️ Delete Selected ({selectedItems.size})
          </button>

          <button
            onClick={clearAllTempData}
            disabled={tempData.length === 0}
            className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            🧹 Clear All
          </button>
        </div>

        {/* Data Items */}
        <div className="space-y-3">
          {tempData.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-4xl mb-2">📭</div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Temporary Data</h3>
              <p className="text-gray-500">Export some data or save items to temporary state to see them here.</p>
            </div>
          ) : (
            tempData.map(item => (
              <div
                key={item.id}
                className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${
                  selectedItems.has(item.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                } hover:shadow-md transition-all`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600"
                    />

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-800">{item.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.type === 'export' ? 'bg-blue-100 text-blue-800' :
                          item.type === 'visualization' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {item.type}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <div>📁 Source: {item.source}</div>
                        <div>📊 Data Points: {Array.isArray(item.data) ? item.data.length : 0}</div>
                        <div>🕒 Created: {item.createdAt.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleShowOnMap(item)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Show on Map"
                    >
                      🗺️
                    </button>

                    <button
                      onClick={() => handleMoveToPermanent(item)}
                      disabled={isMoving === item.id}
                      className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Move to Permanent Storage"
                    >
                      {isMoving === item.id ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        '💾 Save'
                      )}
                    </button>

                    <button
                      onClick={() => deleteTempData(item.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Data Preview */}
                {Array.isArray(item.data) && item.data.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500 mb-2">Data Preview:</div>
                    <div className="bg-gray-50 rounded p-2 text-xs font-mono max-h-20 overflow-y-auto">
                      {item.data.slice(0, 3).map((dataItem, index) => (
                        <div key={index} className="text-gray-700">
                          {typeof dataItem === 'object' ? JSON.stringify(dataItem).substring(0, 100) + '...' : String(dataItem)}
                        </div>
                      ))}
                      {item.data.length > 3 && (
                        <div className="text-gray-500">... and {item.data.length - 3} more items</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-white rounded-lg p-4 shadow-sm border-t-4 border-gray-300">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              💡 Tip: Temporary data is perfect for previewing exports before committing them to permanent storage.
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </StandardDialog>
  );
};

export default TempDataViewer;