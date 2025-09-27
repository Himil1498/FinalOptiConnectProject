import React, { useState, useCallback, useRef } from 'react';
import { useDataStore } from '../../contexts/DataStoreContext';
import StandardDialog from '../common/StandardDialog';

interface DataImportManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (importedCount: number) => void;
}

interface ImportData {
  name: string;
  type: 'distance' | 'elevation' | 'polygon' | 'infrastructure' | 'kml';
  category: string;
  description?: string;
  data: any;
  tags: string[];
  source: 'manual' | 'imported' | 'kml';
}

interface ParsedImportResult {
  data: ImportData[];
  errors: string[];
  warnings: string[];
}

const DataImportManager: React.FC<DataImportManagerProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const { importData, generateDataName } = useDataStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importStep, setImportStep] = useState<'select' | 'preview' | 'importing' | 'complete'>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedImportResult | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [importProgress, setImportProgress] = useState(0);
  const [supportedFormats] = useState([
    'JSON (.json)',
    'CSV (.csv)',
    'KML (.kml)',
    'Excel (.xlsx, .xls)'
  ]);

  // Template data for different types
  const templates = {
    distance: {
      name: 'Distance Measurement Template',
      data: [{
        name: 'Sample Distance Measurement',
        type: 'distance',
        category: 'Measurements',
        description: 'Sample distance measurement data',
        data: {
          points: [
            { lat: 28.6139, lng: 77.2090, elevation: 216 },
            { lat: 28.6169, lng: 77.2100, elevation: 218 }
          ],
          totalDistance: 0.35,
          unit: 'km'
        },
        tags: ['sample', 'distance', 'measurement'],
        source: 'manual'
      }]
    },
    elevation: {
      name: 'Elevation Analysis Template',
      data: [{
        name: 'Sample Elevation Profile',
        type: 'elevation',
        category: 'Analysis',
        description: 'Sample elevation analysis data',
        data: {
          points: [
            { lat: 28.6139, lng: 77.2090, elevation: 216 },
            { lat: 28.6169, lng: 77.2100, elevation: 218 }
          ],
          elevationProfile: [216, 217, 218],
          maxElevation: 218,
          minElevation: 216,
          elevationGain: 2,
          totalDistance: 0.35,
          unit: 'km',
          averageGrade: 0.57
        },
        tags: ['sample', 'elevation', 'analysis'],
        source: 'manual'
      }]
    },
    polygon: {
      name: 'Polygon Area Template',
      data: [{
        name: 'Sample Polygon Area',
        type: 'polygon',
        category: 'Areas',
        description: 'Sample polygon area data',
        data: {
          points: [
            { lat: 28.6139, lng: 77.2090 },
            { lat: 28.6169, lng: 77.2100 },
            { lat: 28.6149, lng: 77.2120 },
            { lat: 28.6129, lng: 77.2110 }
          ],
          area: 0.12,
          perimeter: 1.4,
          unit: 'metric'
        },
        tags: ['sample', 'polygon', 'area'],
        source: 'manual'
      }]
    },
    infrastructure: {
      name: 'Infrastructure Data Template',
      data: [{
        name: 'Sample Infrastructure Data',
        type: 'infrastructure',
        category: 'Infrastructure',
        description: 'Sample infrastructure location data',
        data: {
          locations: [
            {
              lat: 28.6139,
              lng: 77.2090,
              name: 'Tower Site 1',
              type: 'Cell Tower',
              status: 'Active',
              capacity: '100Mbps',
              coverage_radius: 5000
            },
            {
              lat: 28.6169,
              lng: 77.2100,
              name: 'Fiber Hub 1',
              type: 'Fiber Node',
              status: 'Active',
              capacity: '1Gbps',
              connections: 50
            }
          ],
          totalCount: 2,
          categories: ['Cell Tower', 'Fiber Node']
        },
        tags: ['sample', 'infrastructure', 'telecom'],
        source: 'manual'
      }]
    }
  };

  const downloadTemplate = useCallback((type: keyof typeof templates) => {
    const template = templates[type];
    const blob = new Blob([JSON.stringify(template.data, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_import_template.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const downloadAllTemplates = useCallback(() => {
    const allTemplates = Object.entries(templates).reduce((acc, [key, template]) => {
      acc[key] = template.data;
      return acc;
    }, {} as Record<string, any>);

    const blob = new Blob([JSON.stringify(allTemplates, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all_import_templates.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const parseFile = useCallback(async (file: File): Promise<ParsedImportResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let data: ImportData[] = [];

    try {
      const fileContent = await file.text();
      const extension = file.name.split('.').pop()?.toLowerCase();

      switch (extension) {
        case 'json': {
          const parsed = JSON.parse(fileContent);

          // Handle different JSON structures
          if (Array.isArray(parsed)) {
            data = parsed.map((item, index) => ({
              ...item,
              source: item.source || 'imported',
              tags: item.tags || ['imported']
            }));
          } else if (parsed.data && Array.isArray(parsed.data)) {
            data = parsed.data.map((item: any) => ({
              ...item,
              source: item.source || 'imported',
              tags: item.tags || ['imported']
            }));
          } else {
            // Single object
            data = [{
              ...parsed,
              source: parsed.source || 'imported',
              tags: parsed.tags || ['imported']
            }];
          }
          break;
        }
        case 'csv': {
          // Basic CSV parsing for infrastructure data
          const lines = fileContent.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());

          if (lines.length < 2) {
            errors.push('CSV file must have at least one data row');
            break;
          }

          const locations = lines.slice(1)
            .filter(line => line.trim())
            .map((line, index) => {
              const values = line.split(',').map(v => v.trim());
              const location: any = {};

              headers.forEach((header, i) => {
                if (values[i] !== undefined) {
                  // Try to parse coordinates
                  if (header.toLowerCase().includes('lat') && !isNaN(parseFloat(values[i]))) {
                    location.lat = parseFloat(values[i]);
                  } else if (header.toLowerCase().includes('lng') || header.toLowerCase().includes('lon')) {
                    if (!isNaN(parseFloat(values[i]))) {
                      location.lng = parseFloat(values[i]);
                    }
                  } else {
                    location[header] = values[i];
                  }
                }
              });

              return location;
            })
            .filter(loc => loc.lat !== undefined && loc.lng !== undefined);

          if (locations.length === 0) {
            errors.push('No valid location data found in CSV. Make sure you have lat and lng columns.');
          } else {
            data = [{
              name: `Imported from ${file.name}`,
              type: 'infrastructure',
              category: 'Imported Data',
              description: `Imported infrastructure data from CSV file`,
              data: {
                locations,
                totalCount: locations.length,
                categories: Array.from(new Set(locations.map(loc => loc.type || 'Unknown').filter(Boolean)))
              },
              tags: ['imported', 'csv', 'infrastructure'],
              source: 'imported'
            }];
          }
          break;
        }
        case 'kml': {
          // Basic KML parsing
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(fileContent, 'text/xml');
          const placemarks = xmlDoc.getElementsByTagName('Placemark');

          const locations = Array.from(placemarks).map((placemark, index) => {
            const nameElement = placemark.getElementsByTagName('name')[0];
            const descElement = placemark.getElementsByTagName('description')[0];
            const coordsElement = placemark.getElementsByTagName('coordinates')[0];

            if (coordsElement) {
              const coords = coordsElement.textContent?.trim().split(',');
              if (coords && coords.length >= 2) {
                return {
                  name: nameElement?.textContent || `Location ${index + 1}`,
                  description: descElement?.textContent || '',
                  lng: parseFloat(coords[0]),
                  lat: parseFloat(coords[1]),
                  elevation: coords[2] ? parseFloat(coords[2]) : undefined
                };
              }
            }
            return null;
          }).filter(Boolean);

          if (locations.length === 0) {
            errors.push('No valid placemark data found in KML file');
          } else {
            data = [{
              name: `Imported from ${file.name}`,
              type: 'kml',
              category: 'KML Data',
              description: `Imported KML data with ${locations.length} locations`,
              data: {
                locations,
                totalCount: locations.length,
                categories: ['KML Import']
              },
              tags: ['imported', 'kml', 'geospatial'],
              source: 'kml'
            }];
          }
          break;
        }
        default:
          errors.push(`Unsupported file format: ${extension}`);
      }

      // Validate data
      data.forEach((item, index) => {
        if (!item.name) {
          warnings.push(`Item ${index + 1}: Missing name, using default`);
          item.name = generateDataName(item.type);
        }
        if (!item.type) {
          errors.push(`Item ${index + 1}: Missing data type`);
        }
        if (!item.category) {
          warnings.push(`Item ${index + 1}: Missing category, using default`);
          item.category = 'Imported Data';
        }
      });

    } catch (error) {
      errors.push(`Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { data, errors, warnings };
  }, [generateDataName]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const result = await parseFile(file);
    setParsedData(result);

    if (result.data.length > 0) {
      setSelectedItems(new Set(result.data.map((_, index) => index)));
      setImportStep('preview');
    }
  }, [parseFile]);

  const handleImport = useCallback(async () => {
    if (!parsedData || selectedItems.size === 0) return;

    setImportStep('importing');
    setImportProgress(0);

    const selectedData = parsedData.data.filter((_, index) => selectedItems.has(index));
    let imported = 0;

    try {
      for (let i = 0; i < selectedData.length; i++) {
        const item = selectedData[i];

        // Simulate import process
        await new Promise(resolve => setTimeout(resolve, 200));

        // Import the data (you'll need to implement this in your data store)
        // await importData(item);

        imported++;
        setImportProgress(Math.round((imported / selectedData.length) * 100));
      }

      setImportStep('complete');
      onImportComplete?.(imported);

    } catch (error) {
      console.error('Import failed:', error);
      // Handle error
    }
  }, [parsedData, selectedItems, onImportComplete]);

  const resetImport = useCallback(() => {
    setImportStep('select');
    setSelectedFile(null);
    setParsedData(null);
    setSelectedItems(new Set());
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const toggleItemSelection = useCallback((index: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  if (!isOpen) return null;

  return (
    <StandardDialog
      isOpen={isOpen}
      onClose={onClose}
      title="📥 Import Data"
      size="xl"
    >
      <div className="p-6">
        {importStep === 'select' && (
          <div className="space-y-6">
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">📁</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select File to Import
              </h3>
              <p className="text-gray-600 mb-4">
                Choose a file containing your data to import
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv,.kml,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Choose File
              </button>
            </div>

            {/* Supported Formats */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Supported Formats:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {supportedFormats.map(format => (
                  <li key={format}>• {format}</li>
                ))}
              </ul>
            </div>

            {/* Templates Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">📋 Download Templates</h4>
              <p className="text-sm text-gray-600 mb-4">
                Need help with the format? Download our templates to see the expected data structure.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {Object.entries(templates).map(([type, template]) => (
                  <button
                    key={type}
                    onClick={() => downloadTemplate(type as keyof typeof templates)}
                    className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <div className="font-medium capitalize">{type}</div>
                    <div className="text-xs text-gray-500">Template</div>
                  </button>
                ))}
              </div>

              <button
                onClick={downloadAllTemplates}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                📦 Download All Templates
              </button>
            </div>
          </div>
        )}

        {importStep === 'preview' && parsedData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Preview Import Data</h3>
              <div className="text-sm text-gray-600">
                {selectedItems.size} of {parsedData.data.length} items selected
              </div>
            </div>

            {/* Errors and Warnings */}
            {parsedData.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="font-medium text-red-800 mb-1">Errors:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {parsedData.errors.map((error, i) => <li key={i}>• {error}</li>)}
                </ul>
              </div>
            )}

            {parsedData.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="font-medium text-yellow-800 mb-1">Warnings:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {parsedData.warnings.map((warning, i) => <li key={i}>• {warning}</li>)}
                </ul>
              </div>
            )}

            {/* Data Preview */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {parsedData.data.map((item, index) => (
                  <div
                    key={index}
                    className={`p-3 border-b border-gray-100 flex items-center space-x-3 ${
                      selectedItems.has(index) ? 'bg-blue-50' : 'bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.has(index)}
                      onChange={() => toggleItemSelection(index)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{item.name}</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {item.type}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.source === 'imported' ? 'bg-blue-100 text-blue-700' :
                          item.source === 'kml' ? 'bg-red-100 text-red-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {item.source}
                        </span>
                      </div>
                      {item.description && (
                        <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={resetImport}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={selectedItems.size === 0 || parsedData.errors.length > 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Import {selectedItems.size} Items
              </button>
            </div>
          </div>
        )}

        {importStep === 'importing' && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">⏳</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Importing Data...</h3>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              />
            </div>
            <div className="text-sm text-gray-600">{importProgress}% Complete</div>
          </div>
        )}

        {importStep === 'complete' && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Import Complete!</h3>
            <p className="text-gray-600 mb-6">
              Successfully imported {selectedItems.size} items
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={resetImport}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Import More Data
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </StandardDialog>
  );
};

export default DataImportManager;