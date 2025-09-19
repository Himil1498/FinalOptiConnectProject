import React, { useState, useCallback } from 'react';
import { SystemMaintenanceTask, BackupRecord, AdminSystemHealth } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import {
  WrenchScrewdriverIcon,
  CircleStackIcon,
  ShieldCheckIcon,
  ClockIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ChartBarIcon,
  ServerIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface SystemMaintenanceCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TaskCardProps {
  task: SystemMaintenanceTask;
  onRun: (id: string) => void;
  onSchedule: (id: string) => void;
  onCancel: (id: string) => void;
}

interface BackupCardProps {
  backup: BackupRecord;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onRun, onSchedule, onCancel }) => {
  const getStatusIcon = () => {
    switch (task.status) {
      case 'running':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'scheduled':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <StopIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeIcon = () => {
    switch (task.type) {
      case 'backup':
        return <CircleStackIcon className="h-6 w-6 text-blue-600" />;
      case 'cleanup':
        return <TrashIcon className="h-6 w-6 text-orange-600" />;
      case 'optimization':
        return <ChartBarIcon className="h-6 w-6 text-green-600" />;
      case 'health_check':
        return <ShieldCheckIcon className="h-6 w-6 text-purple-600" />;
      case 'security_scan':
        return <ShieldCheckIcon className="h-6 w-6 text-red-600" />;
      default:
        return <WrenchScrewdriverIcon className="h-6 w-6 text-gray-600" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-50 rounded-lg mr-4">
            {getTypeIcon()}
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{task.name}</h3>
            <p className="text-sm text-gray-600">{task.description}</p>
          </div>
        </div>
        <div className="flex items-center">
          {getStatusIcon()}
          <span className="ml-2 text-sm font-medium text-gray-700 capitalize">{task.status}</span>
        </div>
      </div>

      {/* Schedule Information */}
      {task.schedule && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-1">Schedule</h4>
          <p className="text-sm text-gray-600">
            {task.schedule.frequency === 'manual' ? 'Manual execution only' :
             `${task.schedule.frequency} at ${task.schedule.time || 'default time'}`}
          </p>
          {task.nextRun && (
            <p className="text-sm text-gray-500 mt-1">
              Next run: {new Date(task.nextRun).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Last Run Results */}
      {task.results && task.lastRun && (
        <div className={`mb-4 p-3 rounded-md ${
          task.results.success ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-gray-900">Last Run</h4>
            <span className={`text-xs font-medium ${
              task.results.success ? 'text-green-600' : 'text-red-600'
            }`}>
              {task.results.success ? 'Success' : 'Failed'}
            </span>
          </div>
          <p className="text-sm text-gray-600">{task.results.message}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(task.lastRun).toLocaleString()}
            {task.duration && ` • Duration: ${Math.round(task.duration / 1000)}s`}
          </p>
        </div>
      )}

      {/* Notifications */}
      <div className="mb-4 text-sm text-gray-600">
        <span>Notifications: </span>
        <span className="font-medium">
          {task.notifications.onSuccess ? 'Success' : ''}
          {task.notifications.onSuccess && task.notifications.onFailure ? ', ' : ''}
          {task.notifications.onFailure ? 'Failure' : ''}
          {!task.notifications.onSuccess && !task.notifications.onFailure ? 'Disabled' : ''}
        </span>
        {task.notifications.recipients.length > 0 && (
          <span className="ml-1">to {task.notifications.recipients.length} recipient(s)</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-2">
        {task.status === 'running' ? (
          <button
            onClick={() => onCancel(task.id)}
            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md border border-red-200"
          >
            Cancel
          </button>
        ) : (
          <>
            <button
              onClick={() => onRun(task.id)}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200"
            >
              Run Now
            </button>
            {task.schedule?.frequency === 'manual' && (
              <button
                onClick={() => onSchedule(task.id)}
                className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-md border border-green-200"
              >
                Schedule
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const BackupCard: React.FC<BackupCardProps> = ({ backup, onRestore, onDelete, onDownload }) => {
  const getScopeIcon = () => {
    switch (backup.scope) {
      case 'full_system':
        return <ServerIcon className="h-5 w-5 text-purple-600" />;
      case 'users':
        return <ShieldCheckIcon className="h-5 w-5 text-blue-600" />;
      case 'data':
        return <CircleStackIcon className="h-5 w-5 text-green-600" />;
      case 'configurations':
        return <WrenchScrewdriverIcon className="h-5 w-5 text-orange-600" />;
      default:
        return <CircleStackIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (backup.status) {
      case 'available':
        return 'text-green-600 bg-green-50';
      case 'creating':
        return 'text-blue-600 bg-blue-50';
      case 'restoring':
        return 'text-yellow-600 bg-yellow-50';
      case 'expired':
        return 'text-gray-600 bg-gray-50';
      case 'corrupted':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-gray-50 rounded-lg mr-3">
            {getScopeIcon()}
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{backup.name}</h3>
            {backup.description && (
              <p className="text-sm text-gray-600">{backup.description}</p>
            )}
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {backup.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500">Type:</span>
          <span className="ml-1 font-medium">{backup.type}</span>
        </div>
        <div>
          <span className="text-gray-500">Scope:</span>
          <span className="ml-1 font-medium">{backup.scope.replace('_', ' ')}</span>
        </div>
        <div>
          <span className="text-gray-500">Size:</span>
          <span className="ml-1 font-medium">{formatSize(backup.size)}</span>
        </div>
        <div>
          <span className="text-gray-500">Created:</span>
          <span className="ml-1 font-medium">{new Date(backup.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Metadata */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Backup Details</h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>Version: {backup.metadata.version}</div>
          <div>Encrypted: {backup.isEncrypted ? 'Yes' : 'No'}</div>
          {backup.metadata.userCount && <div>Users: {backup.metadata.userCount}</div>}
          {backup.metadata.dataItemCount && <div>Data Items: {backup.metadata.dataItemCount}</div>}
          {backup.metadata.configCount && <div>Configs: {backup.metadata.configCount}</div>}
          <div>Compressed: {formatSize(backup.metadata.compressedSize)}</div>
        </div>
      </div>

      {/* Retention */}
      <div className="mb-4 text-sm">
        <span className="text-gray-500">Expires:</span>
        <span className="ml-1 font-medium">
          {new Date(backup.retention.expiresAt).toLocaleDateString()}
        </span>
        {backup.retention.autoDelete && (
          <span className="ml-2 text-yellow-600">(auto-delete enabled)</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-2">
        {backup.status === 'available' && (
          <>
            <button
              onClick={() => onDownload(backup.id)}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200"
            >
              Download
            </button>
            <button
              onClick={() => onRestore(backup.id)}
              className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-md border border-green-200"
            >
              Restore
            </button>
          </>
        )}
        <button
          onClick={() => onDelete(backup.id)}
          disabled={backup.status === 'creating' || backup.status === 'restoring'}
          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md border border-red-200 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export const SystemMaintenanceCenter: React.FC<SystemMaintenanceCenterProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { addNotification } = useTheme();
  const [activeTab, setActiveTab] = useState<'tasks' | 'backups' | 'health'>('tasks');

  // Mock data
  const [maintenanceTasks, setMaintenanceTasks] = useState<SystemMaintenanceTask[]>([
    {
      id: 'task-1',
      name: 'Daily System Backup',
      description: 'Create a full system backup including users, data, and configurations',
      type: 'backup',
      schedule: {
        frequency: 'daily',
        time: '02:00'
      },
      status: 'scheduled',
      lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      nextRun: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      duration: 120000,
      results: {
        success: true,
        message: 'Backup completed successfully. 1.2GB backup created.',
        details: { size: '1.2GB', duration: '2m 15s' }
      },
      notifications: {
        onSuccess: true,
        onFailure: true,
        recipients: ['admin@company.com']
      },
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 300
      }
    },
    {
      id: 'task-2',
      name: 'Database Cleanup',
      description: 'Remove expired sessions, temporary files, and optimize database',
      type: 'cleanup',
      schedule: {
        frequency: 'weekly',
        time: '03:00',
        dayOfWeek: 0
      },
      status: 'completed',
      lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      nextRun: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 45000,
      results: {
        success: true,
        message: 'Cleanup completed. Freed 500MB of storage.',
        details: { freedSpace: '500MB', sessionsRemoved: 1245 }
      },
      notifications: {
        onSuccess: false,
        onFailure: true,
        recipients: ['admin@company.com']
      },
      retryPolicy: {
        maxRetries: 2,
        retryDelay: 600
      }
    },
    {
      id: 'task-3',
      name: 'Security Vulnerability Scan',
      description: 'Scan system for security vulnerabilities and generate report',
      type: 'security_scan',
      schedule: {
        frequency: 'manual'
      },
      status: 'failed',
      lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 180000,
      results: {
        success: false,
        message: 'Scan failed due to network timeout. Please retry.',
        details: { error: 'Network timeout after 3 minutes' }
      },
      notifications: {
        onSuccess: true,
        onFailure: true,
        recipients: ['security@company.com', 'admin@company.com']
      },
      retryPolicy: {
        maxRetries: 1,
        retryDelay: 900
      }
    }
  ]);

  const [backupRecords, setBackupRecords] = useState<BackupRecord[]>([
    {
      id: 'backup-1',
      name: 'Full System Backup - Daily',
      description: 'Automated daily backup of the entire system',
      type: 'full',
      scope: 'full_system',
      size: 1287654321,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'system',
      location: '/backups/2024/01/daily_backup_20240115.tar.gz',
      checksum: 'sha256:abc123def456...',
      isEncrypted: true,
      retention: {
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        autoDelete: true
      },
      status: 'available',
      metadata: {
        version: '1.0.0',
        userCount: 156,
        dataItemCount: 3421,
        configCount: 45,
        compressedSize: 423456789
      }
    },
    {
      id: 'backup-2',
      name: 'User Data Export',
      description: 'Backup of user accounts and profiles only',
      type: 'incremental',
      scope: 'users',
      size: 45678901,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: user?.id || 'admin',
      location: '/backups/2024/01/users_backup_20240112.json',
      checksum: 'sha256:def456ghi789...',
      isEncrypted: false,
      retention: {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        autoDelete: false
      },
      status: 'available',
      metadata: {
        version: '1.0.0',
        userCount: 156,
        compressedSize: 12345678
      }
    }
  ]);

  const [systemHealth] = useState<AdminSystemHealth>({
    timestamp: new Date().toISOString(),
    overall: 'healthy',
    components: [
      {
        name: 'Database',
        status: 'healthy',
        message: 'All connections stable',
        lastCheck: new Date().toISOString()
      },
      {
        name: 'Authentication Service',
        status: 'healthy',
        message: 'OAuth and local auth working',
        lastCheck: new Date().toISOString()
      },
      {
        name: 'File Storage',
        status: 'warning',
        message: '85% capacity reached',
        lastCheck: new Date().toISOString()
      },
      {
        name: 'Email Service',
        status: 'healthy',
        message: 'SMTP server responsive',
        lastCheck: new Date().toISOString()
      }
    ],
    performance: {
      responseTime: 245,
      throughput: 850,
      errorRate: 0.02,
      uptime: 99.98
    },
    resources: {
      cpu: 45,
      memory: 68,
      storage: 85,
      network: 25
    },
    security: {
      lastSecurityScan: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      vulnerabilities: 2,
      securityScore: 85
    },
    alerts: [
      {
        id: 'alert-1',
        severity: 'warning',
        message: 'Storage capacity approaching limit (85% used)',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        acknowledged: false
      }
    ]
  });

  const handleRunTask = useCallback((taskId: string) => {
    setMaintenanceTasks(prev => prev.map(task =>
      task.id === taskId
        ? { ...task, status: 'running' }
        : task
    ));

    addNotification({
      type: 'info',
      message: 'Maintenance task started',
      duration: 3000
    });

    // Simulate task completion
    setTimeout(() => {
      setMaintenanceTasks(prev => prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: 'completed',
              lastRun: new Date().toISOString(),
              duration: Math.random() * 180000 + 30000,
              results: {
                success: Math.random() > 0.2,
                message: 'Task completed successfully',
                details: {}
              }
            }
          : task
      ));

      addNotification({
        type: 'success',
        message: 'Maintenance task completed',
        duration: 3000
      });
    }, 5000);
  }, [addNotification]);

  const handleCreateBackup = useCallback(() => {
    const newBackup: BackupRecord = {
      id: `backup-${Date.now()}`,
      name: `Manual Backup - ${new Date().toLocaleDateString()}`,
      description: 'Manual backup created by administrator',
      type: 'full',
      scope: 'full_system',
      size: Math.random() * 1000000000 + 500000000,
      createdAt: new Date().toISOString(),
      createdBy: user?.id || 'admin',
      location: `/backups/manual/backup_${Date.now()}.tar.gz`,
      checksum: `sha256:${Math.random().toString(36)}...`,
      isEncrypted: true,
      retention: {
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        autoDelete: false
      },
      status: 'creating',
      metadata: {
        version: '1.0.0',
        userCount: 156,
        dataItemCount: 3421,
        configCount: 45,
        compressedSize: Math.random() * 500000000 + 100000000
      }
    };

    setBackupRecords(prev => [newBackup, ...prev]);

    addNotification({
      type: 'info',
      message: 'Creating system backup...',
      duration: 3000
    });

    // Simulate backup creation
    setTimeout(() => {
      setBackupRecords(prev => prev.map(backup =>
        backup.id === newBackup.id
          ? { ...backup, status: 'available' }
          : backup
      ));

      addNotification({
        type: 'success',
        message: 'System backup created successfully',
        duration: 3000
      });
    }, 8000);
  }, [user?.id, addNotification]);

  const handleRestoreBackup = useCallback((backupId: string) => {
    setBackupRecords(prev => prev.map(backup =>
      backup.id === backupId
        ? { ...backup, status: 'restoring' }
        : backup
    ));

    addNotification({
      type: 'warning',
      message: 'System restore in progress. Please do not interrupt.',
      duration: 5000
    });
  }, [addNotification]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <WrenchScrewdriverIcon className="h-6 w-6 text-gray-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">System Maintenance Center</h2>
            </div>
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
            {[
              { id: 'tasks', label: 'Maintenance Tasks', count: maintenanceTasks.length },
              { id: 'backups', label: 'Backups', count: backupRecords.length },
              { id: 'health', label: 'System Health', count: systemHealth.alerts.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Maintenance Tasks</h3>
                <button
                  onClick={handleCreateBackup}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                  Create Manual Backup
                </button>
              </div>

              {maintenanceTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onRun={handleRunTask}
                  onSchedule={() => {}}
                  onCancel={() => {}}
                />
              ))}
            </div>
          )}

          {activeTab === 'backups' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">System Backups</h3>
                <button
                  onClick={handleCreateBackup}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                  Create Backup
                </button>
              </div>

              {backupRecords.map((backup) => (
                <BackupCard
                  key={backup.id}
                  backup={backup}
                  onRestore={handleRestoreBackup}
                  onDelete={() => {}}
                  onDownload={() => {}}
                />
              ))}
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">System Health Overview</h3>

              {/* Overall Status */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Overall System Status</h4>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      systemHealth.overall === 'healthy' ? 'bg-green-500' :
                      systemHealth.overall === 'warning' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium capitalize">{systemHealth.overall}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{systemHealth.performance.uptime}%</div>
                    <div className="text-sm text-gray-600">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{systemHealth.performance.responseTime}ms</div>
                    <div className="text-sm text-gray-600">Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{systemHealth.performance.throughput}</div>
                    <div className="text-sm text-gray-600">Throughput/min</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{systemHealth.performance.errorRate}%</div>
                    <div className="text-sm text-gray-600">Error Rate</div>
                  </div>
                </div>
              </div>

              {/* Component Status */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Component Status</h4>
                <div className="space-y-3">
                  {systemHealth.components.map((component) => (
                    <div key={component.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          component.status === 'healthy' ? 'bg-green-500' :
                          component.status === 'warning' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`} />
                        <div>
                          <span className="font-medium text-gray-900">{component.name}</span>
                          {component.message && (
                            <p className="text-sm text-gray-600">{component.message}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(component.lastCheck).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resource Usage */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Resource Usage</h4>
                <div className="space-y-4">
                  {Object.entries(systemHealth.resources).map(([resource, usage]) => (
                    <div key={resource}>
                      <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                        <span className="capitalize">{resource}</span>
                        <span>{usage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            usage > 90 ? 'bg-red-500' :
                            usage > 75 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${usage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerts */}
              {systemHealth.alerts.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Active Alerts</h4>
                  <div className="space-y-3">
                    {systemHealth.alerts.map((alert) => (
                      <div key={alert.id} className={`p-3 rounded-md border-l-4 ${
                        alert.severity === 'critical' ? 'border-red-400 bg-red-50' :
                        alert.severity === 'warning' ? 'border-yellow-400 bg-yellow-50' :
                        'border-blue-400 bg-blue-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                          <span className="text-xs text-gray-500">
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};