import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { AnalyticsFilter, UsageTrend } from '../../types';
import {
  getAnalyticsPermissions,
  getFilteredMetrics,
  getFilteredUserActivities,
  shouldShowComponent
} from '../../utils/analyticsPermissions';
import {
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ArrowTrendingUpIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  BellIcon
} from '@heroicons/react/24/outline';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center text-sm ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <ArrowTrendingUpIcon
              className={`h-4 w-4 mr-1 ${trend.isPositive ? '' : 'rotate-180'}`}
            />
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </div>
  );
};

interface UsageChartProps {
  trends: UsageTrend[];
  metric: 'users' | 'sessions' | 'dataCreated';
  title: string;
}

const UsageChart: React.FC<UsageChartProps> = ({ trends, metric, title }) => {
  const maxValue = Math.max(...trends.map(t => t[metric]));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {trends.map((trend, index) => (
          <div key={trend.date} className="flex items-center">
            <span className="text-sm text-gray-500 w-20">
              {new Date(trend.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
            <div className="flex-1 ml-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(trend[metric] / maxValue) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-medium text-gray-900 w-12 text-right">
              {trend[metric]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ToolMetricsTableProps {
  toolMetrics: any[];
}

const ToolMetricsTable: React.FC<ToolMetricsTableProps> = ({ toolMetrics }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
    <div className="px-6 py-4 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900">Popular Tools</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tool
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Usage Count
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unique Users
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Success Rate
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Growth
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {toolMetrics.map((tool) => (
            <tr key={tool.toolType}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{tool.toolName}</div>
                <div className="text-sm text-gray-500">{tool.toolType}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {tool.usageCount.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {tool.uniqueUsers}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  tool.successRate >= 98 ? 'bg-green-100 text-green-800' :
                  tool.successRate >= 95 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {tool.successRate}%
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className={tool.growthRate > 0 ? 'text-green-600' : 'text-red-600'}>
                  {tool.growthRate > 0 ? '+' : ''}{tool.growthRate}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

interface UserActivityTableProps {
  userActivities: any[];
}

const UserActivityTable: React.FC<UserActivityTableProps> = ({ userActivities }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
    <div className="px-6 py-4 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900">User Activity</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sessions
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time Spent
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Data Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {userActivities.map((user) => (
            <tr key={user.userId}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{user.userName}</div>
                <div className="text-sm text-gray-500">@{user.userId}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user.sessionCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {Math.round(user.totalTimeSpent / 60)}h
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user.dataCreated}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.status === 'active' ? 'bg-green-100 text-green-800' :
                  user.status === 'idle' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {user.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const AnalyticsDashboard: React.FC = () => {
  const {
    usageStats,
    userActivities,
    toolMetrics,
    dataAnalytics,
    systemHealth,
    performance,
    trends,
    insights,
    refreshAnalytics,
    generateReport,
    getFilteredData,
    loading
  } = useAnalytics();

  const { user } = useAuth();
  const { addNotification } = useTheme();
  const [selectedDateRange, setSelectedDateRange] = useState<string>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get user permissions for analytics
  const permissions = getAnalyticsPermissions(user);

  // Filter data based on user permissions
  const filteredUserActivities = getFilteredUserActivities(userActivities || [], permissions);
  const filteredToolMetrics = getFilteredMetrics(toolMetrics || [], permissions);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAnalytics();
    setIsRefreshing(false);
  };

  const handleExportReport = async (format: 'json' | 'csv' | 'pdf') => {
    if (!permissions.canExportReports) {
      addNotification({
        type: 'error',
        message: 'You do not have permission to export reports',
        duration: 5000
      });
      return;
    }

    try {
      const maxDays = Math.min(7, permissions.maxDataRange);
      const filter: AnalyticsFilter = {
        dateRange: {
          start: new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      };

      const reportId = await generateReport('usage_summary', filter, format);
      addNotification({
        type: 'success',
        message: `${format.toUpperCase()} report generated successfully`,
        duration: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to generate report',
        duration: 5000
      });
    }
  };

  if (!usageStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Monitor platform usage, performance, and user engagement
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              {shouldShowComponent('exportReports', permissions) && (
                <div className="relative">
                  <select className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <option value="json" onClick={() => handleExportReport('json')}>Export JSON</option>
                    <option value="csv" onClick={() => handleExportReport('csv')}>Export CSV</option>
                    <option value="pdf" onClick={() => handleExportReport('pdf')}>Export PDF</option>
                  </select>
                </div>
              )}
              <div className="text-xs text-gray-500 flex items-center">
                Role: <span className="font-medium ml-1 capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Permission Notice for Limited Users */}
        {user?.role === 'viewer' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Limited Analytics Access</h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    You have viewer-level access to analytics. Some features and detailed metrics may not be visible.
                    Contact your administrator for expanded access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Users"
            value={usageStats.totalUsers}
            subtitle="All time"
            icon={UsersIcon}
            color="blue"
            trend={{ value: 12.5, isPositive: true }}
          />
          <MetricCard
            title="Active Users"
            value={usageStats.activeUsers}
            subtitle="Last 30 days"
            icon={ClockIcon}
            color="green"
            trend={{ value: 8.3, isPositive: true }}
          />
          <MetricCard
            title="Total Sessions"
            value={usageStats.totalSessions.toLocaleString()}
            subtitle="This month"
            icon={ChartBarIcon}
            color="purple"
            trend={{ value: 15.2, isPositive: true }}
          />
          <MetricCard
            title="Data Items"
            value={usageStats.totalDataItems.toLocaleString()}
            subtitle={`${usageStats.totalStorageUsed} GB`}
            icon={DocumentArrowDownIcon}
            color="yellow"
            trend={{ value: 22.1, isPositive: true }}
          />
        </div>

        {/* System Health */}
        {systemHealth && shouldShowComponent('systemHealth', permissions) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <MetricCard
              title="System Uptime"
              value={`${systemHealth.uptime}%`}
              subtitle="Last 30 days"
              icon={ShieldCheckIcon}
              color="green"
            />
            <MetricCard
              title="CPU Usage"
              value={`${systemHealth.cpu.usage}%`}
              subtitle={`${systemHealth.cpu.cores} cores`}
              icon={CpuChipIcon}
              color={systemHealth.cpu.usage > 80 ? 'red' : systemHealth.cpu.usage > 60 ? 'yellow' : 'green'}
            />
            <MetricCard
              title="Memory Usage"
              value={`${systemHealth.memory.usage}%`}
              subtitle={`${systemHealth.memory.used / 1024} GB used`}
              icon={CpuChipIcon}
              color={systemHealth.memory.usage > 80 ? 'red' : systemHealth.memory.usage > 60 ? 'yellow' : 'green'}
            />
          </div>
        )}

        {/* Charts and Tables */}
        {shouldShowComponent('performanceData', permissions) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <UsageChart
              trends={trends}
              metric="users"
              title="Daily Active Users"
            />
            <UsageChart
              trends={trends}
              metric="sessions"
              title="Daily Sessions"
            />
          </div>
        )}

        {/* Tool Metrics */}
        {shouldShowComponent('detailedMetrics', permissions) && filteredToolMetrics.length > 0 && (
          <div className="mb-8">
            <ToolMetricsTable toolMetrics={filteredToolMetrics} />
          </div>
        )}

        {/* User Activity */}
        {shouldShowComponent('userActivity', permissions) && filteredUserActivities.length > 0 && (
          <div className="mb-8">
            <UserActivityTable userActivities={filteredUserActivities} />
          </div>
        )}

        {/* Insights */}
        {insights && insights.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BellIcon className="h-5 w-5 mr-2" />
              Analytics Insights
            </h3>
            <div className="space-y-4">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.severity === 'high' ? 'border-red-400 bg-red-50' :
                    insight.severity === 'medium' ? 'border-yellow-400 bg-yellow-50' :
                    'border-blue-400 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                      <p className="text-sm text-gray-700 mt-1">{insight.description}</p>
                      {insight.suggestedActions && insight.suggestedActions.length > 0 && (
                        <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                          {insight.suggestedActions.map((action, index) => (
                            <li key={index}>{action}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {Math.round(insight.confidence * 100)}% confident
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};