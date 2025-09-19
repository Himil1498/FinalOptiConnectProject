import React, { useState, useCallback, useRef } from 'react';
import { BulkOperation } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  UsersIcon,
  UserGroupIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface BulkOperationsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OperationCardProps {
  operation: BulkOperation;
  onCancel: (id: string) => void;
  onDownload: (id: string) => void;
}

const OperationCard: React.FC<OperationCardProps> = ({ operation, onCancel, onDownload }) => {
  const getStatusIcon = () => {
    switch (operation.status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'in_progress':
      case 'running':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <StopIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (operation.status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'in_progress':
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = () => {
    switch (operation.target) {
      case 'users': return <UsersIcon className="h-5 w-5" />;
      case 'groups': return <UserGroupIcon className="h-5 w-5" />;
      default: return <DocumentTextIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg mr-3">
            {getTypeIcon()}
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 capitalize">
              {operation.type} {operation.target}
            </h3>
            <p className="text-sm text-gray-600">Operation ID: {operation.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {operation.status}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {(operation.status === 'running' || operation.status === 'in_progress') && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{operation.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${operation.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{operation.processedItems} of {operation.totalItems} processed</span>
            {operation.failedItems > 0 && (
              <span className="text-red-600">{operation.failedItems} failed</span>
            )}
          </div>
        </div>
      )}

      {/* Results Summary */}
      {operation.results && operation.status === 'completed' && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Results Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-green-600 font-medium">{operation.results.successCount}</span>
              <span className="text-gray-600 ml-1">Successful</span>
            </div>
            <div>
              <span className="text-red-600 font-medium">{operation.results.failureCount}</span>
              <span className="text-gray-600 ml-1">Failed</span>
            </div>
            <div>
              <span className="text-yellow-600 font-medium">{operation.results.warnings.length}</span>
              <span className="text-gray-600 ml-1">Warnings</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Details */}
      {operation.results?.errors && operation.results.errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 rounded-md">
          <h4 className="text-sm font-medium text-red-900 mb-2">
            Errors ({operation.results.errors.length})
          </h4>
          <div className="max-h-32 overflow-y-auto">
            {operation.results.errors.slice(0, 5).map((error, index) => (
              <div key={index} className="text-sm text-red-700 mb-1">
                {error}
              </div>
            ))}
            {operation.results.errors.length > 5 && (
              <div className="text-sm text-red-600 italic">
                +{operation.results.errors.length - 5} more errors
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>Started: {new Date(operation.startedAt).toLocaleString()}</div>
        {operation.completedAt && (
          <div>Completed: {new Date(operation.completedAt).toLocaleString()}</div>
        )}
        <div>Initiated by: {operation.initiatedBy}</div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-end space-x-2">
        {(operation.status === 'running' || operation.status === 'in_progress') && (
          <button
            onClick={() => onCancel(operation.id)}
            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md border border-red-200"
          >
            Cancel
          </button>
        )}
        {operation.downloadUrl && operation.status === 'completed' && (
          <button
            onClick={() => onDownload(operation.id)}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200"
          >
            Download Results
          </button>
        )}
      </div>
    </div>
  );
};

export const BulkOperationsManager: React.FC<BulkOperationsManagerProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { addNotification } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [selectedOperation, setSelectedOperation] = useState<'import' | 'export'>('import');
  const [selectedTarget, setSelectedTarget] = useState<'users' | 'groups'>('users');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'xlsx'>('csv');
  const [importFile, setImportFile] = useState<File | null>(null);

  // Mock operations data
  const [operations, setOperations] = useState<BulkOperation[]>([
    {
      id: 'bulk-1',
      type: 'import',
      target: 'users',
      status: 'completed',
      progress: 100,
      totalItems: 150,
      processedItems: 150,
      failedItems: 5,
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      initiatedBy: user?.name || 'Administrator',
      parameters: { format: 'csv', createMode: 'skip_existing' },
      results: {
        successCount: 145,
        failureCount: 5,
        warnings: ['Some duplicate entries were skipped'],
        errors: ['Invalid email format at line 23', 'Username cannot be empty at line 45', 'Invalid role specified at line 67']
      },
      downloadUrl: '/api/bulk/bulk-1/results'
    },
    {
      id: 'bulk-2',
      type: 'export',
      target: 'groups',
      status: 'in_progress',
      progress: 75,
      totalItems: 50,
      processedItems: 37,
      failedItems: 0,
      startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      initiatedBy: user?.name || 'Administrator',
      parameters: { format: 'json', includeMembers: true }
    }
  ]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const handleStartOperation = useCallback(async () => {
    if (selectedOperation === 'import' && !importFile) {
      addNotification({
        type: 'error',
        message: 'Please select a file to import',
        duration: 3000
      });
      return;
    }

    const newOperation: BulkOperation = {
      id: `bulk-${Date.now()}`,
      type: selectedOperation,
      target: selectedTarget,
      status: 'pending',
      progress: 0,
      totalItems: selectedOperation === 'import' ? 100 : 50, // Mock values
      processedItems: 0,
      failedItems: 0,
      startedAt: new Date().toISOString(),
      initiatedBy: user?.name || 'Administrator',
      parameters: selectedOperation === 'import'
        ? { file: importFile?.name, format: importFile?.name.split('.').pop() }
        : { format: exportFormat, target: selectedTarget }
    };

    setOperations(prev => [newOperation, ...prev]);

    addNotification({
      type: 'success',
      message: `${selectedOperation} operation started`,
      duration: 3000
    });

    // Simulate operation progress
    setTimeout(() => {
      setOperations(prev => prev.map(op =>
        op.id === newOperation.id
          ? { ...op, status: 'in_progress' as const, progress: 25, processedItems: Math.floor(op.totalItems * 0.25) }
          : op
      ));
    }, 1000);

    setTimeout(() => {
      setOperations(prev => prev.map(op =>
        op.id === newOperation.id
          ? { ...op, progress: 75, processedItems: Math.floor(op.totalItems * 0.75) }
          : op
      ));
    }, 3000);

    setTimeout(() => {
      setOperations(prev => prev.map(op =>
        op.id === newOperation.id
          ? {
              ...op,
              status: 'completed',
              progress: 100,
              processedItems: op.totalItems,
              completedAt: new Date().toISOString(),
              downloadUrl: selectedOperation === 'export' ? `/api/bulk/${newOperation.id}/download` : undefined,
              results: {
                successCount: op.totalItems - 2,
                failureCount: 2,
                warnings: ['Some items had validation warnings'],
                errors: ['Sample error 1 at line 5', 'Sample error 2 at line 12']
              }
            }
          : op
      ));
    }, 5000);

    // Reset form
    setImportFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedOperation, selectedTarget, exportFormat, importFile, user?.name, addNotification]);

  const handleCancelOperation = useCallback((operationId: string) => {
    setOperations(prev => prev.map(op =>
      op.id === operationId && (op.status === 'running' || op.status === 'in_progress')
        ? { ...op, status: 'cancelled' as const }
        : op
    ));

    addNotification({
      type: 'info',
      message: 'Operation cancelled',
      duration: 3000
    });
  }, [addNotification]);

  const handleDownloadResults = useCallback((operationId: string) => {
    // Simulate file download
    const operation = operations.find(op => op.id === operationId);
    if (operation) {
      addNotification({
        type: 'success',
        message: 'Download started',
        duration: 3000
      });
    }
  }, [operations, addNotification]);

  const generateTemplate = useCallback(() => {
    let csvContent = '';
    if (selectedTarget === 'users') {
      csvContent = 'username,email,name,role,department,phone\n' +
                   'john.doe,john@example.com,John Doe,viewer,Engineering,+1234567890\n' +
                   'jane.smith,jane@example.com,Jane Smith,manager,Operations,+1234567891';
    } else {
      csvContent = 'name,description,permissions,members\n' +
                   'Engineering Team,Development team,"read,write","john.doe,jane.smith"\n' +
                   'Operations Team,Operations team,"read,admin","jane.smith,bob.jones"';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTarget}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [selectedTarget]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Bulk Operations Manager</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('new')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'new'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              New Operation
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Operation History ({operations.length})
            </button>
          </nav>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          {activeTab === 'new' ? (
            <div className="space-y-6">
              {/* Operation Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Operation Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedOperation('import')}
                    className={`p-4 border-2 rounded-lg text-left ${
                      selectedOperation === 'import'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                      <span className="font-medium">Import</span>
                    </div>
                    <p className="text-sm text-gray-600">Upload and import data from a file</p>
                  </button>
                  <button
                    onClick={() => setSelectedOperation('export')}
                    className={`p-4 border-2 rounded-lg text-left ${
                      selectedOperation === 'export'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                      <span className="font-medium">Export</span>
                    </div>
                    <p className="text-sm text-gray-600">Export existing data to a file</p>
                  </button>
                </div>
              </div>

              {/* Target Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Target Data</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedTarget('users')}
                    className={`p-4 border-2 rounded-lg text-left ${
                      selectedTarget === 'users'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <UsersIcon className="h-5 w-5 mr-2" />
                      <span className="font-medium">Users</span>
                    </div>
                    <p className="text-sm text-gray-600">User accounts and profiles</p>
                  </button>
                  <button
                    onClick={() => setSelectedTarget('groups')}
                    className={`p-4 border-2 rounded-lg text-left ${
                      selectedTarget === 'groups'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <UserGroupIcon className="h-5 w-5 mr-2" />
                      <span className="font-medium">Groups</span>
                    </div>
                    <p className="text-sm text-gray-600">User groups and permissions</p>
                  </button>
                </div>
              </div>

              {/* Import Configuration */}
              {selectedOperation === 'import' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload File
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                            <span>Upload a file</span>
                            <input
                              ref={fileInputRef}
                              type="file"
                              className="sr-only"
                              accept=".csv,.json,.xlsx"
                              onChange={handleFileSelect}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">CSV, JSON, or XLSX up to 10MB</p>
                        {importFile && (
                          <p className="text-sm text-green-600 font-medium">{importFile.name}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Need a template?</span>
                    <button
                      onClick={generateTemplate}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Download {selectedTarget} template
                    </button>
                  </div>
                </div>
              )}

              {/* Export Configuration */}
              {selectedOperation === 'export' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['csv', 'json', 'xlsx'] as const).map((format) => (
                      <button
                        key={format}
                        onClick={() => setExportFormat(format)}
                        className={`p-3 border-2 rounded-lg text-center ${
                          exportFormat === format
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <span className="font-medium uppercase">{format}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Start Operation Button */}
              <div className="flex items-center justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={handleStartOperation}
                  disabled={selectedOperation === 'import' && !importFile}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Start {selectedOperation}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {operations.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No operations yet</h3>
                  <p className="text-gray-600">Start your first bulk operation to see it here.</p>
                </div>
              ) : (
                operations.map((operation) => (
                  <OperationCard
                    key={operation.id}
                    operation={operation}
                    onCancel={handleCancelOperation}
                    onDownload={handleDownloadResults}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};