import React, { useState, useCallback, useRef } from 'react';
import {
  ImportFile,
  ImportJob,
  ImportSettings,
  FieldMapping,
  ImportTemplate,
  GeospatialData,
  ImportError,
  ImportWarning
} from '../../types';

interface DataImportSystemProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

const DataImportSystem: React.FC<DataImportSystemProps> = ({
  isOpen,
  onClose,
  currentUserId,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'jobs' | 'templates' | 'layers'>('upload');
  const [selectedFiles, setSelectedFiles] = useState<ImportFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [showFieldMapping, setShowFieldMapping] = useState(false);
  const [currentMappingFile, setCurrentMappingFile] = useState<ImportFile | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [importSettings, setImportSettings] = useState<ImportSettings>({
    batchSize: 1000,
    skipInvalidRecords: true,
    createBackup: true,
    overwriteExisting: false,
    coordinateSystem: 'WGS84',
    preserveAttributes: true,
    validateGeometry: true
  });
  const [activeJobs, setActiveJobs] = useState<ImportJob[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data for templates and jobs
  const mockTemplates: ImportTemplate[] = [
    {
      id: 'template-1',
      name: 'Telecom Infrastructure',
      description: 'Template for importing telecom tower and equipment data',
      fileType: 'csv',
      fieldMappings: [
        {
          sourceField: 'latitude',
          targetField: 'lat',
          dataType: 'coordinate',
          required: true
        },
        {
          sourceField: 'longitude',
          targetField: 'lng',
          dataType: 'coordinate',
          required: true
        },
        {
          sourceField: 'tower_name',
          targetField: 'name',
          dataType: 'string',
          required: true
        }
      ],
      settings: importSettings,
      isBuiltIn: true,
      createdBy: '1',
      createdAt: '2024-01-01T00:00:00Z',
      usageCount: 45
    },
    {
      id: 'template-2',
      name: 'Network Coverage Areas',
      description: 'Template for importing coverage polygon data',
      fileType: 'xlsx',
      fieldMappings: [
        {
          sourceField: 'polygon_wkt',
          targetField: 'geometry',
          dataType: 'coordinate',
          required: true
        },
        {
          sourceField: 'signal_strength',
          targetField: 'strength',
          dataType: 'number',
          required: false
        }
      ],
      settings: importSettings,
      isBuiltIn: false,
      createdBy: '2',
      createdAt: '2024-01-10T00:00:00Z',
      usageCount: 12
    }
  ];

  const mockJobs: ImportJob[] = [
    {
      id: 'job-1',
      name: 'Maharashtra Tower Data Import',
      files: [],
      fieldMappings: {},
      settings: importSettings,
      status: 'running',
      progress: {
        total: 5000,
        processed: 3200,
        percentage: 64,
        currentFile: 'mumbai_towers.csv',
        errors: [],
        warnings: []
      },
      createdAt: '2024-01-15T10:30:00Z',
      startedAt: '2024-01-15T10:31:00Z',
      createdBy: currentUserId
    },
    {
      id: 'job-2',
      name: 'Network Coverage Import',
      files: [],
      fieldMappings: {},
      settings: importSettings,
      status: 'completed',
      progress: {
        total: 1250,
        processed: 1250,
        percentage: 100,
        errors: [
          {
            id: 'err-1',
            type: 'validation',
            severity: 'medium',
            message: 'Invalid coordinate format',
            file: 'coverage.kml',
            line: 45,
            timestamp: '2024-01-15T09:45:00Z'
          }
        ],
        warnings: [
          {
            id: 'warn-1',
            type: 'data_quality',
            message: 'Missing signal strength values',
            file: 'coverage.kml',
            line: 23,
            suggestions: ['Use default value', 'Skip record'],
            timestamp: '2024-01-15T09:42:00Z'
          }
        ]
      },
      createdAt: '2024-01-15T09:00:00Z',
      startedAt: '2024-01-15T09:01:00Z',
      completedAt: '2024-01-15T09:47:00Z',
      createdBy: currentUserId
    }
  ];

  // File validation and processing
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string; type?: ImportFile['type'] } => {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = ['csv', 'xlsx', 'kml', 'kmz'];

    if (file.size > maxSize) {
      return { isValid: false, error: 'File size exceeds 100MB limit' };
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedTypes.includes(extension)) {
      return { isValid: false, error: 'Unsupported file type. Please use CSV, XLSX, KML, or KMZ files.' };
    }

    return { isValid: true, type: extension as ImportFile['type'] };
  }, []);

  const processFile = useCallback(async (file: File): Promise<ImportFile> => {
    const validation = validateFile(file);

    const importFile: ImportFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: validation.type!,
      file,
      status: validation.isValid ? 'validating' : 'invalid',
      error: validation.error
    };

    if (validation.isValid) {
      // Simulate file processing
      setTimeout(() => {
        setSelectedFiles(prev => prev.map(f =>
          f.id === importFile.id
            ? {
                ...f,
                status: 'valid',
                metadata: {
                  recordCount: Math.floor(Math.random() * 1000) + 100,
                  columns: f.type === 'csv' || f.type === 'xlsx'
                    ? ['id', 'name', 'latitude', 'longitude', 'type', 'status']
                    : undefined,
                  encoding: 'UTF-8',
                  coordinateSystem: 'WGS84'
                }
              }
            : f
        ));
      }, 2000);
    }

    return importFile;
  }, [validateFile]);

  const handleFileSelect = useCallback(async (files: FileList) => {
    const newFiles: ImportFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const importFile = await processFile(file);
      newFiles.push(importFile);
    }

    setSelectedFiles(prev => [...prev, ...newFiles]);
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const showPreviewForFile = useCallback((file: ImportFile) => {
    // Generate mock preview data
    const mockPreview = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Sample Record ${i + 1}`,
      latitude: 19.0760 + (Math.random() - 0.5) * 0.1,
      longitude: 72.8777 + (Math.random() - 0.5) * 0.1,
      type: ['Tower', 'Amplifier', 'Router'][Math.floor(Math.random() * 3)],
      status: ['Active', 'Inactive'][Math.floor(Math.random() * 2)]
    }));

    setPreviewData(mockPreview);
    setShowPreview(true);
  }, []);

  const startFieldMapping = useCallback((file: ImportFile) => {
    setCurrentMappingFile(file);

    // Initialize field mappings with detected columns
    const initialMappings: FieldMapping[] = file.metadata?.columns?.map(col => ({
      sourceField: col,
      targetField: '',
      dataType: 'string',
      required: false
    })) || [];

    setFieldMappings(initialMappings);
    setShowFieldMapping(true);
  }, []);

  const startImport = useCallback(() => {
    const validFiles = selectedFiles.filter(f => f.status === 'valid');

    if (validFiles.length === 0) {
      alert('No valid files to import');
      return;
    }

    const newJob: ImportJob = {
      id: `job-${Date.now()}`,
      name: `Import ${validFiles.length} file(s)`,
      files: validFiles,
      fieldMappings: {},
      settings: importSettings,
      status: 'preparing',
      progress: {
        total: validFiles.reduce((sum, f) => sum + (f.metadata?.recordCount || 0), 0),
        processed: 0,
        percentage: 0,
        errors: [],
        warnings: []
      },
      createdAt: new Date().toISOString(),
      createdBy: currentUserId
    };

    setActiveJobs(prev => [newJob, ...prev]);
    setSelectedFiles([]);
    setActiveTab('jobs');

    // Simulate job processing
    setTimeout(() => {
      setActiveJobs(prev => prev.map(job =>
        job.id === newJob.id
          ? { ...job, status: 'running', startedAt: new Date().toISOString() }
          : job
      ));
    }, 1000);
  }, [selectedFiles, importSettings, currentUserId]);

  const applyTemplate = useCallback((template: ImportTemplate) => {
    setFieldMappings(template.fieldMappings);
    setImportSettings(template.settings);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute inset-4 bg-white rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Data Import System</h2>
            <p className="text-sm text-gray-600 mt-1">
              Import KML, KMZ, CSV, and XLSX files with validation and field mapping
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'upload', label: 'Upload & Import', icon: '📤' },
            { id: 'jobs', label: 'Import Jobs', icon: '⚙️' },
            { id: 'templates', label: 'Templates', icon: '📋' },
            { id: 'layers', label: 'Data Layers', icon: '🗂️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Upload & Import Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className="space-y-4">
                  <div className="text-6xl">📁</div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Drop files here or click to browse
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Supports KML, KMZ, CSV, and XLSX files up to 100MB
                    </p>
                  </div>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Choose Files
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Import from URL
                    </button>
                  </div>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".csv,.xlsx,.kml,.kmz"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                className="hidden"
              />

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Selected Files ({selectedFiles.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {selectedFiles.map(file => (
                      <div key={file.id} className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-2xl">
                              {file.type === 'csv' && '📊'}
                              {file.type === 'xlsx' && '📈'}
                              {file.type === 'kml' && '🗺️'}
                              {file.type === 'kmz' && '📦'}
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{file.name}</h4>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                <span className="uppercase">{file.type}</span>
                                {file.metadata?.recordCount && (
                                  <span>{file.metadata.recordCount} records</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Status Indicator */}
                            <div className="flex items-center space-x-2">
                              {file.status === 'pending' && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                  Pending
                                </span>
                              )}
                              {file.status === 'validating' && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Validating...
                                </span>
                              )}
                              {file.status === 'valid' && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  Valid
                                </span>
                              )}
                              {file.status === 'invalid' && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                  Invalid
                                </span>
                              )}
                            </div>

                            {/* Action Buttons */}
                            {file.status === 'valid' && (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => showPreviewForFile(file)}
                                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                >
                                  Preview
                                </button>
                                {(file.type === 'csv' || file.type === 'xlsx') && (
                                  <button
                                    onClick={() => startFieldMapping(file)}
                                    className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                                  >
                                    Map Fields
                                  </button>
                                )}
                              </div>
                            )}

                            <button
                              onClick={() => removeFile(file.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        {file.error && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{file.error}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Settings */}
              {selectedFiles.some(f => f.status === 'valid') && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Batch Size
                      </label>
                      <input
                        type="number"
                        value={importSettings.batchSize}
                        onChange={(e) => setImportSettings(prev => ({
                          ...prev,
                          batchSize: parseInt(e.target.value)
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Coordinate System
                      </label>
                      <select
                        value={importSettings.coordinateSystem}
                        onChange={(e) => setImportSettings(prev => ({
                          ...prev,
                          coordinateSystem: e.target.value as any
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="WGS84">WGS84</option>
                        <option value="UTM">UTM</option>
                        <option value="Indian1975">Indian 1975</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={importSettings.skipInvalidRecords}
                            onChange={(e) => setImportSettings(prev => ({
                              ...prev,
                              skipInvalidRecords: e.target.checked
                            }))}
                            className="rounded mr-2"
                          />
                          <span className="text-sm text-gray-700">Skip invalid records</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={importSettings.createBackup}
                            onChange={(e) => setImportSettings(prev => ({
                              ...prev,
                              createBackup: e.target.checked
                            }))}
                            className="rounded mr-2"
                          />
                          <span className="text-sm text-gray-700">Create backup before import</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={importSettings.validateGeometry}
                            onChange={(e) => setImportSettings(prev => ({
                              ...prev,
                              validateGeometry: e.target.checked
                            }))}
                            className="rounded mr-2"
                          />
                          <span className="text-sm text-gray-700">Validate geometry</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setSelectedFiles([])}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={startImport}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Start Import
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Import Jobs</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Refresh
                </button>
              </div>

              <div className="space-y-4">
                {[...activeJobs, ...mockJobs].map(job => (
                  <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{job.name}</h4>
                        <p className="text-sm text-gray-500">
                          Created {new Date(job.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                        job.status === 'completed' ? 'bg-green-100 text-green-800' :
                        job.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Progress: {job.progress.processed} / {job.progress.total}</span>
                        <span>{job.progress.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress.percentage}%` }}
                        />
                      </div>
                      {job.progress.currentFile && (
                        <p className="text-xs text-gray-500 mt-1">
                          Processing: {job.progress.currentFile}
                        </p>
                      )}
                    </div>

                    {/* Errors and Warnings */}
                    {job.progress.errors.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-red-800 mb-2">
                          Errors ({job.progress.errors.length})
                        </h5>
                        <div className="space-y-1">
                          {job.progress.errors.slice(0, 3).map(error => (
                            <div key={error.id} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                              {error.message} {error.file && `(${error.file}:${error.line})`}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {job.progress.warnings.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-yellow-800 mb-2">
                          Warnings ({job.progress.warnings.length})
                        </h5>
                        <div className="space-y-1">
                          {job.progress.warnings.slice(0, 2).map(warning => (
                            <div key={warning.id} className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                              {warning.message} {warning.file && `(${warning.file}:${warning.line})`}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800">
                        View Details
                      </button>
                      {job.status === 'running' && (
                        <button className="px-3 py-1 text-sm text-red-600 hover:text-red-800">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Import Templates</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Create Template
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockTemplates.map(template => (
                  <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                      </div>
                      {template.isBuiltIn && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                          Built-in
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>File Type:</span>
                        <span className="uppercase font-medium">{template.fileType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mappings:</span>
                        <span className="font-medium">{template.fieldMappings.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Usage:</span>
                        <span className="font-medium">{template.usageCount} times</span>
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => applyTemplate(template)}
                        className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Apply
                      </button>
                      <button className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Layers Tab */}
          {activeTab === 'layers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Data Layers</h3>
                <div className="flex space-x-2">
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Export
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Create Layer
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Layer Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Features
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Imported
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Maharashtra Towers
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Imported
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        3,247 points
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Jan 15, 2024
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Visible
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Coverage Areas
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Imported
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        89 polygons
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Jan 15, 2024
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Hidden
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Field Mapping Modal */}
        {showFieldMapping && currentMappingFile && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Field Mapping - {currentMappingFile.name}
                </h3>
                <button
                  onClick={() => setShowFieldMapping(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {fieldMappings.map((mapping, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Source Field</label>
                      <input
                        type="text"
                        value={mapping.sourceField}
                        readOnly
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Target Field</label>
                      <select
                        value={mapping.targetField}
                        onChange={(e) => {
                          const newMappings = [...fieldMappings];
                          newMappings[index].targetField = e.target.value;
                          setFieldMappings(newMappings);
                        }}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select target field</option>
                        <option value="name">Name</option>
                        <option value="lat">Latitude</option>
                        <option value="lng">Longitude</option>
                        <option value="type">Type</option>
                        <option value="status">Status</option>
                        <option value="description">Description</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Data Type</label>
                      <select
                        value={mapping.dataType}
                        onChange={(e) => {
                          const newMappings = [...fieldMappings];
                          newMappings[index].dataType = e.target.value as any;
                          setFieldMappings(newMappings);
                        }}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="coordinate">Coordinate</option>
                        <option value="boolean">Boolean</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={mapping.required}
                          onChange={(e) => {
                            const newMappings = [...fieldMappings];
                            newMappings[index].required = e.target.checked;
                            setFieldMappings(newMappings);
                          }}
                          className="rounded mr-2"
                        />
                        <span className="text-sm text-gray-700">Required</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowFieldMapping(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowFieldMapping(false);
                    // Apply field mappings to the file
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Mapping
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-96 overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Data Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {previewData.length > 0 && Object.keys(previewData[0]).map(key => (
                        <th key={key} className="px-4 py-2 text-left font-medium text-gray-700">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {previewData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {Object.values(row).map((value: any, i) => (
                          <td key={i} className="px-4 py-2 text-gray-900">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataImportSystem;