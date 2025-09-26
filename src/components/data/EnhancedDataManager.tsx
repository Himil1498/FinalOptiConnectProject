import React, { useState, useCallback, useMemo } from 'react';
import { useDataStore, SavedDataItem, DistanceMeasurement, ElevationAnalysis, PolygonMeasurement, InfrastructureData } from '../../contexts/DataStoreContext';
import { useTempDataState } from '../../hooks/useTempDataState';
import StandardDialog, { ConfirmDialog } from '../common/StandardDialog';
import EnhancedExportManager from './EnhancedExportManager';
import ImprovedExportManager from './ImprovedExportManager';
import TempDataViewer from './TempDataViewer';

interface EnhancedDataManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onItemLoad?: (item: SavedDataItem) => void;
  onShowOnMap?: (data: any[]) => void;
}

const EnhancedDataManager: React.FC<EnhancedDataManagerProps> = ({
  isOpen,
  onClose,
  onItemLoad,
  onShowOnMap
}) => {
  const {
    allData,
    getDataByType,
    deleteData,
    updateData,
    searchData,
    getDataStats,
    exportData,
    importData,
    generateDataName
  } = useDataStore();

  const { saveTempData } = useTempDataState();

  // UI State
  const [activeTab, setActiveTab] = useState<'all' | 'distance' | 'elevation' | 'polygon' | 'infrastructure'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'type' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Dialog states
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showEnhancedExport, setShowEnhancedExport] = useState(false);
  const [showImprovedExport, setShowImprovedExport] = useState(false);
  const [showTempDataViewer, setShowTempDataViewer] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState<SavedDataItem | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    category: '',
    tags: [] as string[]
  });

  // Get filtered and sorted data
  const filteredData = useMemo(() => {
    let data = searchQuery ? searchData(searchQuery) : allData;

    if (activeTab !== 'all') {
      data = data.filter(item => item.type === activeTab);
    }

    // Sort data
    data.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'size':
          comparison = a.metadata.size - b.metadata.size;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return data;
  }, [allData, activeTab, searchQuery, sortBy, sortOrder, searchData]);

  const stats = getDataStats();

  // Event handlers
  const handleItemSelect = useCallback((id: string, selected: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === filteredData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredData.map(item => item.id)));
    }
  }, [selectedItems.size, filteredData]);

  const handleView = useCallback((item: SavedDataItem) => {
    setCurrentItem(item);
    setShowViewDialog(true);
  }, []);

  const handleEdit = useCallback((item: SavedDataItem) => {
    setCurrentItem(item);
    setEditForm({
      name: item.name,
      description: item.description || '',
      category: item.category,
      tags: [...item.tags]
    });
    setShowEditDialog(true);
  }, []);

  const handleDelete = useCallback((item: SavedDataItem) => {
    setCurrentItem(item);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (currentItem) {
      try {
        await deleteData(currentItem.id);
        setShowDeleteConfirm(false);
        setCurrentItem(null);
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    }
  }, [currentItem, deleteData]);

  // Map visualization handler
  const handleShowOnMap = useCallback((data: any[]) => {
    if (onShowOnMap) {
      onShowOnMap(data);
    }
  }, [onShowOnMap]);

  // Temporary data save handler
  const handleSaveToTempState = useCallback((data: any[], name: string) => {
    saveTempData(data, name, 'export', 'Enhanced Data Manager');
    alert(`Saved "${name}" to temporary state!`);
  }, [saveTempData]);

  const handleSaveEdit = useCallback(async () => {
    if (currentItem) {
      try {
        await updateData(currentItem.id, {
          name: editForm.name,
          description: editForm.description,
          category: editForm.category,
          tags: editForm.tags
        });
        setShowEditDialog(false);
        setCurrentItem(null);
      } catch (error) {
        console.error('Failed to update item:', error);
      }
    }
  }, [currentItem, editForm, updateData]);

  const handleExport = useCallback(async (format: 'json' | 'csv' | 'kml') => {
    try {
      const idsToExport = selectedItems.size > 0 ? Array.from(selectedItems) : filteredData.map(item => item.id);
      const blob = await exportData(idsToExport, format);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `opticonnect-data-export.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      setShowExportDialog(false);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  }, [selectedItems, filteredData, exportData]);

  const handleImport = useCallback(async (file: File) => {
    try {
      await importData(file);
      setShowImportDialog(false);
    } catch (error) {
      console.error('Failed to import data:', error);
    }
  }, [importData]);

  const handleLoad = useCallback((item: SavedDataItem) => {
    onItemLoad?.(item);
    onClose();
  }, [onItemLoad, onClose]);

  // Render functions
  const renderItemCard = useCallback((item: SavedDataItem) => {
    const isSelected = selectedItems.has(item.id);
    const typeEmoji = {
      distance: '📏',
      elevation: '⛰️',
      polygon: '🔺',
      infrastructure: '🏗️',
      kml: '🗺️'
    };

    return (
      <div
        key={item.id}
        className={`bg-white rounded-lg border-2 transition-all hover:shadow-lg ${
          isSelected ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
        }`}
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-2xl">{typeEmoji[item.type]}</span>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                <p className="text-xs text-gray-500">{item.type} • {item.category}</p>
              </div>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => handleView(item)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="View details"
              >
                👁️
              </button>
              <button
                onClick={() => handleEdit(item)}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
                title="Edit"
              >
                ✏️
              </button>
              <button
                onClick={() => handleLoad(item)}
                className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                title="Load data"
              >
                📂
              </button>
              <button
                onClick={() => handleDelete(item)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Delete"
              >
                🗑️
              </button>
            </div>
          </div>

          {item.description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.description}</p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{item.updatedAt.toLocaleDateString()}</span>
            <span>{item.metadata.size < 1024 ? `${item.metadata.size}B` : `${(item.metadata.size / 1024).toFixed(1)}KB`}</span>
          </div>

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  {tag}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span className="text-xs text-gray-400">+{item.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }, [selectedItems, handleItemSelect, handleView, handleEdit, handleLoad, handleDelete]);

  const renderDataDetails = useCallback((item: SavedDataItem) => {
    switch (item.type) {
      case 'distance': {
        const distData = item as DistanceMeasurement;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Distance</h4>
                <p className="text-lg font-bold text-blue-600">
                  {distData.data.totalDistance.toFixed(2)} {distData.data.unit}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Points</h4>
                <p className="text-lg font-bold text-green-600">{distData.data.points.length}</p>
              </div>
            </div>
            {distData.notes && (
              <div>
                <h4 className="font-medium text-gray-900">Notes</h4>
                <p className="text-sm text-gray-600">{distData.notes}</p>
              </div>
            )}
          </div>
        );
      }
      case 'elevation': {
        const elevData = item as ElevationAnalysis;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Max Elevation</h4>
                <p className="text-lg font-bold text-green-600">{elevData.data.maxElevation.toFixed(0)}m</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Elevation Gain</h4>
                <p className="text-lg font-bold text-blue-600">{elevData.data.elevationGain.toFixed(0)}m</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Distance</h4>
                <p className="text-lg font-bold text-purple-600">
                  {elevData.data.totalDistance.toFixed(2)} {elevData.data.unit}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Avg Grade</h4>
                <p className="text-lg font-bold text-orange-600">{elevData.data.averageGrade.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        );
      }
      case 'polygon': {
        const polyData = item as PolygonMeasurement;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Area</h4>
                <p className="text-lg font-bold text-green-600">
                  {polyData.data.area.toFixed(2)} {polyData.data.unit === 'metric' ? 'km²' : 'mi²'}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Perimeter</h4>
                <p className="text-lg font-bold text-blue-600">
                  {polyData.data.perimeter.toFixed(2)} {polyData.data.unit === 'metric' ? 'km' : 'mi'}
                </p>
              </div>
            </div>
          </div>
        );
      }
      case 'infrastructure':
      case 'kml': {
        const infraData = item as InfrastructureData;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Total Locations</h4>
                <p className="text-lg font-bold text-blue-600">{infraData.data.totalCount}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Categories</h4>
                <p className="text-lg font-bold text-green-600">{infraData.data.categories.length}</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Categories</h4>
              <div className="flex flex-wrap gap-2 mt-1">
                {infraData.data.categories.map(cat => (
                  <span key={cat} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      }
      default:
        return <p className="text-gray-500">No details available</p>;
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-[95%] h-[95%] max-w-7xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-900">💾 Data Manager</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Total: {stats.totalItems}</span>
              <span>Size: {(stats.totalSize / 1024).toFixed(1)} KB</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowImportDialog(true)}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              📥 Import
            </button>
            <button
              onClick={() => setShowEnhancedExport(true)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              📤 Basic Export
            </button>
            <button
              onClick={() => setShowImprovedExport(true)}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              🚀 Advanced Export
            </button>
            <button
              onClick={() => setShowTempDataViewer(true)}
              className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
            >
              🗂️ Temp Data
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-200 space-y-4">
          {/* Search and View Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search data..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="type">Sort by Type</option>
                <option value="size">Sort by Size</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              >
                ☰
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-1">
            {[
              { key: 'all', label: '🔍 All Data', count: stats.totalItems },
              { key: 'distance', label: '📏 Distance', count: stats.byType.distance || 0 },
              { key: 'elevation', label: '⛰️ Elevation', count: stats.byType.elevation || 0 },
              { key: 'polygon', label: '🔺 Polygon', count: stats.byType.polygon || 0 },
              { key: 'infrastructure', label: '🏗️ Infrastructure', count: (stats.byType.infrastructure || 0) + (stats.byType.kml || 0) }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Selection Controls */}
          {filteredData.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedItems.size === filteredData.length ? 'Deselect All' : 'Select All'}
                </button>
                {selectedItems.size > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No data found</h3>
              <p className="text-gray-500">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : `No ${activeTab === 'all' ? '' : activeTab} data available`}
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-2'
            }>
              {filteredData.map(renderItemCard)}
            </div>
          )}
        </div>

        {/* View Dialog */}
        <StandardDialog
          isOpen={showViewDialog}
          onClose={() => setShowViewDialog(false)}
          title={`View: ${currentItem?.name}`}
          size="lg"
        >
          {currentItem && (
            <div className="p-6 space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{currentItem.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Type: {currentItem.type}</span>
                  <span>Category: {currentItem.category}</span>
                  <span>Created: {currentItem.createdAt.toLocaleDateString()}</span>
                  <span>Updated: {currentItem.updatedAt.toLocaleDateString()}</span>
                </div>
                {currentItem.description && (
                  <p className="mt-2 text-gray-700">{currentItem.description}</p>
                )}
              </div>

              {renderDataDetails(currentItem)}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowViewDialog(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => handleLoad(currentItem)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Load Data
                </button>
              </div>
            </div>
          )}
        </StandardDialog>

        {/* Edit Dialog */}
        <StandardDialog
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          title={`Edit: ${currentItem?.name}`}
          size="md"
        >
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <input
                type="text"
                value={editForm.category}
                onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                value={editForm.tags.join(', ')}
                onChange={(e) => setEditForm(prev => ({
                  ...prev,
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => setShowEditDialog(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </StandardDialog>

        {/* Export Dialog */}
        <StandardDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          title="Export Data"
          size="md"
        >
          <div className="p-6 space-y-4">
            <p className="text-gray-700">
              Export {selectedItems.size > 0 ? selectedItems.size : filteredData.length} items
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleExport('json')}
                className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium">JSON Format</div>
                <div className="text-sm text-gray-600">Complete data with all metadata</div>
              </button>

              <button
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium">CSV Format</div>
                <div className="text-sm text-gray-600">Basic metadata for spreadsheets</div>
              </button>

              <button
                onClick={() => handleExport('kml')}
                className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium">KML Format</div>
                <div className="text-sm text-gray-600">Geographic data for mapping</div>
              </button>
            </div>
          </div>
        </StandardDialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
          title="Delete Data"
          message={`Are you sure you want to delete "${currentItem?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmVariant="danger"
        />

        {/* Enhanced Export Manager */}
        <EnhancedExportManager
          isOpen={showEnhancedExport}
          onClose={() => setShowEnhancedExport(false)}
          preSelectedItems={Array.from(selectedItems)}
          preSelectedType={activeTab}
        />

        {/* Improved Export Manager */}
        <ImprovedExportManager
          isOpen={showImprovedExport}
          onClose={() => setShowImprovedExport(false)}
          preSelectedItems={Array.from(selectedItems)}
          preSelectedType={activeTab}
          onShowOnMap={handleShowOnMap}
          onSaveToTempState={handleSaveToTempState}
        />

        {/* Temporary Data Viewer */}
        <TempDataViewer
          isOpen={showTempDataViewer}
          onClose={() => setShowTempDataViewer(false)}
          onShowOnMap={handleShowOnMap}
        />
      </div>
    </div>
  );
};

export default EnhancedDataManager;