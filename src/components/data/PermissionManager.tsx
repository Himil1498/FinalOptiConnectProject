import React, { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { DataPermissions, User } from '../../types';

interface PermissionManagerProps {
  itemId: string;
  currentPermissions: DataPermissions;
  onPermissionsChange: (permissions: DataPermissions) => void;
  onClose: () => void;
}

const PermissionManager: React.FC<PermissionManagerProps> = ({
  itemId,
  currentPermissions,
  onPermissionsChange,
  onClose
}) => {
  const { user } = useAuth();
  const { addNotification } = useTheme();

  const [permissions, setPermissions] = useState<DataPermissions>(currentPermissions);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'advanced'>('users');

  // Mock users for demonstration
  const mockUsers: User[] = [
    {
      id: 'user1',
      username: 'manager01',
      email: 'manager@opticonnect.com',
      name: 'Regional Manager',
      role: 'manager',
      permissions: ['read', 'write', 'manage_users'],
      assignedStates: ['Maharashtra', 'Gujarat'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'user2',
      username: 'tech01',
      email: 'tech@opticonnect.com',
      name: 'Field Technician',
      role: 'technician',
      permissions: ['read', 'write'],
      assignedStates: ['Maharashtra'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'user3',
      username: 'analyst01',
      email: 'analyst@opticonnect.com',
      name: 'Data Analyst',
      role: 'viewer',
      permissions: ['read'],
      assignedStates: ['Maharashtra', 'Gujarat', 'Rajasthan'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const filteredUsers = mockUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addUserPermission = useCallback((userId: string, permissionType: 'viewers' | 'editors' | 'canDelete' | 'canShare') => {
    setPermissions(prev => ({
      ...prev,
      [permissionType]: [...prev[permissionType].filter(id => id !== userId), userId]
    }));
  }, []);

  const removeUserPermission = useCallback((userId: string, permissionType: 'viewers' | 'editors' | 'canDelete' | 'canShare') => {
    setPermissions(prev => ({
      ...prev,
      [permissionType]: prev[permissionType].filter(id => id !== userId)
    }));
  }, []);

  const hasPermission = useCallback((userId: string, permissionType: 'viewers' | 'editors' | 'canDelete' | 'canShare') => {
    return permissions[permissionType].includes(userId);
  }, [permissions]);

  const getUserRole = useCallback((userId: string): string => {
    if (permissions.owner === userId) return 'Owner';
    if (permissions.canDelete.includes(userId)) return 'Admin';
    if (permissions.editors.includes(userId)) return 'Editor';
    if (permissions.viewers.includes(userId)) return 'Viewer';
    return 'No Access';
  }, [permissions]);

  const handleSave = useCallback(() => {
    onPermissionsChange(permissions);
    addNotification({
      type: 'success',
      message: 'Permissions updated successfully',
      duration: 3000
    });
    onClose();
  }, [permissions, onPermissionsChange, addNotification, onClose]);

  const getPermissionIcon = (permissionType: string) => {
    switch (permissionType) {
      case 'Owner': return '👑';
      case 'Admin': return '🔧';
      case 'Editor': return '✏️';
      case 'Viewer': return '👁️';
      default: return '🚫';
    }
  };

  return (
    <div className="permission-manager-overlay">
      <div className="permission-manager">
        <div className="permission-header">
          <h2>Manage Permissions</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="permission-tabs">
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            Groups
          </button>
          <button
            className={`tab-btn ${activeTab === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            Advanced
          </button>
        </div>

        <div className="permission-content">
          {activeTab === 'users' && (
            <div className="users-tab">
              <div className="user-search">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="current-permissions">
                <h3>Current Access</h3>
                <div className="permission-list">
                  {/* Owner */}
                  <div className="permission-item owner">
                    <div className="user-info">
                      <span className="user-icon">👑</span>
                      <div>
                        <div className="user-name">
                          {mockUsers.find(u => u.id === permissions.owner)?.name || 'Unknown'}
                        </div>
                        <div className="user-role">Owner</div>
                      </div>
                    </div>
                    <div className="permission-actions">
                      <span className="permission-badge owner">Full Access</span>
                    </div>
                  </div>

                  {/* Other users with permissions */}
                  {filteredUsers
                    .filter(u => u.id !== permissions.owner)
                    .filter(u =>
                      permissions.viewers.includes(u.id) ||
                      permissions.editors.includes(u.id) ||
                      permissions.canDelete.includes(u.id) ||
                      permissions.canShare.includes(u.id)
                    )
                    .map(u => (
                      <div key={u.id} className="permission-item">
                        <div className="user-info">
                          <span className="user-icon">{getPermissionIcon(getUserRole(u.id))}</span>
                          <div>
                            <div className="user-name">{u.name}</div>
                            <div className="user-email">{u.email}</div>
                          </div>
                        </div>
                        <div className="permission-actions">
                          <select
                            value={getUserRole(u.id)}
                            onChange={(e) => {
                              const role = e.target.value;
                              // Remove from all permission arrays first
                              removeUserPermission(u.id, 'viewers');
                              removeUserPermission(u.id, 'editors');
                              removeUserPermission(u.id, 'canDelete');
                              removeUserPermission(u.id, 'canShare');

                              // Add to appropriate arrays based on role
                              if (role === 'Viewer') {
                                addUserPermission(u.id, 'viewers');
                              } else if (role === 'Editor') {
                                addUserPermission(u.id, 'viewers');
                                addUserPermission(u.id, 'editors');
                              } else if (role === 'Admin') {
                                addUserPermission(u.id, 'viewers');
                                addUserPermission(u.id, 'editors');
                                addUserPermission(u.id, 'canDelete');
                                addUserPermission(u.id, 'canShare');
                              }
                            }}
                            className="role-select"
                          >
                            <option value="No Access">No Access</option>
                            <option value="Viewer">Viewer</option>
                            <option value="Editor">Editor</option>
                            <option value="Admin">Admin</option>
                          </select>
                          <button
                            onClick={() => {
                              removeUserPermission(u.id, 'viewers');
                              removeUserPermission(u.id, 'editors');
                              removeUserPermission(u.id, 'canDelete');
                              removeUserPermission(u.id, 'canShare');
                            }}
                            className="remove-btn"
                            title="Remove access"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="add-users">
                <h3>Add Users</h3>
                <div className="user-list">
                  {filteredUsers
                    .filter(u => u.id !== permissions.owner)
                    .filter(u => getUserRole(u.id) === 'No Access')
                    .map(u => (
                      <div key={u.id} className="user-item">
                        <div className="user-info">
                          <span className="user-icon">👤</span>
                          <div>
                            <div className="user-name">{u.name}</div>
                            <div className="user-email">{u.email}</div>
                            <div className="user-role-badge">{u.role}</div>
                          </div>
                        </div>
                        <div className="add-actions">
                          <button
                            onClick={() => addUserPermission(u.id, 'viewers')}
                            className="add-btn viewer"
                            title="Add as viewer"
                          >
                            👁️ Viewer
                          </button>
                          <button
                            onClick={() => {
                              addUserPermission(u.id, 'viewers');
                              addUserPermission(u.id, 'editors');
                            }}
                            className="add-btn editor"
                            title="Add as editor"
                          >
                            ✏️ Editor
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="groups-tab">
              <div className="feature-placeholder">
                <div className="placeholder-icon">👥</div>
                <h3>Group Permissions</h3>
                <p>Manage permissions for user groups and organizational units.</p>
                <div className="group-examples">
                  <div className="group-item">
                    <span className="group-icon">🏢</span>
                    <div>
                      <div className="group-name">Engineering Team</div>
                      <div className="group-members">12 members</div>
                    </div>
                    <button className="add-group-btn">Add Group</button>
                  </div>
                  <div className="group-item">
                    <span className="group-icon">📍</span>
                    <div>
                      <div className="group-name">Maharashtra Region</div>
                      <div className="group-members">8 members</div>
                    </div>
                    <button className="add-group-btn">Add Group</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="advanced-tab">
              <div className="advanced-settings">
                <h3>Advanced Settings</h3>

                <div className="setting-group">
                  <label className="setting-label">
                    <input
                      type="checkbox"
                      checked={permissions.inheritanceRules?.fromParent || false}
                      onChange={(e) => setPermissions(prev => ({
                        ...prev,
                        inheritanceRules: {
                          ...prev.inheritanceRules,
                          fromParent: e.target.checked
                        }
                      }))}
                    />
                    Inherit permissions from parent folder
                  </label>
                  <p className="setting-description">
                    Automatically inherit permissions from the parent folder.
                  </p>
                </div>

                <div className="setting-group">
                  <label className="setting-label">
                    <input
                      type="checkbox"
                      checked={permissions.inheritanceRules?.toChildren || false}
                      onChange={(e) => setPermissions(prev => ({
                        ...prev,
                        inheritanceRules: {
                          ...prev.inheritanceRules,
                          toChildren: e.target.checked
                        }
                      }))}
                    />
                    Apply permissions to child items
                  </label>
                  <p className="setting-description">
                    Apply these permissions to all items within this folder.
                  </p>
                </div>

                <div className="permission-summary">
                  <h4>Permission Summary</h4>
                  <div className="summary-stats">
                    <div className="stat-item">
                      <span className="stat-number">{permissions.viewers.length}</span>
                      <span className="stat-label">Viewers</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{permissions.editors.length}</span>
                      <span className="stat-label">Editors</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{permissions.canDelete.length}</span>
                      <span className="stat-label">Can Delete</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{permissions.canShare.length}</span>
                      <span className="stat-label">Can Share</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="permission-footer">
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
          <button onClick={handleSave} className="save-btn">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionManager;