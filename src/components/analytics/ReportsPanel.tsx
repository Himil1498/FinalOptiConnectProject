import React, { useState } from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { AnalyticsFilter, AnalyticsReport } from '../../types';
import {
  DocumentArrowDownIcon,
  CalendarIcon,
  FunnelIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface ReportsPanelProps {
  reports: AnalyticsReport[];
  onGenerateReport: (type: AnalyticsReport['type'], filter: AnalyticsFilter, format: AnalyticsReport['format']) => Promise<string>;
}

interface ReportGeneratorProps {
  onGenerateReport: (type: AnalyticsReport['type'], filter: AnalyticsFilter, format: AnalyticsReport['format']) => Promise<string>;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ onGenerateReport }) => {
  const [selectedType, setSelectedType] = useState<AnalyticsReport['type']>('usage_summary');
  const [selectedFormat, setSelectedFormat] = useState<AnalyticsReport['format']>('json');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = [
    { value: 'usage_summary', label: 'Usage Summary', description: 'Overall platform usage statistics' },
    { value: 'user_activity', label: 'User Activity', description: 'Detailed user behavior analysis' },
    { value: 'tool_metrics', label: 'Tool Metrics', description: 'Tool usage and performance data' },
    { value: 'data_analytics', label: 'Data Analytics', description: 'Data creation and management insights' },
    { value: 'performance', label: 'Performance Report', description: 'System performance and health metrics' },
    { value: 'custom', label: 'Custom Report', description: 'Custom analytics report' }
  ] as const;

  const formatOptions = [
    { value: 'json', label: 'JSON', icon: '📄', description: 'Machine-readable format' },
    { value: 'csv', label: 'CSV', icon: '📊', description: 'Spreadsheet compatible' },
    { value: 'pdf', label: 'PDF', icon: '📑', description: 'Print-ready format' }
  ] as const;

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const filter: AnalyticsFilter = {
        dateRange: {
          start: new Date(dateRange.start).toISOString(),
          end: new Date(dateRange.end).toISOString()
        }
      };
      await onGenerateReport(selectedType, filter, selectedFormat);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
        Generate New Report
      </h3>

      <div className="space-y-6">
        {/* Report Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reportTypes.map((type) => (
              <label key={type.value} className="relative flex cursor-pointer">
                <input
                  type="radio"
                  name="reportType"
                  value={type.value}
                  checked={selectedType === type.value}
                  onChange={(e) => setSelectedType(e.target.value as AnalyticsReport['type'])}
                  className="sr-only"
                />
                <div className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                  selectedType === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}>
                  <div className="font-medium text-sm text-gray-900">{type.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Date Range</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
          <div className="grid grid-cols-3 gap-3">
            {formatOptions.map((format) => (
              <label key={format.value} className="relative flex cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value={format.value}
                  checked={selectedFormat === format.value}
                  onChange={(e) => setSelectedFormat(e.target.value as AnalyticsReport['format'])}
                  className="sr-only"
                />
                <div className={`flex-1 p-3 rounded-lg border-2 text-center transition-colors ${
                  selectedFormat === format.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}>
                  <div className="text-lg mb-1">{format.icon}</div>
                  <div className="font-medium text-sm text-gray-900">{format.label}</div>
                  <div className="text-xs text-gray-500">{format.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center">
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              Generating Report...
            </span>
          ) : (
            'Generate Report'
          )}
        </button>
      </div>
    </div>
  );
};

interface ReportListProps {
  reports: AnalyticsReport[];
}

const ReportList: React.FC<ReportListProps> = ({ reports }) => {
  const getStatusIcon = (status: AnalyticsReport['status']) => {
    switch (status) {
      case 'ready':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'generating':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: AnalyticsReport['status']) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'generating':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="text-center py-8">
          <DocumentArrowDownIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Generated</h3>
          <p className="text-gray-500">Generate your first analytics report to see it here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Generated Reports</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {reports.map((report) => (
          <div key={report.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  {getStatusIcon(report.status)}
                  <h4 className="ml-2 text-sm font-medium text-gray-900">{report.title}</h4>
                  <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                  <span className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {formatDate(report.generatedAt)}
                  </span>
                  <span className="flex items-center">
                    <FunnelIcon className="h-4 w-4 mr-1" />
                    {report.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="uppercase">{report.format}</span>
                </div>
                {report.period && (
                  <div className="mt-1 text-xs text-gray-500">
                    Period: {new Date(report.period.start).toLocaleDateString()} - {new Date(report.period.end).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {report.status === 'ready' && report.downloadUrl && (
                  <a
                    href={report.downloadUrl}
                    download
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                    Download
                  </a>
                )}
                {report.expiresAt && new Date(report.expiresAt) > new Date() && (
                  <span className="text-xs text-gray-500">
                    Expires {formatDate(report.expiresAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ReportsPanel: React.FC<ReportsPanelProps> = ({ reports, onGenerateReport }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics Reports</h2>
        <p className="text-gray-600 mb-6">
          Generate comprehensive reports for various aspects of your platform usage and performance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ReportGenerator onGenerateReport={onGenerateReport} />
        </div>
        <div className="lg:col-span-2">
          <ReportList reports={reports} />
        </div>
      </div>
    </div>
  );
};