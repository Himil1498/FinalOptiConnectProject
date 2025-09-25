import React, { useState, useEffect, useMemo } from 'react';
import { useUserManagement } from '../../hooks/useUserManagement';
import AdminUserCreationForm from './AdminUserCreationForm';
import BulkUserImport from './BulkUserImport';
import UserActivityMonitor from './UserActivityMonitor';
import { User } from '../../types';

interface UsersListDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-800',
  manager: 'bg-blue-100 text-blue-800',
  technician: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800',
};

const ROLE_ICONS = {
  admin: '👑',
  manager: '👨‍💼',
  technician: '🔧',
  viewer: '👁️',
};

export const UsersListDashboard: React.FC<UsersListDashboardProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    filteredUsers,
    userStats,
    loading,
    error,
    searchTerm,
    filters,
    isCreatingUser,
    loadUsers,
    setCreatingUser,
    setSearchTerm,
    setFilters,
    editUser,
    deleteUser,
    resetError,
  } = useUserManagement();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showActivityMonitor, setShowActivityMonitor] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  // Load users when component mounts
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen, loadUsers]);

  // Handle create user
  const handleCreateUser = () => {
    setShowCreateForm(true);
    setCreatingUser(true);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
    setCreatingUser(false);
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    editUser(user);
    setShowCreateForm(true); // We can reuse the form for editing
  };

  // Handle view user details
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      await deleteUser(userId);
    }
  };

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set(filteredUsers.map(user => user.department).filter(Boolean));
    return Array.from(depts);
  }, [filteredUsers]);

  // Get unique assigned states for filter
  const allAssignedStates = useMemo(() => {
    const states = new Set<string>();
    filteredUsers.forEach(user => {
      user.assignedStates?.forEach(state => states.add(state));
    });
    return Array.from(states).sort();
  }, [filteredUsers]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Users Management</h2>
                <p className="text-sm text-gray-500">Manage users, roles, and regional assignments</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowActivityMonitor(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Activity Monitor</span>
              </button>
              <button
                onClick={() => setShowBulkImport(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Bulk Import</span>
              </button>
              <button
                onClick={handleCreateUser}
                disabled={loading.users}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create User</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
              <div className="bg-white p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{userStats.total}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{userStats.active}</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{userStats.inactive}</div>
                <div className="text-sm text-gray-600">Inactive Users</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{Object.keys(userStats.byRole).length}</div>
                <div className="text-sm text-gray-600">Role Types</div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="px-6 py-4 bg-white border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <select
                  value={filters.role}
                  onChange={(e) => setFilters({ role: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="technician">Technician</option>
                  <option value="viewer">Viewer</option>
                </select>

                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ department: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ status: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-200">
              <div className="flex items-center justify-between">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-red-800">{error}</div>
                </div>
                <button
                  onClick={resetError}
                  className="text-red-400 hover:text-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="flex-1 overflow-hidden">
            {loading.users ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-3">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-gray-600">Loading users...</span>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role & Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned Regions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-lg">{ROLE_ICONS[user.role]}</span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              {user.phoneNumber && (
                                <div className="text-xs text-gray-400">{user.phoneNumber}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                              {user.role}
                            </span>
                            {user.department && (
                              <div className="text-xs text-gray-500 mt-1">{user.department}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            {user.assignedStates && user.assignedStates.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {user.assignedStates.slice(0, 3).map((state) => (
                                  <span
                                    key={state}
                                    className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                                  >
                                    {state}
                                  </span>
                                ))}
                                {user.assignedStates.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                                    +{user.assignedStates.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">All regions</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewUser(user)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit User"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {user.id !== '1' && ( // Don't allow deleting main admin
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete User"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                    <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Creation Form Modal */}
      <AdminUserCreationForm
        isOpen={showCreateForm}
        onClose={handleCloseCreateForm}
      />

      {/* Bulk User Import Modal */}
      <BulkUserImport
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onUsersImported={(users) => {
          console.log('Users imported:', users);
          setShowBulkImport(false);
          loadUsers(); // Refresh user list
        }}
      />

      {/* User Activity Monitor Modal */}
      <UserActivityMonitor
        isOpen={showActivityMonitor}
        onClose={() => setShowActivityMonitor(false)}
      />

      {/* User Details Modal - You can implement this later */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
              <button
                onClick={() => setShowUserDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.department || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Assigned States</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedUser.assignedStates?.join(', ') || 'All regions'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UsersListDashboard;