import React from 'react';
import { PerformanceMetrics, SystemHealthMetrics } from '../../types';
import {
  ClockIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CpuChipIcon,
  CircleStackIcon,
  WifiIcon,
  ServerIcon
} from '@heroicons/react/24/outline';

interface PerformanceMonitorProps {
  performance: PerformanceMetrics;
  systemHealth: SystemHealthMetrics;
}

interface PerformanceMetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  target?: number;
  icon: React.ComponentType<any>;
  description?: string;
  status: 'good' | 'warning' | 'critical';
}

const PerformanceMetricCard: React.FC<PerformanceMetricCardProps> = ({
  title,
  value,
  unit,
  target,
  icon: Icon,
  description,
  status
}) => {
  const statusColors = {
    good: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    critical: 'border-red-200 bg-red-50'
  };

  const statusIconColors = {
    good: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  };

  const StatusIcon = status === 'good' ? CheckCircleIcon : ExclamationTriangleIcon;

  return (
    <div className={`rounded-lg border p-6 shadow-sm ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Icon className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        </div>
        <StatusIcon className={`h-5 w-5 ${statusIconColors[status]}`} />
      </div>

      <div className="mb-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {unit && <span className="text-sm text-gray-600 ml-1">{unit}</span>}
      </div>

      {target && (
        <div className="mb-2">
          <span className="text-xs text-gray-500">Target: {target}{unit}</span>
        </div>
      )}

      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
    </div>
  );
};

interface SystemHealthCardProps {
  title: string;
  usage: number;
  total?: number;
  unit: string;
  icon: React.ComponentType<any>;
  details?: string[];
}

const SystemHealthCard: React.FC<SystemHealthCardProps> = ({
  title,
  usage,
  total,
  unit,
  icon: Icon,
  details
}) => {
  const getStatusColor = (usage: number) => {
    if (usage >= 90) return 'text-red-600 bg-red-100';
    if (usage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getProgressColor = (usage: number) => {
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Icon className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(usage)}`}>
          {usage}% {unit}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-600">Usage</span>
          <span className="text-sm font-medium text-gray-900">
            {usage}%{total && ` of ${total} ${unit}`}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(usage)}`}
            style={{ width: `${Math.min(usage, 100)}%` }}
          />
        </div>
      </div>

      {details && details.length > 0 && (
        <div className="space-y-1">
          {details.map((detail, index) => (
            <div key={index} className="text-xs text-gray-600">
              {detail}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface BottleneckItemProps {
  bottleneck: PerformanceMetrics['bottlenecks'][0];
}

const BottleneckItem: React.FC<BottleneckItemProps> = ({ bottleneck }) => {
  const severityColors = {
    low: 'border-blue-200 bg-blue-50 text-blue-800',
    medium: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    high: 'border-red-200 bg-red-50 text-red-800',
    critical: 'border-red-400 bg-red-100 text-red-900'
  };

  return (
    <div className={`rounded-lg border p-4 ${severityColors[bottleneck.severity]}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{bottleneck.component}</h4>
        <span className="text-xs font-medium uppercase tracking-wide">
          {bottleneck.severity}
        </span>
      </div>
      <p className="text-sm mb-2">{bottleneck.impact}</p>
      <p className="text-sm font-medium">💡 {bottleneck.suggestion}</p>
    </div>
  );
};

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  performance,
  systemHealth
}) => {
  const getPerformanceStatus = (value: number, target: number, isLower = true): 'good' | 'warning' | 'critical' => {
    const ratio = isLower ? value / target : target / value;
    if (ratio <= 1.1) return 'good';
    if (ratio <= 1.5) return 'warning';
    return 'critical';
  };

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <PerformanceMetricCard
            title="Page Load Time"
            value={performance.pageLoadTime}
            unit="seconds"
            target={2.0}
            icon={ClockIcon}
            description="Average time to load pages"
            status={getPerformanceStatus(performance.pageLoadTime, 2.0)}
          />
          <PerformanceMetricCard
            title="API Response Time"
            value={performance.apiResponseTime}
            unit="ms"
            target={200}
            icon={BoltIcon}
            description="Average API response time"
            status={getPerformanceStatus(performance.apiResponseTime, 200)}
          />
          <PerformanceMetricCard
            title="Render Time"
            value={performance.renderTime}
            unit="ms"
            target={100}
            icon={CpuChipIcon}
            description="Component render duration"
            status={getPerformanceStatus(performance.renderTime, 100)}
          />
          <PerformanceMetricCard
            title="Error Rate"
            value={performance.errorRate}
            unit="%"
            target={0.5}
            icon={ExclamationTriangleIcon}
            description="Application error rate"
            status={getPerformanceStatus(performance.errorRate, 0.5)}
          />
        </div>
      </div>

      {/* System Health */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SystemHealthCard
            title="CPU Usage"
            usage={systemHealth.cpu.usage}
            unit="CPU"
            icon={CpuChipIcon}
            details={[
              `${systemHealth.cpu.cores} cores available`,
              `Load: ${systemHealth.cpu.load.join(', ')}`
            ]}
          />
          <SystemHealthCard
            title="Memory Usage"
            usage={systemHealth.memory.usage}
            total={systemHealth.memory.total / 1024}
            unit="GB"
            icon={CircleStackIcon}
            details={[
              `${(systemHealth.memory.used / 1024).toFixed(1)} GB used`,
              `${(systemHealth.memory.free / 1024).toFixed(1)} GB free`
            ]}
          />
          <SystemHealthCard
            title="Storage Usage"
            usage={systemHealth.storage.usage}
            total={systemHealth.storage.total}
            unit="GB"
            icon={ServerIcon}
            details={[
              `${systemHealth.storage.used} GB used`,
              `${systemHealth.storage.free} GB free`
            ]}
          />
          <SystemHealthCard
            title="Network Health"
            usage={100 - systemHealth.network.errors}
            unit="uptime"
            icon={WifiIcon}
            details={[
              `${systemHealth.network.latency} ms latency`,
              `${systemHealth.network.throughput} Mbps throughput`,
              `${systemHealth.network.errors}% error rate`
            ]}
          />
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Experience */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Experience</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">User Satisfaction Score</span>
              <div className="flex items-center">
                <span className="text-lg font-semibold text-gray-900 mr-2">
                  {performance.userSatisfactionScore}/5
                </span>
                <div className="flex space-x-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        i < Math.floor(performance.userSatisfactionScore)
                          ? 'bg-yellow-400'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Crash Rate</span>
              <span className="text-lg font-semibold text-gray-900">
                {performance.crashRate}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">System Uptime</span>
              <span className="text-lg font-semibold text-green-600">
                {systemHealth.uptime}%
              </span>
            </div>
          </div>
        </div>

        {/* Database Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Connections</span>
              <span className="text-lg font-semibold text-gray-900">
                {systemHealth.database.connections}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Query Time</span>
              <span className="text-lg font-semibold text-gray-900">
                {systemHealth.database.queryTime} ms
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Error Rate</span>
              <span className={`text-lg font-semibold ${
                systemHealth.database.errorRate < 0.05 ? 'text-green-600' : 'text-red-600'
              }`}>
                {systemHealth.database.errorRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Bottlenecks */}
      {performance.bottlenecks && performance.bottlenecks.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Bottlenecks</h3>
          <div className="space-y-4">
            {performance.bottlenecks.map((bottleneck, index) => (
              <BottleneckItem key={index} bottleneck={bottleneck} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};