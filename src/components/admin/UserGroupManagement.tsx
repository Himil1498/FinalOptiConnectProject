import React, { useState, useCallback, useMemo } from "react";
import { useUserManagement } from "../../hooks/useUserManagement";
import { UserGroup, User } from "../../types";
import UserGroupCreationForm from "./UserGroupCreationForm";

interface UserGroupManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserGroupManagement: React.FC<UserGroupManagementProps> = ({
  isOpen,
  onClose
}) => {
  const userManagement = useUserManagement();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    level: "all",
    hasParent: "all"
  });

  // Get filtered groups
  const filteredGroups = useMemo(() => {
    return userManagement.userGroups.filter((group: UserGroup) => {
      const matchesSearch =
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.permissions.some((p) =>
          p.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "active" && group.isActive) ||
        (filters.status === "inactive" && !group.isActive);

      const matchesLevel =
        filters.level === "all" || group.level.toString() === filters.level;

      const matchesParent =
        filters.hasParent === "all" ||
        (filters.hasParent === "yes" && group.parentId) ||
        (filters.hasParent === "no" && !group.parentId);

      return matchesSearch && matchesStatus && matchesLevel && matchesParent;
    });
  }, [userManagement.userGroups, searchTerm, filters]);

  // Group statistics
  const groupStats = useMemo(
    () => ({
      total: userManagement.userGroups.length,
      active: userManagement.userGroups.filter((g) => g.isActive).length,
      inactive: userManagement.userGroups.filter((g) => !g.isActive).length,
      topLevel: userManagement.userGroups.filter((g) => !g.parentId).length,
      withChildren: userManagement.userGroups.filter(
        (g) => g.childGroups.length > 0
      ).length,
      totalMembers: userManagement.userGroups.reduce(
        (sum, g) => sum + g.memberCount,
        0
      )
    }),
    [userManagement.userGroups]
  );

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setShowCreateForm(true);
  };

  const handleEditGroup = (group: UserGroup) => {
    setEditingGroup(group);
    setShowCreateForm(true);
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this group? This action cannot be undone."
      )
    ) {
      await userManagement.deleteUserGroup(groupId);
    }
  };

  const handleBulkAction = async (
    action: "activate" | "deactivate" | "delete"
  ) => {
    if (selectedGroups.length === 0) return;

    if (action === "delete") {
      if (
        window.confirm(
          `Are you sure you want to delete ${selectedGroups.length} groups?`
        )
      ) {
        for (const groupId of selectedGroups) {
          await userManagement.deleteUserGroup(groupId);
        }
        setSelectedGroups([]);
      }
    } else {
      const isActive = action === "activate";
      for (const groupId of selectedGroups) {
        await userManagement.updateUserGroup(groupId, { isActive });
      }
      setSelectedGroups([]);
    }
  };

  const handleSelectAll = () => {
    if (selectedGroups.length === filteredGroups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(filteredGroups.map((g) => g.id));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onClose}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors mr-4"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Users
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-600">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    User Groups Management
                  </h1>
                  <p className="text-sm text-gray-500">
                    👥 Create and manage user groups with hierarchical
                    permissions
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Total Groups:{" "}
                <span className="font-medium text-purple-600">
                  {groupStats.total}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Members:{" "}
                <span className="font-medium text-blue-600">
                  {groupStats.totalMembers}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header with Stats */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    User Groups Dashboard
                  </h2>
                  <p className="text-sm text-gray-600">
                    Organize users into groups with specific permissions and
                    access levels
                  </p>
                </div>
              </div>
              <button
                onClick={handleCreateGroup}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <svg
                  className="w-5 h-5 inline mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create Group
              </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs text-gray-600">Total Groups</p>
                    <p className="text-lg font-bold text-purple-600">
                      {groupStats.total}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-green-100 text-green-600">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs text-gray-600">Active</p>
                    <p className="text-lg font-bold text-green-600">
                      {groupStats.active}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-red-200">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-red-100 text-red-600">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs text-gray-600">Inactive</p>
                    <p className="text-lg font-bold text-red-600">
                      {groupStats.inactive}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs text-gray-600">Top Level</p>
                    <p className="text-lg font-bold text-blue-600">
                      {groupStats.topLevel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM10 12a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs text-gray-600">With Children</p>
                    <p className="text-lg font-bold text-yellow-600">
                      {groupStats.withChildren}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-indigo-200">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs text-gray-600">Total Members</p>
                    <p className="text-lg font-bold text-indigo-600">
                      {groupStats.totalMembers}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search groups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <select
                  value={filters.level}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, level: e.target.value }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Levels</option>
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                </select>

                <select
                  value={filters.hasParent}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      hasParent: e.target.value
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Groups</option>
                  <option value="no">Top Level</option>
                  <option value="yes">Sub Groups</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                {selectedGroups.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {selectedGroups.length} selected
                    </span>
                    <button
                      onClick={() => handleBulkAction("activate")}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => handleBulkAction("deactivate")}
                      className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                    >
                      Deactivate
                    </button>
                    <button
                      onClick={() => handleBulkAction("delete")}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Groups Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={
                        selectedGroups.length === filteredGroups.length &&
                        filteredGroups.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level & Hierarchy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
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
                {filteredGroups.map((group: UserGroup) => (
                  <tr
                    key={group.id}
                    className="hover:bg-purple-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGroups((prev) => [...prev, group.id]);
                          } else {
                            setSelectedGroups((prev) =>
                              prev.filter((id) => id !== group.id)
                            );
                          }
                        }}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div
                            className="h-12 w-12 rounded-lg flex items-center justify-center text-white text-lg font-bold"
                            style={{ backgroundColor: group.color }}
                          >
                            {group.icon || group.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {group.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {group.description || "No description"}
                          </div>
                          <div className="text-xs text-purple-600">
                            Created:{" "}
                            {new Date(group.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          Level {group.level}
                        </div>
                        {group.parentId && (
                          <div className="text-xs text-gray-600">
                            Sub-group of:{" "}
                            {userManagement.userGroups.find(
                              (g) => g.id === group.parentId
                            )?.name || "Unknown"}
                          </div>
                        )}
                        {group.childGroups.length > 0 && (
                          <div className="text-xs text-blue-600">
                            {group.childGroups.length} child group(s)
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-indigo-600">
                          {group.memberCount}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          members
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {group.permissions
                          .slice(0, 3)
                          .map((permission, index) => (
                            <span
                              key={index}
                              className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                            >
                              {permission}
                            </span>
                          ))}
                        {group.permissions.length > 3 && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            +{group.permissions.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border-2 ${
                          group.isActive
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }`}
                      >
                        {group.isActive ? "✅ Active" : "❌ Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditGroup(group)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded transition-colors"
                          title="Edit Group"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                          title="Delete Group"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredGroups.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No groups found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ||
                filters.status !== "all" ||
                filters.level !== "all" ||
                filters.hasParent !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by creating your first user group."}
              </p>
              {!searchTerm &&
                filters.status === "all" &&
                filters.level === "all" &&
                filters.hasParent === "all" && (
                  <div className="mt-6">
                    <button
                      onClick={handleCreateGroup}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Create User Group
                    </button>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Group Modal */}
      {showCreateForm && (
        <UserGroupCreationForm
          isOpen={showCreateForm}
          onClose={() => {
            setShowCreateForm(false);
            setEditingGroup(null);
          }}
          editingGroup={editingGroup}
        />
      )}
    </div>
  );
};

export default UserGroupManagement;
