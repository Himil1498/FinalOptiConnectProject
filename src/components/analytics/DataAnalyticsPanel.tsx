import React from 'react';
import { DataCreationAnalytics } from '../../types';
import {
  DocumentPlusIcon,
  UserGroupIcon,
  MapIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';

interface DataAnalyticsPanelProps {
  dataAnalytics: DataCreationAnalytics;
}

interface DataBreakdownProps {
  title: string;
  data: Record<string, number>;
  icon: React.ComponentType<any>;
  colorScheme: string[];
}

const DataBreakdown: React.FC<DataBreakdownProps> = ({ title, data, icon: Icon, colorScheme }) => {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center mb-4">
        <Icon className="h-5 w-5 text-gray-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      <div className="space-y-3">
        {entries.map(([key, value], index) => {
          const percentage = total > 0 ? (value / total) * 100 : 0;
          const colorClass = colorScheme[index % colorScheme.length];

          return (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center flex-1">
                <div className={`w-3 h-3 rounded-full ${colorClass} mr-3`} />
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colorClass.replace('bg-', 'bg-')}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">{value}</span>
                <span className="text-xs text-gray-500 ml-1">({percentage.toFixed(1)}%)</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Total</span>
          <span className="text-lg font-semibold text-gray-900">{total}</span>
        </div>
      </div>
    </div>
  );
};

interface MetricItemProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value, unit, trend }) => (
  <div className="flex justify-between items-center py-2">
    <span className="text-sm text-gray-600">{label}</span>
    <div className="flex items-center">
      <span className="text-sm font-medium text-gray-900">
        {value}{unit && ` ${unit}`}
      </span>
      {trend && (
        <span className={`ml-2 text-xs ${
          trend.isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend.isPositive ? '+' : ''}{trend.value}%
        </span>
      )}
    </div>
  </div>
);

export const DataAnalyticsPanel: React.FC<DataAnalyticsPanelProps> = ({ dataAnalytics }) => {
  const typeColorScheme = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500'
  ];

  const userColorScheme = [
    'bg-indigo-500',
    'bg-cyan-500',
    'bg-emerald-500',
    'bg-orange-500',
    'bg-red-500'
  ];

  const regionColorScheme = [
    'bg-violet-500',
    'bg-teal-500',
    'bg-amber-500',
    'bg-rose-500'
  ];

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center mb-4">
          <DocumentPlusIcon className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Data Creation Overview</h3>
          <span className="ml-2 text-sm text-gray-500">({dataAnalytics.period})</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{dataAnalytics.totalCreated}</div>
            <div className="text-sm text-blue-700">Total Items Created</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{dataAnalytics.sharedItems}</div>
            <div className="text-sm text-green-700">Shared Items</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{dataAnalytics.publicItems}</div>
            <div className="text-sm text-yellow-700">Public Items</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{dataAnalytics.avgFileSize}</div>
            <div className="text-sm text-purple-700">Avg Size (KB)</div>
          </div>
        </div>

        <div className="mt-6 space-y-1">
          <MetricItem
            label="Storage Growth"
            value={dataAnalytics.storageGrowth}
            unit="%"
            trend={{ value: dataAnalytics.storageGrowth, isPositive: dataAnalytics.storageGrowth > 0 }}
          />
          <MetricItem
            label="Share Rate"
            value={((dataAnalytics.sharedItems / dataAnalytics.totalCreated) * 100).toFixed(1)}
            unit="%"
          />
          <MetricItem
            label="Public Rate"
            value={((dataAnalytics.publicItems / dataAnalytics.totalCreated) * 100).toFixed(1)}
            unit="%"
          />
        </div>
      </div>

      {/* Data Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DataBreakdown
          title="By Data Type"
          data={dataAnalytics.byType}
          icon={ChartPieIcon}
          colorScheme={typeColorScheme}
        />

        <DataBreakdown
          title="By User"
          data={dataAnalytics.byUser}
          icon={UserGroupIcon}
          colorScheme={userColorScheme}
        />

        <DataBreakdown
          title="By Region"
          data={dataAnalytics.byRegion}
          icon={MapIcon}
          colorScheme={regionColorScheme}
        />
      </div>

      {/* Data Creation Trends */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Creation Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Most Active Data Types</h4>
            <div className="space-y-2">
              {Object.entries(dataAnalytics.byType)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([type, count], index) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full ${typeColorScheme[index]} mr-2`} />
                      <span className="text-sm text-gray-700 capitalize">
                        {type.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count} items</span>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Top Contributors</h4>
            <div className="space-y-2">
              {Object.entries(dataAnalytics.byUser)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([user, count], index) => (
                  <div key={user} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full ${userColorScheme[index]} mr-2`} />
                      <span className="text-sm text-gray-700 capitalize">{user}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count} items</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};