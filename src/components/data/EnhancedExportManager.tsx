import React, { useState, useCallback, useMemo } from 'react';
import { useDataStore, SavedDataItem } from '../../contexts/DataStoreContext';
import StandardDialog from '../common/StandardDialog';

interface EnhancedExportManagerProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedItems?: string[];
  preSelectedType?: 'all' | 'distance' | 'elevation' | 'polygon' | 'infrastructure';
}

interface ExportOptions {
  format: 'json' | 'csv' | 'kml' | 'excel' | 'pdf';
  includeMetadata: boolean;
  includeImages: boolean;
  compression: boolean;
  customFields: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

const EnhancedExportManager: React.FC<EnhancedExportManagerProps> = ({
  isOpen,
  onClose,
  preSelectedItems = [],
  preSelectedType = 'all'
}) => {
  const { allData, exportData, getDataByType, getDataStats } = useDataStore();

  // State
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(preSelectedItems));
  const [exportType, setExportType] = useState<'selected' | 'filtered' | 'all'>('selected');
  const [filterType, setFilterType] = useState<SavedDataItem['type'] | 'all'>(preSelectedType);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'json',
    includeMetadata: true,
    includeImages: false,
    compression: false,
    customFields: []
  });
  const [isExporting, setIsExporting] = useState(false);

  // Get data based on export type and filters
  const dataToExport = useMemo(() => {
    switch (exportType) {
      case 'selected':
        return allData.filter(item => selectedItems.has(item.id));
      case 'filtered':
        return filterType === 'all' ? allData : getDataByType(filterType);
      case 'all':
      default:
        return allData;
    }
  }, [exportType, selectedItems, filterType, allData, getDataByType]);

  // Export statistics
  const exportStats = useMemo(() => {
    const stats = {
      total: dataToExport.length,
      byType: {} as Record<SavedDataItem['type'], number>,
      totalSize: 0,
      dateRange: { earliest: new Date(), latest: new Date() }
    };

    if (dataToExport.length > 0) {
      dataToExport.forEach(item => {
        stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
        stats.totalSize += item.metadata.size;
        if (item.createdAt < stats.dateRange.earliest) stats.dateRange.earliest = item.createdAt;
        if (item.createdAt > stats.dateRange.latest) stats.dateRange.latest = item.createdAt;
      });
    }

    return stats;
  }, [dataToExport]);

  // Handle item selection
  const handleItemToggle = useCallback((id: string, selected: boolean) => {
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
    const availableItems = filterType === 'all' ? allData : getDataByType(filterType);
    setSelectedItems(new Set(availableItems.map(item => item.id)));
  }, [filterType, allData, getDataByType]);

  const handleDeselectAll = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // Advanced export function
  const handleAdvancedExport = useCallback(async () => {
    if (dataToExport.length === 0) return;

    setIsExporting(true);

    try {
      let blob: Blob;
      const itemIds = dataToExport.map(item => item.id);

      switch (options.format) {
        case 'json':
          blob = await exportData(itemIds, 'json');
          break;
        case 'csv':
          blob = await exportData(itemIds, 'csv');
          break;
        case 'kml':
          blob = await exportData(itemIds, 'kml');
          break;
        case 'excel':
          blob = await exportToExcel(dataToExport, options);
          break;
        case 'pdf':
          blob = await exportToPDF(dataToExport, options);
          break;
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }

      // Download the file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `opticonnect-export-${Date.now()}.${options.format}`;
      a.click();
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [dataToExport, options, exportData, onClose]);

  // Excel export function
  const exportToExcel = useCallback(async (data: SavedDataItem[], opts: ExportOptions): Promise<Blob> => {
    // Create Excel-compatible CSV with advanced formatting
    const headers = [
      'ID', 'Name', 'Type', 'Category', 'Created', 'Updated', 'Size (KB)',
      ...(opts.includeMetadata ? ['Version', 'Author', 'Tags'] : []),
      'Description'
    ];

    const rows = data.map(item => [
      item.id,
      `"${item.name}"`,
      item.type,
      item.category,
      item.createdAt.toISOString(),
      item.updatedAt.toISOString(),
      (item.metadata.size / 1024).toFixed(2),
      ...(opts.includeMetadata ? [
        item.metadata.version.toString(),
        item.metadata.author || '',
        `"${item.tags.join(', ')}"`,
      ] : []),
      `"${item.description || ''}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv' });
  }, []);

  // PDF export function
  const exportToPDF = useCallback(async (data: SavedDataItem[], opts: ExportOptions): Promise<Blob> => {
    // Create a formatted HTML content for PDF conversion
    const htmlContent = `
      <html>
        <head>
          <title>OptiConnect Data Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
            .item { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
            .item-header { font-weight: bold; color: #333; margin-bottom: 10px; }
            .metadata { font-size: 12px; color: #666; }
            .type-distance { border-left: 4px solid #3B82F6; }
            .type-elevation { border-left: 4px solid #10B981; }
            .type-polygon { border-left: 4px solid #F59E0B; }
            .type-infrastructure { border-left: 4px solid #8B5CF6; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>OptiConnect Data Export Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>

          <div class="stats">
            <h3>Export Summary</h3>
            <p>Total Items: ${data.length}</p>
            <p>Export Format: ${opts.format.toUpperCase()}</p>
            <p>Date Range: ${exportStats.dateRange.earliest.toLocaleDateString()} - ${exportStats.dateRange.latest.toLocaleDateString()}</p>
          </div>

          ${data.map(item => `
            <div class="item type-${item.type}">
              <div class="item-header">
                ${getTypeEmoji(item.type)} ${item.name}
              </div>
              <p><strong>Type:</strong> ${item.type}</p>
              <p><strong>Category:</strong> ${item.category}</p>
              <p><strong>Created:</strong> ${item.createdAt.toLocaleDateString()}</p>
              ${item.description ? `<p><strong>Description:</strong> ${item.description}</p>` : ''}
              ${opts.includeMetadata ? `
                <div class="metadata">
                  <p>Version: ${item.metadata.version} | Size: ${(item.metadata.size / 1024).toFixed(2)} KB</p>
                  <p>Tags: ${item.tags.join(', ')}</p>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </body>
      </html>
    `;

    return new Blob([htmlContent], { type: 'text/html' });
  }, [exportStats]);

  const getTypeEmoji = (type: SavedDataItem['type']) => {
    const emojis = {
      distance: '📏',
      elevation: '⛰️',
      polygon: '🔺',
      infrastructure: '🏗️',
      kml: '🗺️'
    };
    return emojis[type] || '📄';
  };

  if (!isOpen) return null;

  return (
    <StandardDialog
      isOpen={isOpen}
      onClose={onClose}
      title="🚀 Enhanced Data Export"
      size="xl"
    >
      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Export Type Selection */}
        <div>
          <h3 className="text-lg font-semibold mb-3">📊 What to Export</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="exportType"
                value="selected"
                checked={exportType === 'selected'}
                onChange={(e) => setExportType(e.target.value as typeof exportType)}
                className="w-4 h-4 text-blue-600"
              />
              <span>Selected Items ({selectedItems.size} items)</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="exportType"
                value="filtered"
                checked={exportType === 'filtered'}
                onChange={(e) => setExportType(e.target.value as typeof exportType)}
                className="w-4 h-4 text-blue-600"
              />
              <span>Filtered by Type</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="exportType"
                value="all"
                checked={exportType === 'all'}
                onChange={(e) => setExportType(e.target.value as typeof exportType)}
                className="w-4 h-4 text-blue-600"
              />
              <span>All Data ({allData.length} items)</span>
            </label>
          </div>
        </div>

        {/* Filter Type (when filtered is selected) */}
        {exportType === 'filtered' && (
          <div>
            <h4 className="font-medium mb-2">Filter by Type</h4>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Types</option>
              <option value="distance">📏 Distance Measurements</option>
              <option value="elevation">⛰️ Elevation Analysis</option>
              <option value="polygon">🔺 Polygon Data</option>
              <option value="infrastructure">🏗️ Infrastructure Data</option>
              <option value="kml">🗺️ KML Data</option>
            </select>
          </div>
        )}

        {/* Format Selection */}
        <div>
          <h3 className="text-lg font-semibold mb-3">📄 Export Format</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { value: 'json', label: 'JSON', desc: 'Complete data structure' },
              { value: 'csv', label: 'CSV', desc: 'Spreadsheet compatible' },
              { value: 'kml', label: 'KML', desc: 'Geographic data' },
              { value: 'excel', label: 'Excel', desc: 'Enhanced spreadsheet' },
              { value: 'pdf', label: 'PDF', desc: 'Formatted report' }
            ].map(format => (
              <label key={format.value} className="flex items-start space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value={format.value}
                  checked={options.format === format.value}
                  onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value as ExportOptions['format'] }))}
                  className="w-4 h-4 text-blue-600 mt-1"
                />
                <div>
                  <div className="font-medium">{format.label}</div>
                  <div className="text-sm text-gray-600">{format.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Export Options */}
        <div>
          <h3 className="text-lg font-semibold mb-3">⚙️ Export Options</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={options.includeMetadata}
                onChange={(e) => setOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                className="w-4 h-4 text-blue-600"
              />
              <span>Include metadata (version, author, size)</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={options.includeImages}
                onChange={(e) => setOptions(prev => ({ ...prev, includeImages: e.target.checked }))}
                className="w-4 h-4 text-blue-600"
              />
              <span>Include images and attachments</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={options.compression}
                onChange={(e) => setOptions(prev => ({ ...prev, compression: e.target.checked }))}
                className="w-4 h-4 text-blue-600"
              />
              <span>Compress export file (ZIP)</span>
            </label>
          </div>
        </div>

        {/* Export Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">📋 Export Preview</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Items:</span>
              <div className="text-blue-600 font-bold">{exportStats.total}</div>
            </div>
            <div>
              <span className="font-medium">Format:</span>
              <div className="text-blue-600 font-bold">{options.format.toUpperCase()}</div>
            </div>
            <div>
              <span className="font-medium">Size:</span>
              <div className="text-blue-600 font-bold">{(exportStats.totalSize / 1024).toFixed(2)} KB</div>
            </div>
            <div>
              <span className="font-medium">Types:</span>
              <div className="text-blue-600 font-bold">{Object.keys(exportStats.byType).length}</div>
            </div>
          </div>
        </div>

        {/* Item Selection (if selected mode) */}
        {exportType === 'selected' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Select Items to Export</h4>
              <div className="space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Deselect All
                </button>
              </div>
            </div>
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
              {(filterType === 'all' ? allData : getDataByType(filterType)).map(item => (
                <label key={item.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={(e) => handleItemToggle(item.id, e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-xl">{getTypeEmoji(item.type)}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-gray-600">{item.type} • {item.updatedAt.toLocaleDateString()}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAdvancedExport}
            disabled={isExporting || dataToExport.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isExporting && <span className="animate-spin">⏳</span>}
            <span>{isExporting ? 'Exporting...' : `Export ${dataToExport.length} Items`}</span>
          </button>
        </div>
      </div>
    </StandardDialog>
  );
};

export default EnhancedExportManager;