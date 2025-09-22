import React, { useState, useCallback, useMemo } from 'react';
import { AuditLogEntry } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ClockIcon,
  XMarkIcon,
  EyeIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface AuditLogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AuditLogFilters {
  dateRange: {
    start: string;
    end: string;
  };
  userId?: string;
  action?: string;
  resourceType?: string;
  outcome?: 'success' | 'failure' | 'partial';
  risk?: 'low' | 'medium' | 'high' | 'critical';
}

interface LogEntryDetailProps {
  entry: AuditLogEntry;
  onClose: () => void;
}

const LogEntryDetail: React.FC<LogEntryDetailProps> = ({ entry, onClose }) => {
  const getRiskColor = (risk: AuditLogEntry['risk']) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getOutcomeColor = (outcome: AuditLogEntry['outcome']) => {
    switch (outcome) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'failure': return 'text-red-600 bg-red-50';
      case 'partial': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Audit Log Entry Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Header Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entry ID</label>
                <p className="text-sm font-mono text-gray-900">{entry.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                <p className="text-sm text-gray-900">{new Date(entry.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                <p className="text-sm text-gray-900">{entry.userName} ({entry.userId})</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session ID</label>
                <p className="text-sm font-mono text-gray-900">{entry.sessionId}</p>
              </div>
            </div>

            {/* Action Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <p className="text-sm font-semibold text-gray-900 uppercase">{entry.action}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                <p className="text-sm text-gray-900">{entry.resource}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
                <p className="text-sm text-gray-900">{entry.resourceType}</p>
              </div>
              {entry.resourceId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resource ID</label>
                  <p className="text-sm font-mono text-gray-900">{entry.resourceId}</p>
                </div>
              )}
            </div>

            {/* Status Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOutcomeColor(entry.outcome)}`}>
                  {entry.outcome}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(entry.risk)}`}>
                  {entry.risk}
                </span>
              </div>
            </div>

            {/* Network Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                <p className="text-sm font-mono text-gray-900">{entry.ipAddress}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Agent</label>
                <p className="text-sm text-gray-900 break-all">{entry.userAgent}</p>
              </div>
            </div>

            {/* Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action Details</label>
              <div className="bg-gray-50 rounded-md p-4">
                <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                  {JSON.stringify(entry.details, null, 2)}
                </pre>
              </div>
            </div>

            {/* Metadata */}
            {entry.metadata && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Metadata</label>
                <div className="bg-gray-50 rounded-md p-4">
                  <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                    {JSON.stringify(entry.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof AuditLogEntry>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);

  const [filters, setFilters] = useState<AuditLogFilters>({
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    }
  });

  // Mock audit log data
  const mockAuditLogs: AuditLogEntry[] = useMemo(() => [
    {
      id: 'audit-1',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      userId: user?.id || 'admin',
      userName: user?.name || 'Administrator',
      action: 'login',
      resource: 'Authentication System',
      resourceType: 'system',
      details: { method: 'credentials', mfa: true },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      sessionId: 'sess-abc123',
      outcome: 'success',
      risk: 'low'
    },
    {
      id: 'audit-2',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      userId: 'user123',
      userName: 'John Doe',
      action: 'create',
      resource: 'Distance Measurement',
      resourceId: 'dist-456',
      resourceType: 'data',
      details: { startPoint: [19.0760, 72.8777], endPoint: [28.7041, 77.1025], distance: 1411.2 },
      ipAddress: '10.0.0.25',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      sessionId: 'sess-def456',
      outcome: 'success',
      risk: 'low'
    },
    {
      id: 'audit-3',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      userId: 'admin',
      userName: 'System Administrator',
      action: 'config_change',
      resource: 'System Configuration',
      resourceId: 'config-security-1',
      resourceType: 'configuration',
      details: {
        key: 'session.timeout',
        oldValue: 7200,
        newValue: 3600,
        reason: 'Security policy update'
      },
      ipAddress: '192.168.1.10',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      sessionId: 'sess-admin789',
      outcome: 'success',
      risk: 'medium'
    },
    {
      id: 'audit-4',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      userId: 'user456',
      userName: 'Jane Smith',
      action: 'login',
      resource: 'Authentication System',
      resourceType: 'system',
      details: { method: 'credentials', mfa: false, attempts: 3 },
      ipAddress: '203.45.67.89',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
      sessionId: 'sess-mobile123',
      outcome: 'failure',
      risk: 'high',
      metadata: { reason: 'Invalid credentials', blocked: true }
    },
    {
      id: 'audit-5',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      userId: 'admin',
      userName: 'System Administrator',
      action: 'export',
      resource: 'User Data Export',
      resourceType: 'data',
      details: {
        format: 'CSV',
        userCount: 150,
        includePersonalData: false,
        requestedBy: 'manager@company.com'
      },
      ipAddress: '192.168.1.10',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      sessionId: 'sess-admin789',
      outcome: 'success',
      risk: 'medium'
    }
  ], [user]);

  const filteredLogs = useMemo(() => {
    return mockAuditLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end + 'T23:59:59');

      const matchesDate = logDate >= startDate && logDate <= endDate;
      const matchesSearch = !searchTerm ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resourceType.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesUserId = !filters.userId || log.userId === filters.userId;
      const matchesAction = !filters.action || log.action === filters.action;
      const matchesResourceType = !filters.resourceType || log.resourceType === filters.resourceType;
      const matchesOutcome = !filters.outcome || log.outcome === filters.outcome;
      const matchesRisk = !filters.risk || log.risk === filters.risk;

      return matchesDate && matchesSearch && matchesUserId && matchesAction &&
             matchesResourceType && matchesOutcome && matchesRisk;
    });
  }, [mockAuditLogs, filters, searchTerm]);

  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [filteredLogs, sortField, sortDirection]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedLogs.slice(startIndex, startIndex + pageSize);
  }, [sortedLogs, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedLogs.length / pageSize);

  const handleSort = (field: keyof AuditLogEntry) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExport = useCallback(async () => {
    // Simulate export functionality
    const csvContent = [
      'ID,Timestamp,User,Action,Resource,Outcome,Risk,IP Address',
      ...sortedLogs.map(log =>
        `${log.id},${log.timestamp},${log.userName},${log.action},${log.resource},${log.outcome},${log.risk},${log.ipAddress}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [sortedLogs]);

  const getRiskColor = (risk: AuditLogEntry['risk']) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getOutcomeIcon = (outcome: AuditLogEntry['outcome']) => {
    switch (outcome) {
      case 'success': return <ShieldCheckIcon className="h-4 w-4 text-green-500" />;
      case 'failure': return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'partial': return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      default: return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DocumentTextIcon className="h-6 w-6 text-gray-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Audit Log Viewer</h2>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleExport}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export CSV
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <select
                  value={filters.outcome || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    outcome: e.target.value as any || undefined
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Outcomes</option>
                  <option value="success">Success</option>
                  <option value="failure">Failure</option>
                  <option value="partial">Partial</option>
                </select>
              </div>

              <div>
                <select
                  value={filters.risk || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    risk: e.target.value as any || undefined
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Risk Levels</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    { key: 'timestamp', label: 'Timestamp', sortable: true },
                    { key: 'userName', label: 'User', sortable: true },
                    { key: 'action', label: 'Action', sortable: true },
                    { key: 'resource', label: 'Resource', sortable: true },
                    { key: 'outcome', label: 'Outcome', sortable: true },
                    { key: 'risk', label: 'Risk', sortable: true },
                    { key: 'ipAddress', label: 'IP Address', sortable: true },
                    { key: 'actions', label: 'Actions', sortable: false }
                  ].map((column) => (
                    <th
                      key={column.key}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                      }`}
                      onClick={() => column.sortable && handleSort(column.key as keyof AuditLogEntry)}
                    >
                      <div className="flex items-center">
                        {column.label}
                        {column.sortable && sortField === column.key && (
                          sortDirection === 'asc' ?
                            <ChevronUpIcon className="h-4 w-4 ml-1" /> :
                            <ChevronDownIcon className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                      <div className="text-sm text-gray-500">{log.userId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.resource}</div>
                      <div className="text-sm text-gray-500">{log.resourceType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getOutcomeIcon(log.outcome)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">{log.outcome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(log.risk)}`}>
                        {log.risk}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {log.ipAddress}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedEntry(log)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, sortedLogs.length)}
                    </span>{' '}
                    of <span className="font-medium">{sortedLogs.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Entry Detail Modal */}
      {selectedEntry && (
        <LogEntryDetail
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </>
  );
};