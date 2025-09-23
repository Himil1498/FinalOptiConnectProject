import React from 'react';

interface InfrastructureReportsTabProps {
  isDark: boolean;
  dataLength: number;
}

const InfrastructureReportsTab: React.FC<InfrastructureReportsTabProps> = ({
  isDark,
  dataLength
}) => {
  const reports = [
    {
      id: 'infrastructure-summary',
      title: 'Infrastructure Summary',
      description: 'Comprehensive overview of all infrastructure assets',
      icon: '📋',
      type: 'summary',
      lastGenerated: '2024-01-15',
      status: 'ready'
    },
    {
      id: 'maintenance-schedule',
      title: 'Maintenance Schedule',
      description: 'Upcoming maintenance tasks and schedules',
      icon: '🔧',
      type: 'schedule',
      lastGenerated: '2024-01-14',
      status: 'ready'
    },
    {
      id: 'capacity-analysis',
      title: 'Capacity Analysis',
      description: 'Network capacity utilization and forecasting',
      icon: '📊',
      type: 'analysis',
      lastGenerated: '2024-01-13',
      status: 'processing'
    },
    {
      id: 'cost-breakdown',
      title: 'Cost Breakdown',
      description: 'Infrastructure costs by category and region',
      icon: '💰',
      type: 'financial',
      lastGenerated: '2024-01-12',
      status: 'ready'
    },
    {
      id: 'performance-metrics',
      title: 'Performance Metrics',
      description: 'Infrastructure performance indicators and trends',
      icon: '📈',
      type: 'metrics',
      lastGenerated: '2024-01-11',
      status: 'ready'
    },
    {
      id: 'compliance-audit',
      title: 'Compliance Audit',
      description: 'Regulatory compliance status and requirements',
      icon: '✅',
      type: 'compliance',
      lastGenerated: '2024-01-10',
      status: 'outdated'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-800';
      case 'processing':
        return isDark ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-800';
      case 'outdated':
        return isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-800';
      default:
        return isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Infrastructure Reports</h3>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Generate Report
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Schedule Reports
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg border ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-full ${
              isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'
            }`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Total Assets
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {dataLength}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-full ${
              isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-600'
            }`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Active Assets
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {Math.floor(dataLength * 0.85)}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-full ${
              isDark ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
            }`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Maintenance Due
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {Math.floor(dataLength * 0.12)}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-purple-50 border-purple-200'
        }`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-full ${
              isDark ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-600'
            }`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 104 0 2 2 0 00-4 0zm6 0a2 2 0 104 0 2 2 0 00-4 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Total Cost
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ₹{Math.floor(dataLength * 2.5)}L
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map(report => (
          <div key={report.id} className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{report.icon}</div>
                <div>
                  <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {report.title}
                  </h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                </div>
              </div>
            </div>

            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {report.description}
            </p>

            <div className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Last generated: {report.lastGenerated}
            </div>

            <div className="flex space-x-2">
              <button className={`flex-1 px-3 py-2 text-xs rounded ${
                report.status === 'ready'
                  ? isDark
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : isDark
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
              } transition-colors`}>
                {report.status === 'ready' ? 'Download' : 'Generating...'}
              </button>
              <button className={`px-3 py-2 text-xs rounded border ${
                isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              } transition-colors`}>
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Report Templates */}
      <div className={`border rounded-lg p-6 ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <h4 className={`font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Custom Report Templates
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Weekly Summary', frequency: 'Weekly', nextRun: '2024-01-22' },
            { name: 'Monthly Analytics', frequency: 'Monthly', nextRun: '2024-02-01' },
            { name: 'Quarterly Review', frequency: 'Quarterly', nextRun: '2024-04-01' }
          ].map(template => (
            <div key={template.name} className={`p-4 rounded border ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
            }`}>
              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {template.name}
              </div>
              <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {template.frequency} • Next: {template.nextRun}
              </div>
              <button className={`mt-3 text-xs px-3 py-1 rounded ${
                isDark
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              } transition-colors`}>
                Edit Template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfrastructureReportsTab;