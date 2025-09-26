import React, { useState, useEffect } from 'react';
import { User } from '../../types';

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress: string;
  location?: string;
  details?: string;
  status: 'success' | 'warning' | 'error';
}

interface UserActivityMonitorProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACTIVITY_TYPES = [
  { value: 'all', label: 'All Activities', color: 'bg-gray-100 text-gray-800' },
  { value: 'login', label: 'User Logins', color: 'bg-green-100 text-green-800' },
  { value: 'logout', label: 'User Logouts', color: 'bg-blue-100 text-blue-800' },
  { value: 'create', label: 'Data Creation', color: 'bg-purple-100 text-purple-800' },
  { value: 'edit', label: 'Data Modification', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'delete', label: 'Data Deletion', color: 'bg-red-100 text-red-800' },
  { value: 'export', label: 'Data Export', color: 'bg-indigo-100 text-indigo-800' },
];

const STATUS_COLORS = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
};

export const UserActivityMonitor: React.FC<UserActivityMonitorProps> = ({
  isOpen,
  onClose,
}) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedActivityType, setSelectedActivityType] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');

  // Dynamic activity data - this would normally come from your backend
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Simulate fetching from API
      const fetchActivities = async () => {
        // In a real app, this would be: const response = await fetch('/api/activities');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

        const currentTime = new Date();
        const mockActivities: ActivityLog[] = [
          {
            id: '1',
            userId: 'user1',
            userName: 'John Doe',
            userRole: 'technician',
            action: 'login',
            resource: 'System',
            timestamp: new Date(currentTime.getTime() - Math.random() * 2 * 60 * 60 * 1000), // Random time within last 2 hours
            ipAddress: '192.168.1.100',
            location: 'Mumbai Office',
            details: 'Successful login via web browser',
            status: 'success',
          },
          {
            id: '2',
            userId: 'user2',
            userName: 'Jane Smith',
            userRole: 'manager',
            action: 'create',
            resource: 'Tower Data',
            timestamp: new Date(currentTime.getTime() - Math.random() * 3 * 60 * 60 * 1000), // Random within last 3 hours
            ipAddress: '192.168.1.101',
            location: 'Delhi Head Office',
            details: 'Created new tower record: TW-DEL-001',
            status: 'success',
          },
          {
            id: '3',
            userId: 'user1',
            userName: 'John Doe',
            userRole: 'technician',
            action: 'edit',
            resource: 'Infrastructure',
            timestamp: new Date(Date.now() - 60 * 60 * 1000),
            ipAddress: '192.168.1.100',
            location: 'Mumbai Office',
            details: 'Modified equipment status for site MUM-001',
            status: 'success',
          },
          {
            id: '4',
            userId: 'user3',
            userName: 'Admin User',
            userRole: 'admin',
            action: 'export',
            resource: 'User Data',
            timestamp: new Date(Date.now() - 90 * 60 * 1000),
            ipAddress: '192.168.1.102',
            location: 'Head Office',
            details: 'Exported user list to CSV',
            status: 'success',
          },
          {
            id: '5',
            userId: 'user4',
            userName: 'Bob Wilson',
            userRole: 'viewer',
            action: 'login',
            resource: 'System',
            timestamp: new Date(Date.now() - 120 * 60 * 1000),
            ipAddress: '192.168.1.103',
            location: 'Chennai Office',
            details: 'Failed login attempt - invalid password',
            status: 'error',
          },
          // Add more dynamic activities based on current time
          ...Array.from({ length: Math.floor(Math.random() * 10) + 5 }, (_, i) => ({
            id: `dynamic-${i}`,
            userId: `user${Math.floor(Math.random() * 5) + 1}`,
            userName: ['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Johnson', 'Mike Chen'][Math.floor(Math.random() * 5)],
            userRole: ['admin', 'manager', 'technician', 'viewer'][Math.floor(Math.random() * 4)] as 'admin' | 'manager' | 'technician' | 'viewer',
            action: ['login', 'logout', 'create', 'edit', 'delete', 'export'][Math.floor(Math.random() * 6)],
            resource: ['System', 'Tower Data', 'User Data', 'Infrastructure', 'Reports'][Math.floor(Math.random() * 5)],
            timestamp: new Date(currentTime.getTime() - Math.random() * 24 * 60 * 60 * 1000), // Random within last 24 hours
            ipAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
            location: ['Mumbai Office', 'Delhi Head Office', 'Bangalore Tech Center', 'Chennai Operations'][Math.floor(Math.random() * 4)],
            details: `Auto-generated activity ${i + 1}`,
            status: Math.random() > 0.1 ? 'success' : (Math.random() > 0.5 ? 'warning' : 'error') as 'success' | 'warning' | 'error',
          }))
        ];

        // Sort by timestamp descending (most recent first)
        mockActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        setActivities(mockActivities);
        setLoading(false);
      };

      fetchActivities();
    }
  }, [isOpen]);

  const filteredActivities = activities.filter(activity => {
    const matchesType = selectedActivityType === 'all' || activity.action === selectedActivityType;
    const matchesUser = selectedUser === 'all' || activity.userId === selectedUser;
    const matchesSearch = searchTerm === '' ||
      activity.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.resource.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesUser && matchesSearch;
  });

  // Calculate dynamic stats
  const activeUsers = new Set(activities.filter(a =>
    a.timestamp.getTime() > Date.now() - 60 * 60 * 1000 // Last hour
  ).map(a => a.userId)).size;

  const totalActions = activities.length;
  const warnings = activities.filter(a => a.status === 'warning').length;
  const failedLogins = activities.filter(a => a.action === 'login' && a.status === 'error').length;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login': return '🔐';
      case 'logout': return '🚪';
      case 'create': return '➕';
      case 'edit': return '✏️';
      case 'delete': return '🗑️';
      case 'export': return '📤';
      default: return '📋';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">User Activity Monitor</h2>
                <p className="text-blue-100 text-sm">Real-time user activity tracking and audit logs</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-lg">👤</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-xl font-bold text-green-600">{activeUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-lg">📊</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Actions</p>
                  <p className="text-xl font-bold text-blue-600">{totalActions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <span className="text-lg">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Warnings</p>
                  <p className="text-xl font-bold text-yellow-600">{warnings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-red-200">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-lg">🚨</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Failed Logins</p>
                  <p className="text-xl font-bold text-red-600">{failedLogins}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
              <select
                value={selectedActivityType}
                onChange={(e) => setSelectedActivityType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {ACTIVITY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User Filter</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Users</option>
                <option value="user1">John Doe</option>
                <option value="user2">Jane Smith</option>
                <option value="user3">Admin User</option>
                <option value="user4">Bob Wilson</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search activities..."
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity List */}
        <div className="overflow-y-auto max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading activities...</span>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-2">📊</div>
              <p className="text-gray-500">No activities found matching your criteria</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${STATUS_COLORS[activity.status]}`}>
                        <span className="text-lg">{getActionIcon(activity.action)}</span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">{activity.userName}</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            activity.userRole === 'admin' ? 'bg-red-100 text-red-800' :
                            activity.userRole === 'manager' ? 'bg-blue-100 text-blue-800' :
                            activity.userRole === 'technician' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.userRole}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{formatTimeAgo(activity.timestamp)}</span>
                          <span>•</span>
                          <span>{activity.ipAddress}</span>
                        </div>
                      </div>

                      <div className="mt-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium capitalize">{activity.action}</span> action on{' '}
                          <span className="font-medium">{activity.resource}</span>
                          {activity.location && (
                            <span className="text-gray-500"> from {activity.location}</span>
                          )}
                        </p>
                        {activity.details && (
                          <p className="text-xs text-gray-500 mt-1">{activity.details}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[activity.status]}`}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {filteredActivities.length} of {activities.length} activities
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">
              Export CSV
            </button>
            <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserActivityMonitor;