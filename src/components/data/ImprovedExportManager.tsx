import React, { useState, useCallback, useMemo } from 'react';
import { useDataStore, SavedDataItem } from '../../contexts/DataStoreContext';
import StandardDialog from '../common/StandardDialog';

interface ImprovedExportManagerProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedItems?: string[];
  preSelectedType?: 'all' | 'distance' | 'elevation' | 'polygon' | 'infrastructure';
  onShowOnMap?: (data: any[]) => void;
  onSaveToTempState?: (data: any[], name: string) => void;
}

interface ExportPreview {
  id: string;
  name: string;
  type: string;
  coordinates?: { lat: number; lng: number }[];
  distance?: number;
  area?: number;
  elevation?: { max: number; min: number };
  created: string;
  simplified: boolean;
}

const ImprovedExportManager: React.FC<ImprovedExportManagerProps> = ({
  isOpen,
  onClose,
  preSelectedItems = [],
  preSelectedType = 'all',
  onShowOnMap,
  onSaveToTempState
}) => {
  const { allData, getDataByType } = useDataStore();

  // State
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(preSelectedItems));
  const [exportType, setExportType] = useState<'selected' | 'filtered' | 'all'>('selected');
  const [filterType, setFilterType] = useState<SavedDataItem['type'] | 'all'>(preSelectedType);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'kml' | 'kmz' | 'json'>('csv');
  const [simplifyData, setSimplifyData] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [tempDataName, setTempDataName] = useState('');

  // Get data to export with simplified format
  const dataToExport = useMemo(() => {
    let items: SavedDataItem[] = [];

    switch (exportType) {
      case 'selected':
        items = allData.filter(item => selectedItems.has(item.id));
        break;
      case 'filtered':
        items = filterType === 'all' ? allData : getDataByType(filterType);
        break;
      case 'all':
      default:
        items = allData;
    }

    return items;
  }, [exportType, selectedItems, filterType, allData, getDataByType]);

  // Convert data to simplified export format
  const exportPreviewData = useMemo((): ExportPreview[] => {
    return dataToExport.map(item => {
      const preview: ExportPreview = {
        id: item.id,
        name: item.name,
        type: item.type,
        created: item.createdAt.toLocaleDateString(),
        simplified: simplifyData
      };

      // Add type-specific data
      switch (item.type) {
        case 'distance':
          const distItem = item as any;
          preview.distance = distItem.data.totalDistance;
          preview.coordinates = distItem.data.points.map((p: any) => ({ lat: p.lat, lng: p.lng }));
          break;
        case 'elevation':
          const elevItem = item as any;
          preview.elevation = {
            max: elevItem.data.maxElevation,
            min: elevItem.data.minElevation
          };
          preview.coordinates = elevItem.data.points.map((p: any) => ({ lat: p.lat, lng: p.lng }));
          break;
        case 'polygon':
          const polyItem = item as any;
          preview.area = polyItem.data.area;
          preview.coordinates = polyItem.data.points.map((p: any) => ({ lat: p.lat, lng: p.lng }));
          break;
        case 'infrastructure':
        case 'kml':
          const infraItem = item as any;
          preview.coordinates = infraItem.data.locations.map((l: any) => ({ lat: l.lat, lng: l.lng }));
          break;
      }

      return preview;
    });
  }, [dataToExport, simplifyData]);

  // Export functions for different formats
  const exportToCSV = useCallback((data: ExportPreview[]): Blob => {
    const headers = simplifyData
      ? ['Name', 'Type', 'Distance', 'Area', 'Coordinates', 'Created']
      : ['ID', 'Name', 'Type', 'Distance', 'Area', 'Max Elevation', 'Min Elevation', 'Coordinates Count', 'Created'];

    const rows = data.map(item => {
      const coords = item.coordinates || [];
      const coordsString = simplifyData
        ? `${coords.length} points`
        : coords.map(c => `${c.lat.toFixed(6)},${c.lng.toFixed(6)}`).join(';');

      return simplifyData
        ? [
            `"${item.name}"`,
            item.type,
            item.distance?.toFixed(2) || '',
            item.area?.toFixed(2) || '',
            coordsString,
            item.created
          ]
        : [
            item.id,
            `"${item.name}"`,
            item.type,
            item.distance?.toFixed(2) || '',
            item.area?.toFixed(2) || '',
            item.elevation?.max?.toFixed(0) || '',
            item.elevation?.min?.toFixed(0) || '',
            coords.length.toString(),
            item.created
          ];
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    return new Blob([csvContent], { type: 'text/csv' });
  }, [simplifyData]);

  const exportToXLSX = useCallback((data: ExportPreview[]): Blob => {
    // Enhanced CSV format that Excel can handle better
    const headers = [
      'Name', 'Type', 'Distance (km)', 'Area (km²)', 'Elevation Max (m)',
      'Elevation Min (m)', 'Points Count', 'Start Lat', 'Start Lng', 'End Lat', 'End Lng', 'Created Date'
    ];

    const rows = data.map(item => {
      const coords = item.coordinates || [];
      const startCoord = coords[0];
      const endCoord = coords[coords.length - 1];

      return [
        `"${item.name}"`,
        item.type.toUpperCase(),
        item.distance?.toFixed(2) || '0',
        item.area?.toFixed(2) || '0',
        item.elevation?.max?.toFixed(0) || '0',
        item.elevation?.min?.toFixed(0) || '0',
        coords.length.toString(),
        startCoord?.lat.toFixed(6) || '0',
        startCoord?.lng.toFixed(6) || '0',
        endCoord?.lat.toFixed(6) || '0',
        endCoord?.lng.toFixed(6) || '0',
        item.created
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    return new Blob([csvContent], { type: 'application/vnd.ms-excel' });
  }, []);

  const exportToKML = useCallback((data: ExportPreview[]): Blob => {
    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>OptiConnect Export - ${new Date().toLocaleDateString()}</name>
    <description>Exported data from OptiConnect GIS Platform</description>

    <!-- Styles -->
    <Style id="distanceStyle">
      <LineStyle>
        <color>ff0000ff</color>
        <width>3</width>
      </LineStyle>
    </Style>

    <Style id="polygonStyle">
      <PolyStyle>
        <color>7f00ff00</color>
        <outline>1</outline>
      </PolyStyle>
    </Style>

    <Style id="infraStyle">
      <IconStyle>
        <color>ffff0000</color>
        <scale>1.0</scale>
      </IconStyle>
    </Style>

    ${data.map(item => {
      const coords = item.coordinates || [];
      if (coords.length === 0) return '';

      const description = simplifyData
        ? `Type: ${item.type}${item.distance ? `\nDistance: ${item.distance.toFixed(2)} km` : ''}${item.area ? `\nArea: ${item.area.toFixed(2)} km²` : ''}`
        : `ID: ${item.id}\nType: ${item.type}\nCreated: ${item.created}${item.distance ? `\nDistance: ${item.distance.toFixed(2)} km` : ''}${item.area ? `\nArea: ${item.area.toFixed(2)} km²` : ''}${item.elevation ? `\nMax Elevation: ${item.elevation.max}m\nMin Elevation: ${item.elevation.min}m` : ''}`;

      if (item.type === 'infrastructure' || coords.length === 1) {
        // Point features
        return `
    <Placemark>
      <name>${item.name}</name>
      <description>${description}</description>
      <styleUrl>#infraStyle</styleUrl>
      <Point>
        <coordinates>${coords[0].lng},${coords[0].lat},0</coordinates>
      </Point>
    </Placemark>`;
      } else if (item.type === 'polygon' && coords.length > 2) {
        // Polygon features
        const coordString = coords.map(c => `${c.lng},${c.lat},0`).join(' ');
        return `
    <Placemark>
      <name>${item.name}</name>
      <description>${description}</description>
      <styleUrl>#polygonStyle</styleUrl>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${coordString} ${coords[0].lng},${coords[0].lat},0</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`;
      } else {
        // Line features (distance, elevation)
        const coordString = coords.map(c => `${c.lng},${c.lat},0`).join(' ');
        return `
    <Placemark>
      <name>${item.name}</name>
      <description>${description}</description>
      <styleUrl>#distanceStyle</styleUrl>
      <LineString>
        <coordinates>${coordString}</coordinates>
      </LineString>
    </Placemark>`;
      }
    }).join('')}
  </Document>
</kml>`;

    return new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
  }, [simplifyData]);

  const exportToKMZ = useCallback(async (data: ExportPreview[]): Promise<Blob> => {
    // For KMZ, we'll create a simplified KML and then compress it
    // Note: In a real implementation, you'd use a proper ZIP library like JSZip
    const kmlBlob = exportToKML(data);
    const kmlText = await kmlBlob.text();

    // Create a simple "compressed" version (in real app, use JSZip)
    const kmzContent = `KMZ Archive containing KML data:
${kmlText}`;

    return new Blob([kmzContent], { type: 'application/vnd.google-earth.kmz' });
  }, [exportToKML]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (exportPreviewData.length === 0) return;

    setIsExporting(true);
    try {
      let blob: Blob;
      let filename: string;

      switch (exportFormat) {
        case 'csv':
          blob = exportToCSV(exportPreviewData);
          filename = `opticonnect-export-${Date.now()}.csv`;
          break;
        case 'xlsx':
          blob = exportToXLSX(exportPreviewData);
          filename = `opticonnect-export-${Date.now()}.xlsx`;
          break;
        case 'kml':
          blob = exportToKML(exportPreviewData);
          filename = `opticonnect-export-${Date.now()}.kml`;
          break;
        case 'kmz':
          blob = await exportToKMZ(exportPreviewData);
          filename = `opticonnect-export-${Date.now()}.kmz`;
          break;
        case 'json':
          blob = new Blob([JSON.stringify(exportPreviewData, null, 2)], { type: 'application/json' });
          filename = `opticonnect-export-${Date.now()}.json`;
          break;
        default:
          throw new Error('Unsupported format');
      }

      // Download the file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [exportPreviewData, exportFormat, exportToCSV, exportToXLSX, exportToKML, exportToKMZ]);

  // Show on map
  const handleShowOnMap = useCallback(() => {
    if (onShowOnMap && exportPreviewData.length > 0) {
      onShowOnMap(exportPreviewData);
    }
  }, [onShowOnMap, exportPreviewData]);

  // Save to temporary state
  const handleSaveToTemp = useCallback(() => {
    if (onSaveToTempState && exportPreviewData.length > 0 && tempDataName.trim()) {
      onSaveToTempState(exportPreviewData, tempDataName);
      setTempDataName('');
    }
  }, [onSaveToTempState, exportPreviewData, tempDataName]);

  if (!isOpen) return null;

  return (
    <StandardDialog
      isOpen={isOpen}
      onClose={onClose}
      title="🚀 Enhanced Export Manager"
      size="xl"
    >
      <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-50">

        {/* Header Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
          <h3 className="text-xl font-bold text-gray-800 mb-2">📊 Export Configuration</h3>
          <p className="text-gray-600">Configure your export settings and preview the data before downloading</p>
        </div>

        {/* Export Type Selection */}
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="text-2xl mr-2">🎯</span>
            What to Export
          </h4>
          <div className="space-y-3">
            {[
              { value: 'selected', label: 'Selected Items', count: selectedItems.size, color: 'blue' },
              { value: 'filtered', label: 'Filtered by Type', count: filterType === 'all' ? allData.length : getDataByType(filterType).length, color: 'green' },
              { value: 'all', label: 'All Data', count: allData.length, color: 'purple' }
            ].map(option => (
              <label key={option.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="exportType"
                  value={option.value}
                  checked={exportType === option.value}
                  onChange={(e) => setExportType(e.target.value as typeof exportType)}
                  className={`w-4 h-4 text-${option.color}-600`}
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-800">{option.label}</span>
                  <span className={`ml-2 px-2 py-1 bg-${option.color}-100 text-${option.color}-800 rounded-full text-sm`}>
                    {option.count} items
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="text-2xl mr-2">📄</span>
            Export Format
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { value: 'csv', label: 'CSV', desc: 'Spreadsheet format', icon: '📊', color: 'green' },
              { value: 'xlsx', label: 'Excel', desc: 'Enhanced spreadsheet', icon: '📈', color: 'blue' },
              { value: 'kml', label: 'KML', desc: 'Google Earth format', icon: '🌍', color: 'red' },
              { value: 'kmz', label: 'KMZ', desc: 'Compressed KML', icon: '🗜️', color: 'orange' },
              { value: 'json', label: 'JSON', desc: 'Data format', icon: '⚙️', color: 'gray' }
            ].map(format => (
              <label key={format.value} className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                exportFormat === format.value
                  ? `border-${format.color}-500 bg-${format.color}-50`
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="format"
                  value={format.value}
                  checked={exportFormat === format.value}
                  onChange={(e) => setExportFormat(e.target.value as typeof exportFormat)}
                  className="sr-only"
                />
                <span className="text-3xl mb-2">{format.icon}</span>
                <div className="font-semibold text-gray-800">{format.label}</div>
                <div className="text-sm text-gray-600 text-center">{format.desc}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Data Options */}
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="text-2xl mr-2">⚙️</span>
            Data Options
          </h4>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <input
                type="checkbox"
                checked={simplifyData}
                onChange={(e) => setSimplifyData(e.target.checked)}
                className="w-4 h-4 text-green-600"
              />
              <div>
                <span className="font-medium text-green-800">Simplify exported data</span>
                <p className="text-sm text-green-600">Remove technical details for cleaner output</p>
              </div>
            </label>
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800 flex items-center">
              <span className="text-2xl mr-2">👁️</span>
              Export Preview ({exportPreviewData.length} items)
            </h4>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                showPreview
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>

          {showPreview && (
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
              {exportPreviewData.slice(0, 10).map(item => (
                <div key={item.id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-800">{item.name}</span>
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {item.type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.coordinates?.length} points
                    </div>
                  </div>
                </div>
              ))}
              {exportPreviewData.length > 10 && (
                <div className="p-3 text-center text-gray-500 text-sm">
                  ... and {exportPreviewData.length - 10} more items
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="bg-white rounded-lg p-5 shadow-sm space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="text-2xl mr-2">🚀</span>
            Actions
          </h4>

          {/* Temporary Data Save */}
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Enter name to save to temporary state..."
              value={tempDataName}
              onChange={(e) => setTempDataName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSaveToTemp}
              disabled={!tempDataName.trim() || exportPreviewData.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>💾</span>
              <span>Save to Temp</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleShowOnMap}
              disabled={exportPreviewData.length === 0}
              className="flex-1 min-w-[120px] px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all"
            >
              <span>🗺️</span>
              <span>Show on Map</span>
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting || exportPreviewData.length === 0}
              className="flex-1 min-w-[120px] px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all"
            >
              {isExporting && <span className="animate-spin">⏳</span>}
              <span>📥</span>
              <span>{isExporting ? 'Exporting...' : `Download ${exportFormat.toUpperCase()}`}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{exportPreviewData.length}</div>
              <div className="text-sm opacity-80">Items to Export</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{exportFormat.toUpperCase()}</div>
              <div className="text-sm opacity-80">Export Format</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{simplifyData ? 'Simple' : 'Detailed'}</div>
              <div className="text-sm opacity-80">Data Level</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {exportPreviewData.reduce((sum, item) => sum + (item.coordinates?.length || 0), 0)}
              </div>
              <div className="text-sm opacity-80">Total Points</div>
            </div>
          </div>
        </div>
      </div>
    </StandardDialog>
  );
};

export default ImprovedExportManager;