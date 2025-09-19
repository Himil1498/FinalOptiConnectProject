import React, { useState, useCallback, useMemo, useRef } from 'react';
import { UserGroup, GroupMember, PermissionTemplate, BulkOperation, PERMISSION_CATEGORIES } from '../../types';

interface UserGroupsManagementProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

const GROUP_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

const PERMISSION_TEMPLATES: PermissionTemplate[] = [
  {
    id: 'basic_viewer',
    name: 'Basic Viewer',
    description: 'Can view maps and basic analytics',
    permissions: ['map_view', 'analytics_view'],
    category: 'basic',
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'map_operator',
    name: 'Map Operator',
    description: 'Can use all map tools and measurements',
    permissions: ['map_view', 'map_edit', 'distance_measurement', 'polygon_drawing', 'elevation_analysis'],
    category: 'basic',
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'region_manager',
    name: 'Region Manager',
    description: 'Can manage regions and assignments',
    permissions: ['region_view', 'region_assign', 'region_edit', 'geofencing_manage', 'map_view', 'map_edit'],
    category: 'advanced',
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'team_lead',
    name: 'Team Lead',
    description: 'Can manage team members and view analytics',
    permissions: ['user_view', 'user_edit', 'group_members', 'analytics_view', 'analytics_advanced', 'map_view', 'map_edit'],
    category: 'advanced',
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'system_admin',
    name: 'System Administrator',
    description: 'Full system access with all permissions',
    permissions: Object.values(PERMISSION_CATEGORIES).flatMap(cat => cat.permissions),
    category: 'admin',
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  }
];

const UserGroupsManagement: React.FC<UserGroupsManagementProps> = ({
  isOpen,
  onClose,
  currentUserId,
}) => {
  const [groups, setGroups] = useState<UserGroup[]>([
    {
      id: 'root',
      name: 'Organization',
      description: 'Root organization group',
      level: 0,
      path: [],
      permissions: [],
      assignedStates: [],
      color: '#3b82f6',
      icon: '🏢',
      isActive: true,
      memberCount: 15,
      childGroups: ['engineering', 'operations'],
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'engineering',
      name: 'Engineering',
      description: 'Engineering team with technical access',
      parentId: 'root',
      level: 1,
      path: ['root'],
      permissions: ['map_view', 'map_edit', 'distance_measurement', 'polygon_drawing', 'elevation_analysis'],
      assignedStates: ['Maharashtra', 'Karnataka', 'Tamil Nadu'],
      color: '#10b981',
      icon: '⚙️',
      isActive: true,
      memberCount: 8,
      childGroups: ['gis_team', 'network_team'],
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'operations',
      name: 'Operations',
      description: 'Operations team with regional focus',
      parentId: 'root',
      level: 1,
      path: ['root'],
      permissions: ['map_view', 'region_view', 'analytics_view'],
      assignedStates: ['Gujarat', 'Rajasthan', 'Madhya Pradesh'],
      color: '#f59e0b',
      icon: '🏗️',
      isActive: true,
      memberCount: 7,
      childGroups: ['field_ops', 'maintenance'],
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'gis_team',
      name: 'GIS Specialists',
      description: 'Specialized GIS analysis team',
      parentId: 'engineering',
      level: 2,
      path: ['root', 'engineering'],
      permissions: ['map_view', 'map_edit', 'distance_measurement', 'polygon_drawing', 'elevation_analysis', 'analytics_advanced'],
      assignedStates: ['Maharashtra', 'Karnataka'],
      color: '#8b5cf6',
      icon: '🗺️',
      isActive: true,
      memberCount: 4,
      childGroups: [],
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'network_team',
      name: 'Network Engineers',
      description: 'Network infrastructure team',
      parentId: 'engineering',
      level: 2,
      path: ['root', 'engineering'],
      permissions: ['map_view', 'region_view', 'region_edit'],
      assignedStates: ['Tamil Nadu', 'Karnataka'],
      color: '#06b6d4',
      icon: '🌐',
      isActive: true,
      memberCount: 4,
      childGroups: [],
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);

  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([
    { userId: 'user1', groupId: 'gis_team', role: 'admin', joinedAt: new Date().toISOString(), isActive: true },
    { userId: 'user2', groupId: 'network_team', role: 'member', joinedAt: new Date().toISOString(), isActive: true },
    { userId: 'user3', groupId: 'operations', role: 'moderator', joinedAt: new Date().toISOString(), isActive: true },
  ]);

  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showPermissionMatrix, setShowPermissionMatrix] = useState(false);
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [draggedGroup, setDraggedGroup] = useState<UserGroup | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock users for demonstration
  const mockUsers = [
    { id: 'user1', name: 'Alice Kumar', email: 'alice@opticonnect.com', role: 'technician' as const },
    { id: 'user2', name: 'Bob Singh', email: 'bob@opticonnect.com', role: 'manager' as const },
    { id: 'user3', name: 'Carol Patel', email: 'carol@opticonnect.com', role: 'viewer' as const },
    { id: 'user4', name: 'David Shah', email: 'david@opticonnect.com', role: 'technician' as const },
    { id: 'user5', name: 'Eva Gupta', email: 'eva@opticonnect.com', role: 'manager' as const },
  ];

  // Create hierarchical group structure
  const groupHierarchy = useMemo(() => {
    const groupMap = new Map(groups.map(g => [g.id, { ...g, children: [] as UserGroup[] }]));
    const rootGroups: UserGroup[] = [];

    groups.forEach(group => {
      const groupWithChildren = groupMap.get(group.id)!;
      if (group.parentId) {
        const parent = groupMap.get(group.parentId);
        if (parent) {
          parent.children.push(groupWithChildren);
        }
      } else {
        rootGroups.push(groupWithChildren);
      }
    });

    return rootGroups;
  }, [groups]);

  // Handle group creation
  const handleCreateGroup = useCallback((formData: any) => {
    const newGroup: UserGroup = {
      id: `group_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      parentId: formData.parentId || undefined,
      level: formData.parentId ? (groups.find(g => g.id === formData.parentId)?.level || 0) + 1 : 0,
      path: formData.parentId ? [...(groups.find(g => g.id === formData.parentId)?.path || []), formData.parentId] : [],
      permissions: formData.permissions || [],
      assignedStates: formData.assignedStates || [],
      color: formData.color || GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)],
      icon: formData.icon || '👥',
      isActive: true,
      memberCount: 0,
      childGroups: [],
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setGroups(prev => {
      const updated = [...prev, newGroup];
      // Update parent's childGroups
      if (formData.parentId) {
        return updated.map(g =>
          g.id === formData.parentId
            ? { ...g, childGroups: [...g.childGroups, newGroup.id] }
            : g
        );
      }
      return updated;
    });

    setShowCreateGroup(false);
  }, [groups, currentUserId]);

  // Handle drag and drop
  const handleDragStart = useCallback((group: UserGroup) => {
    setDraggedGroup(group);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((targetGroup: UserGroup) => {
    if (!draggedGroup || draggedGroup.id === targetGroup.id) return;

    // Prevent dropping parent into child
    if (targetGroup.path.includes(draggedGroup.id)) {
      alert('Cannot move a parent group into its child group');
      return;
    }

    setGroups(prev => prev.map(group => {
      if (group.id === draggedGroup.id) {
        return {
          ...group,
          parentId: targetGroup.id,
          level: targetGroup.level + 1,
          path: [...targetGroup.path, targetGroup.id],
          updatedAt: new Date().toISOString()
        };
      }
      if (group.id === targetGroup.id) {
        return {
          ...group,
          childGroups: [...group.childGroups, draggedGroup.id],
          updatedAt: new Date().toISOString()
        };
      }
      if (group.id === draggedGroup.parentId) {
        return {
          ...group,
          childGroups: group.childGroups.filter(id => id !== draggedGroup.id),
          updatedAt: new Date().toISOString()
        };
      }
      return group;
    }));

    setDraggedGroup(null);
  }, [draggedGroup]);

  // Bulk operations
  const handleBulkAssignUsers = useCallback((groupId: string, userIds: string[]) => {
    const newMembers: GroupMember[] = userIds.map(userId => ({
      userId,
      groupId,
      role: 'member' as const,
      joinedAt: new Date().toISOString(),
      isActive: true
    }));

    setGroupMembers(prev => [...prev, ...newMembers]);
    setGroups(prev => prev.map(g =>
      g.id === groupId
        ? { ...g, memberCount: g.memberCount + userIds.length }
        : g
    ));
  }, []);

  // Render group tree
  const renderGroupTree = (groupsToRender: UserGroup[], level = 0) => {
    return groupsToRender.map(group => (
      <div key={group.id} className="group-tree-item">
        <div
          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
            selectedGroup?.id === group.id
              ? 'bg-blue-50 border-blue-300'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
          style={{ marginLeft: `${level * 20}px` }}
          draggable
          onDragStart={() => handleDragStart(group)}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(group)}
          onClick={() => setSelectedGroup(group)}
        >
          <div
            className="w-4 h-4 rounded-full mr-3"
            style={{ backgroundColor: group.color }}
          />
          <span className="text-lg mr-2">{group.icon}</span>
          <div className="flex-1">
            <div className="font-medium text-gray-900">{group.name}</div>
            <div className="text-sm text-gray-500">
              {group.memberCount} members • Level {group.level}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {group.permissions.length} permissions
            </span>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              {group.assignedStates.length} states
            </span>
          </div>
        </div>
        {(group as any).children && (group as any).children.length > 0 && (
          <div className="mt-2">
            {renderGroupTree((group as any).children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Groups Management</h2>
            <p className="text-gray-600">Manage hierarchical user groups and permissions</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowCreateGroup(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Group
            </button>
            <button
              onClick={() => setShowPermissionMatrix(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Permission Matrix
            </button>
            <button
              onClick={() => setShowBulkOperations(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Bulk Operations
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Group Tree */}
          <div className="w-1/2 border-r border-gray-200 p-4 overflow-y-auto">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900 mb-3">Group Hierarchy</h3>
              {renderGroupTree(groupHierarchy)}
            </div>
          </div>

          {/* Right Panel - Group Details */}
          <div className="w-1/2 p-4 overflow-y-auto">
            {selectedGroup ? (
              <div className="space-y-6">
                {/* Group Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <div
                      className="w-6 h-6 rounded-full mr-3"
                      style={{ backgroundColor: selectedGroup.color }}
                    />
                    <span className="text-2xl mr-3">{selectedGroup.icon}</span>
                    <h3 className="text-xl font-bold text-gray-900">{selectedGroup.name}</h3>
                  </div>
                  <p className="text-gray-600 mb-3">{selectedGroup.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Level:</span> {selectedGroup.level}
                    </div>
                    <div>
                      <span className="font-medium">Members:</span> {selectedGroup.memberCount}
                    </div>
                    <div>
                      <span className="font-medium">Permissions:</span> {selectedGroup.permissions.length}
                    </div>
                    <div>
                      <span className="font-medium">States:</span> {selectedGroup.assignedStates.length}
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Permissions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedGroup.permissions.map(permission => (
                      <div key={permission} className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
                        {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assigned States */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Assigned States</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedGroup.assignedStates.map(state => (
                      <div key={state} className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm">
                        {state}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Members */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Members</h4>
                  <div className="space-y-2">
                    {groupMembers
                      .filter(member => member.groupId === selectedGroup.id)
                      .map(member => {
                        const user = mockUsers.find(u => u.id === member.userId);
                        return user ? (
                          <div key={member.userId} className="flex items-center justify-between p-2 bg-white border rounded">
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs px-2 py-1 rounded ${
                                member.role === 'admin' ? 'bg-red-100 text-red-800' :
                                member.role === 'moderator' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {member.role}
                              </span>
                            </div>
                          </div>
                        ) : null;
                      })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a group to view details
              </div>
            )}
          </div>
        </div>

        {/* Create Group Modal */}
        {showCreateGroup && (
          <CreateGroupModal
            onClose={() => setShowCreateGroup(false)}
            onSave={handleCreateGroup}
            groups={groups}
            permissionTemplates={PERMISSION_TEMPLATES}
          />
        )}

        {/* Permission Matrix Modal */}
        {showPermissionMatrix && (
          <PermissionMatrixModal
            groups={groups}
            onClose={() => setShowPermissionMatrix(false)}
            onUpdatePermissions={(groupId, permissions) => {
              setGroups(prev => prev.map(g =>
                g.id === groupId
                  ? { ...g, permissions, updatedAt: new Date().toISOString() }
                  : g
              ));
            }}
          />
        )}

        {/* Bulk Operations Modal */}
        {showBulkOperations && (
          <BulkOperationsModal
            groups={groups}
            users={mockUsers}
            onClose={() => setShowBulkOperations(false)}
            onBulkAssign={handleBulkAssignUsers}
          />
        )}
      </div>
    </div>
  );
};

// Create Group Modal Component
const CreateGroupModal: React.FC<{
  onClose: () => void;
  onSave: (data: any) => void;
  groups: UserGroup[];
  permissionTemplates: PermissionTemplate[];
}> = ({ onClose, onSave, groups, permissionTemplates }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    permissions: [] as string[],
    assignedStates: [] as string[],
    color: GROUP_COLORS[0],
    icon: '👥'
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Create New Group</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Group Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Enter group name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Enter group description"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Parent Group</label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">No parent (root level)</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {'  '.repeat(group.level)}{group.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <div className="flex space-x-2">
              {GROUP_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-6 h-6 rounded border-2 ${
                    formData.color === color ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={!formData.name}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
};

// Permission Matrix Modal Component
const PermissionMatrixModal: React.FC<{
  groups: UserGroup[];
  onClose: () => void;
  onUpdatePermissions: (groupId: string, permissions: string[]) => void;
}> = ({ groups, onClose, onUpdatePermissions }) => {
  const allPermissions = Object.values(PERMISSION_CATEGORIES).flatMap(cat => cat.permissions);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Permission Matrix</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-sm font-medium border">Group</th>
                {allPermissions.map(permission => (
                  <th key={permission} className="px-2 py-2 text-xs font-medium border transform -rotate-45 w-8">
                    {permission.split('_')[1] || permission}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map(group => (
                <tr key={group.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border font-medium">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: group.color }}
                      />
                      {group.name}
                    </div>
                  </td>
                  {allPermissions.map(permission => (
                    <td key={permission} className="px-2 py-2 text-center border">
                      <input
                        type="checkbox"
                        checked={group.permissions.includes(permission)}
                        onChange={(e) => {
                          const newPermissions = e.target.checked
                            ? [...group.permissions, permission]
                            : group.permissions.filter(p => p !== permission);
                          onUpdatePermissions(group.id, newPermissions);
                        }}
                        className="w-4 h-4"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Bulk Operations Modal Component
const BulkOperationsModal: React.FC<{
  groups: UserGroup[];
  users: any[];
  onClose: () => void;
  onBulkAssign: (groupId: string, userIds: string[]) => void;
}> = ({ groups, users, onClose, onBulkAssign }) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [targetGroupId, setTargetGroupId] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Bulk Operations</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Users</label>
            <div className="max-h-32 overflow-y-auto border rounded p-2">
              {users.map(user => (
                <label key={user.id} className="flex items-center space-x-2 p-1">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(prev => [...prev, user.id]);
                      } else {
                        setSelectedUsers(prev => prev.filter(id => id !== user.id));
                      }
                    }}
                  />
                  <span className="text-sm">{user.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Target Group</label>
            <select
              value={targetGroupId}
              onChange={(e) => setTargetGroupId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Select group</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {'  '.repeat(group.level)}{group.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (targetGroupId && selectedUsers.length > 0) {
                onBulkAssign(targetGroupId, selectedUsers);
                onClose();
              }
            }}
            disabled={!targetGroupId || selectedUsers.length === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            Assign Users
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserGroupsManagement;