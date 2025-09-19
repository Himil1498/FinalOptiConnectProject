import React, { useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard';
import { DataAnalyticsPanel } from '../components/analytics/DataAnalyticsPanel';
import { PerformanceMonitor } from '../components/analytics/PerformanceMonitor';
import { ReportsPanel } from '../components/analytics/ReportsPanel';
import NavigationBar from '../components/common/NavigationBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  ChartBarIcon,
  DocumentChartBarIcon,
  CpuChipIcon,
  DocumentArrowDownIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

type AnalyticsTab = 'overview' | 'data' | 'performance' | 'reports';

interface TabButtonProps {
  id: AnalyticsTab;
  label: string;
  icon: React.ComponentType<any>;
  isActive: boolean;
  onClick: (tab: AnalyticsTab) => void;
}

const TabButton: React.FC<TabButtonProps> = ({ id, label, icon: Icon, isActive, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-100 text-blue-700 border border-blue-200'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`}
  >
    <Icon className="h-5 w-5 mr-2" />
    {label}
  </button>
);

export const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const {
    usageStats,
    userActivities,
    toolMetrics,
    dataAnalytics,
    systemHealth,
    performance,
    trends,
    reports,
    insights,
    loading,
    error,
    generateReport
  } = useAnalytics();

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: ChartBarIcon },
    { id: 'data' as const, label: 'Data Analytics', icon: DocumentChartBarIcon },
    { id: 'performance' as const, label: 'Performance', icon: CpuChipIcon },
    { id: 'reports' as const, label: 'Reports', icon: DocumentArrowDownIcon }
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationBar />
        <div className="flex items-center justify-center pt-20">
          <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Analytics Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationBar />
        <div className="flex items-center justify-center pt-20">
          <LoadingSpinner size="xl" text="Loading analytics..." />
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AnalyticsDashboard />;
      case 'data':
        return dataAnalytics ? (
          <DataAnalyticsPanel dataAnalytics={dataAnalytics} />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No data analytics available</p>
          </div>
        );
      case 'performance':
        return performance && systemHealth ? (
          <PerformanceMonitor performance={performance} systemHealth={systemHealth} />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No performance data available</p>
          </div>
        );
      case 'reports':
        return <ReportsPanel reports={reports} onGenerateReport={generateReport} />;
      default:
        return <AnalyticsDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />

      {/* Analytics Header with Back Button */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link
              to="/dashboard"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors mr-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Analytics Overview</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Analytics</h2>
          <p className="text-gray-600 mb-6">
            Comprehensive insights into platform usage, performance, and user engagement
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex flex-wrap space-x-2 p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                id={tab.id}
                label={tab.label}
                icon={tab.icon}
                isActive={activeTab === tab.id}
                onClick={setActiveTab}
              />
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="transition-opacity duration-200">
          {renderTabContent()}
        </div>

        {/* Quick Stats Footer */}
        {usageStats && (
          <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Statistics</h3>
            <div className="layout-grid-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{usageStats.totalUsers}</div>
                <div className="text-sm text-gray-600">Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{usageStats.activeUsers}</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{usageStats.totalSessions}</div>
                <div className="text-sm text-gray-600">Sessions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{usageStats.totalDataItems}</div>
                <div className="text-sm text-gray-600">Items</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};