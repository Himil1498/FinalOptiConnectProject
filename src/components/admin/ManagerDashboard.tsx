import React, { useState, useCallback, useMemo } from 'react';
import {
  User,
  UserGroup,
  UserStats,
  ActivityStats,
  SystemPerformanceMetrics,
  UserFilter,
  BulkUserAction,
  UserActivityLog,
  PERMISSION_CATEGORIES
} from '../../types';

interface ManagerDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  isOpen,
  onClose,
  currentUserId,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'groups' | 'analytics' | 'performance'>('overview');
  const [userFilter, setUserFilter] = useState<UserFilter>({});
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showPermissionMatrix, setShowPermissionMatrix] = useState(false);

  // Mock data - in real app this would come from API
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@opticonnect.com',
      name: 'Admin User',
      role: 'admin',
      permissions: ['all'],
      assignedStates: [],
      department: 'IT',
      phoneNumber: '+91-98765-43210',
      avatar: '',
      lastLogin: '2024-01-15T10:30:00Z',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      email: 'manager@opticonnect.com',
      name: 'Regional Manager',
      role: 'manager',
      permissions: ['read', 'write', 'manage_users', 'view_analytics'],
      assignedStates: ['Maharashtra', 'Gujarat'],
      department: 'Operations',
      phoneNumber: '+91-98765-43211',
      avatar: '',
      lastLogin: '2024-01-15T09:15:00Z',
      isActive: true,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-15T09:15:00Z'
    },
    {
      id: '3',
      email: 'tech@opticonnect.com',
      name: 'Field Technician',
      role: 'technician',
      permissions: ['read', 'write', 'manage_equipment'],
      assignedStates: ['Maharashtra'],
      department: 'Engineering',
      phoneNumber: '+91-98765-43212',
      avatar: '',
      lastLogin: '2024-01-15T08:45:00Z',
      isActive: true,
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-15T08:45:00Z'
    },
    {
      id: '4',
      email: 'viewer@opticonnect.com',
      name: 'Data Analyst',
      role: 'viewer',
      permissions: ['read', 'view_basic_analytics'],
      assignedStates: ['Gujarat', 'Rajasthan'],
      department: 'Analytics',
      phoneNumber: '+91-98765-43213',
      avatar: '',
      lastLogin: '2024-01-14T16:20:00Z',
      isActive: false,
      createdAt: '2024-01-04T00:00:00Z',
      updatedAt: '2024-01-14T16:20:00Z'
    }
  ];

  const mockGroups: UserGroup[] = [
    {
      id: 'org-1',
      name: 'Organization',
      description: 'Root organization group',
      level: 0,
      path: [],
      permissions: [],
      assignedStates: [],
      color: '#3B82F6',
      isActive: true,
      memberCount: 15,
      childGroups: ['eng-1', 'ops-1'],
      createdBy: '1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'eng-1',
      name: 'Engineering',
      description: 'Engineering department',
      parentId: 'org-1',
      level: 1,
      path: ['org-1'],
      permissions: ['map_view', 'map_edit', 'distance_measurement'],
      assignedStates: ['Maharashtra', 'Gujarat'],
      color: '#10B981',
      isActive: true,
      memberCount: 8,
      childGroups: ['gis-1'],
      createdBy: '1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ];

  const mockStats: UserStats = {
    totalUsers: 42,
    activeUsers: 38,
    newUsersThisMonth: 5,
    usersPerRole: {
      admin: 2,
      manager: 8,
      technician: 22,
      viewer: 10
    },
    usersPerGroup: {
      'Engineering': 15,
      'Operations': 12,
      'Analytics': 8,
      'Support': 7
    },
    usersPerState: {
      'Maharashtra': 18,
      'Gujarat': 12,
      'Rajasthan': 8,
      'Karnataka': 4
    }
  };

  const mockActivityStats: ActivityStats = {
    totalSessions: 1247,
    averageSessionDuration: 45.5,
    mostUsedFeatures: [
      { feature: 'Map Viewing', usage: 892, percentage: 71.5 },
      { feature: 'Distance Measurement', usage: 456, percentage: 36.6 },
      { feature: 'Region Assignment', usage: 234, percentage: 18.8 },
      { feature: 'Polygon Drawing', usage: 189, percentage: 15.2 }
    ],
    peakUsageHours: [
      { hour: 9, usage: 156 },
      { hour: 10, usage: 189 },
      { hour: 11, usage: 203 },
      { hour: 14, usage: 167 },
      { hour: 15, usage: 145 }
    ]
  };

  const mockPerformanceMetrics: SystemPerformanceMetrics = {
    systemUptime: 99.8,
    averageResponseTime: 245,
    errorRate: 0.02,
    memoryUsage: 68.5,
    cpuUsage: 23.4,
    activeConnections: 38
  };

  const mockActivityLog: UserActivityLog[] = [
    {
      id: 'log-1',
      userId: '2',
      action: 'Map View',
      resource: 'Maharashtra Region',
      timestamp: '2024-01-15T10:30:00Z',
      duration: 15,
      location: { lat: 19.0760, lng: 72.8777 }
    },
    {
      id: 'log-2',
      userId: '3',
      action: 'Distance Measurement',
      resource: 'Network Route Analysis',
      timestamp: '2024-01-15T10:15:00Z',
      duration: 8,
      location: { lat: 18.5204, lng: 73.8567 }
    }
  ];

  // Filter users based on current filter
  const filteredUsers = useMemo(() => {
    return mockUsers.filter(user => {
      if (userFilter.role && !userFilter.role.includes(user.role)) return false;
      if (userFilter.status && !userFilter.status.includes(user.isActive ? 'active' : 'inactive')) return false;
      if (userFilter.states && userFilter.states.length > 0) {
        const userStates = user.assignedStates || [];
        if (!userFilter.states.some(state => userStates.includes(state))) return false;
      }
      if (userFilter.searchTerm) {
        const term = userFilter.searchTerm.toLowerCase();
        if (!user.name.toLowerCase().includes(term) &&
            !user.email.toLowerCase().includes(term) &&
            !user.department?.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [userFilter]);

  const handleBulkAction = useCallback((action: BulkUserAction) => {
    console.log('Bulk action:', action);
    setSelectedUsers([]);
    setShowBulkActions(false);
  }, []);

  const handleUserSelect = useCallback((userId: string, selected: boolean) => {
    if (selected) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = filteredUsers.map(user => user.id);
    setSelectedUsers(allIds);
  }, [filteredUsers]);

  const handleDeselectAll = useCallback(() => {
    setSelectedUsers([]);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute inset-4 bg-white rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manager Dashboard</h2>
            <p className="text-sm text-gray-600 mt-1">
              Comprehensive user and system management overview
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'users', label: 'Users', icon: '👥' },
            { id: 'groups', label: 'Groups', icon: '🏢' },
            { id: 'analytics', label: 'Analytics', icon: '📈' },
            { id: 'performance', label: 'Performance', icon: '⚡' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Users</p>
                      <p className="text-3xl font-bold">{mockStats.totalUsers}</p>
                    </div>
                    <span className="text-4xl opacity-80">👥</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Active Users</p>
                      <p className="text-3xl font-bold">{mockStats.activeUsers}</p>
                    </div>
                    <span className="text-4xl opacity-80">🟢</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">New This Month</p>
                      <p className="text-3xl font-bold">{mockStats.newUsersThisMonth}</p>
                    </div>
                    <span className="text-4xl opacity-80">📈</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">System Uptime</p>
                      <p className="text-3xl font-bold">{mockPerformanceMetrics.systemUptime}%</p>
                    </div>
                    <span className="text-4xl opacity-80">⚡</span>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Users by Role */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Role</h3>
                  <div className="space-y-3">
                    {Object.entries(mockStats.usersPerRole).map(([role, count]) => (
                      <div key={role} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">{role}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${(count / mockStats.totalUsers) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {mockActivityLog.slice(0, 5).map(activity => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            {mockUsers.find(u => u.id === activity.userId)?.name} performed {activity.action}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Filters and Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userFilter.searchTerm || ''}
                      onChange={(e) => setUserFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                  </div>

                  {/* Role Filter */}
                  <select
                    value={userFilter.role?.[0] || ''}
                    onChange={(e) => setUserFilter(prev => ({
                      ...prev,
                      role: e.target.value ? [e.target.value as User['role']] : undefined
                    }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="technician">Technician</option>
                    <option value="viewer">Viewer</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={userFilter.status?.[0] || ''}
                    onChange={(e) => setUserFilter(prev => ({
                      ...prev,
                      status: e.target.value ? [e.target.value as 'active' | 'inactive'] : undefined
                    }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {selectedUsers.length > 0 && (
                    <button
                      onClick={() => setShowBulkActions(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Bulk Actions ({selectedUsers.length})
                    </button>
                  )}

                  <button
                    onClick={() => setShowPermissionMatrix(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Permission Matrix
                  </button>
                </div>
              </div>

              {/* User Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Users ({filteredUsers.length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSelectAll}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Select All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={handleDeselectAll}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input type="checkbox" className="rounded" />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assigned States
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={(e) => handleUserSelect(user.id, e.target.checked)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {user.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-red-100 text-red-800' :
                              user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                              user.role === 'technician' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.department || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="max-w-32 truncate">
                              {user.assignedStates?.join(', ') || 'All'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                            <button className="text-red-600 hover:text-red-900">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Groups Tab */}
          {activeTab === 'groups' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Groups Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockGroups.map(group => (
                    <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{group.name}</h4>
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Members:</span>
                          <span className="font-medium">{group.memberCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Level:</span>
                          <span className="font-medium">{group.level}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Permissions:</span>
                          <span className="font-medium">{group.permissions.length}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Feature Usage */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Used Features</h3>
                <div className="space-y-3">
                  {mockActivityStats.mostUsedFeatures.map(feature => (
                    <div key={feature.feature} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{feature.feature}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${feature.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12">{feature.usage}</span>
                        <span className="text-xs text-gray-500 w-12">{feature.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Total Sessions</h4>
                  <p className="text-3xl font-bold text-gray-900">{mockActivityStats.totalSessions}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Avg Session Duration</h4>
                  <p className="text-3xl font-bold text-gray-900">{mockActivityStats.averageSessionDuration}m</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Peak Hour</h4>
                  <p className="text-3xl font-bold text-gray-900">
                    {Math.max(...mockActivityStats.peakUsageHours.map(h => h.usage))} users
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">System Uptime</h4>
                  <p className="text-3xl font-bold text-green-600">{mockPerformanceMetrics.systemUptime}%</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Avg Response Time</h4>
                  <p className="text-3xl font-bold text-blue-600">{mockPerformanceMetrics.averageResponseTime}ms</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Error Rate</h4>
                  <p className="text-3xl font-bold text-red-600">{mockPerformanceMetrics.errorRate}%</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Memory Usage</h4>
                  <p className="text-3xl font-bold text-yellow-600">{mockPerformanceMetrics.memoryUsage}%</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">CPU Usage</h4>
                  <p className="text-3xl font-bold text-purple-600">{mockPerformanceMetrics.cpuUsage}%</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Active Connections</h4>
                  <p className="text-3xl font-bold text-indigo-600">{mockPerformanceMetrics.activeConnections}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions Modal */}
        {showBulkActions && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bulk Actions ({selectedUsers.length} users)
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleBulkAction({ type: 'activate', userIds: selectedUsers })}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  Activate Users
                </button>
                <button
                  onClick={() => handleBulkAction({ type: 'deactivate', userIds: selectedUsers })}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  Deactivate Users
                </button>
                <button
                  onClick={() => handleBulkAction({ type: 'assign_group', userIds: selectedUsers })}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  Assign to Group
                </button>
                <button
                  onClick={() => handleBulkAction({ type: 'assign_states', userIds: selectedUsers })}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  Assign States
                </button>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowBulkActions(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Permission Matrix Modal */}
        {showPermissionMatrix && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Permission Matrix</h3>
                <button
                  onClick={() => setShowPermissionMatrix(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2 border-b">Permission</th>
                      <th className="text-center p-2 border-b">Admin</th>
                      <th className="text-center p-2 border-b">Manager</th>
                      <th className="text-center p-2 border-b">Technician</th>
                      <th className="text-center p-2 border-b">Viewer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(PERMISSION_CATEGORIES).map(([category, data]) =>
                      data.permissions.map(permission => (
                        <tr key={permission} className="hover:bg-gray-50">
                          <td className="p-2 border-b">{permission.replace('_', ' ')}</td>
                          <td className="text-center p-2 border-b">
                            <span className="text-green-600">✓</span>
                          </td>
                          <td className="text-center p-2 border-b">
                            <span className="text-green-600">✓</span>
                          </td>
                          <td className="text-center p-2 border-b">
                            <span className="text-gray-400">-</span>
                          </td>
                          <td className="text-center p-2 border-b">
                            <span className="text-gray-400">-</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;