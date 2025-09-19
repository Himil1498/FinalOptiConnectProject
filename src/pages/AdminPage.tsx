import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAnalytics } from '../hooks/useAnalytics';
import NavigationBar from '../components/common/NavigationBar';
import { SystemConfigurationManager } from '../components/admin/SystemConfigurationManager';
import { AuditLogViewer } from '../components/admin/AuditLogViewer';
import { BulkOperationsManager } from '../components/admin/BulkOperationsManager';
import { SystemMaintenanceCenter } from '../components/admin/SystemMaintenanceCenter';
import {
  CogIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  UsersIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface AdminCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  onClick: () => void;
  badge?: string | number;
  disabled?: boolean;
}

const AdminCard: React.FC<AdminCardProps> = ({
  title,
  description,
  icon: Icon,
  color,
  onClick,
  badge,
  disabled = false
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-left w-full ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'
    }`}
  >
    <div className="flex items-start justify-between">
      <div className="flex items-start">
        <div className={`p-3 rounded-lg ${color} mr-4`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
      {badge && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          {badge}
        </span>
      )}
    </div>
  </button>
);

interface SystemStatusCardProps {
  title: string;
  status: 'healthy' | 'warning' | 'critical';
  value: string | number;
  description: string;
  icon: React.ComponentType<any>;
}

const SystemStatusCard: React.FC<SystemStatusCardProps> = ({
  title,
  status,
  value,
  description,
  icon: Icon
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'critical': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default: return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="p-2 bg-gray-100 rounded-lg mr-3">
            <Icon className="h-5 w-5 text-gray-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        </div>
        {getStatusIcon()}
      </div>

      <div className="mb-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {status}
        </div>
      </div>

      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
};

export const AdminPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { usageStats, systemHealth, trends } = useAnalytics();

  const [activeModal, setActiveModal] = useState<
    'config' | 'audit' | 'bulk' | 'maintenance' | null
  >(null);

  // Check if user has admin permissions
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <ShieldCheckIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You need administrator privileges to access this page.</p>
            <Link
              to="/dashboard"
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Mock system status data
  const systemStatus = {
    activeUsers: usageStats?.activeUsers || 89,
    totalSessions: usageStats?.totalSessions || 1247,
    systemUptime: 99.98,
    storageUsage: 85,
    pendingTasks: 3,
    recentAlerts: 1,
    lastBackup: '2 hours ago',
    securityScore: 85
  };

  const adminSections = [
    {
      title: 'System Configuration',
      description: 'Manage system settings, security policies, and application configuration',
      icon: CogIcon,
      color: 'bg-blue-600',
      onClick: () => setActiveModal('config')
    },
    {
      title: 'Audit Logs',
      description: 'View and analyze system audit logs, user activities, and security events',
      icon: DocumentTextIcon,
      color: 'bg-green-600',
      onClick: () => setActiveModal('audit'),
      badge: '1,247 entries'
    },
    {
      title: 'Bulk Operations',
      description: 'Import/export users and groups, manage bulk data operations',
      icon: ArrowUpTrayIcon,
      color: 'bg-purple-600',
      onClick: () => setActiveModal('bulk')
    },
    {
      title: 'System Maintenance',
      description: 'Automated tasks, backups, system health monitoring, and maintenance tools',
      icon: WrenchScrewdriverIcon,
      color: 'bg-orange-600',
      onClick: () => setActiveModal('maintenance'),
      badge: systemStatus.pendingTasks
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <NavigationBar />

        {/* Admin Header with Back Button */}
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
                <h1 className="text-xl font-bold text-gray-900">System Administration</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Overview Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">System Overview</h2>

            {/* System Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <SystemStatusCard
                title="Active Users"
                status="healthy"
                value={systemStatus.activeUsers}
                description="Currently online users"
                icon={UsersIcon}
              />
              <SystemStatusCard
                title="System Uptime"
                status="healthy"
                value={`${systemStatus.systemUptime}%`}
                description="Last 30 days availability"
                icon={ServerIcon}
              />
              <SystemStatusCard
                title="Storage Usage"
                status={systemStatus.storageUsage > 80 ? 'warning' : 'healthy'}
                value={`${systemStatus.storageUsage}%`}
                description="Disk space utilization"
                icon={ServerIcon}
              />
              <SystemStatusCard
                title="Security Score"
                status={systemStatus.securityScore < 70 ? 'critical' : systemStatus.securityScore < 85 ? 'warning' : 'healthy'}
                value={systemStatus.securityScore}
                description="Overall security rating"
                icon={ShieldCheckIcon}
              />
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{systemStatus.totalSessions}</div>
                  <div className="text-sm text-gray-600">Total Sessions Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{systemStatus.pendingTasks}</div>
                  <div className="text-sm text-gray-600">Pending Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{systemStatus.recentAlerts}</div>
                  <div className="text-sm text-gray-600">Recent Alerts</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-purple-600">{systemStatus.lastBackup}</div>
                  <div className="text-sm text-gray-600">Last Backup</div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Tools Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Administration Tools</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {adminSections.map((section) => (
                <AdminCard
                  key={section.title}
                  title={section.title}
                  description={section.description}
                  icon={section.icon}
                  color={section.color}
                  onClick={section.onClick}
                  badge={section.badge}
                />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Administrative Activity</h3>
            <div className="space-y-3">
              {[
                {
                  time: '2 minutes ago',
                  action: 'System configuration updated',
                  user: 'Admin User',
                  status: 'success'
                },
                {
                  time: '15 minutes ago',
                  action: 'User bulk import completed',
                  user: 'Admin User',
                  status: 'success'
                },
                {
                  time: '1 hour ago',
                  action: 'Daily backup completed',
                  user: 'System',
                  status: 'success'
                },
                {
                  time: '2 hours ago',
                  action: 'Security scan initiated',
                  user: 'Admin User',
                  status: 'running'
                },
                {
                  time: '4 hours ago',
                  action: 'Database cleanup completed',
                  user: 'System',
                  status: 'success'
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'running' ? 'bg-blue-500' :
                      'bg-yellow-500'
                    }`} />
                    <div>
                      <span className="text-sm font-medium text-gray-900">{activity.action}</span>
                      <span className="text-sm text-gray-500 ml-2">by {activity.user}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Components */}
      {activeModal === 'config' && (
        <SystemConfigurationManager
          isOpen={true}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'audit' && (
        <AuditLogViewer
          isOpen={true}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'bulk' && (
        <BulkOperationsManager
          isOpen={true}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'maintenance' && (
        <SystemMaintenanceCenter
          isOpen={true}
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  );
};