import React, { useState, useEffect, useCallback } from "react";
import { useUserManagement } from "../../hooks/useUserManagement";
import { UserGroup, User } from "../../types";

interface UserGroupCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingGroup?: UserGroup | null;
}

const PERMISSION_OPTIONS = [
  { value: "read", label: "Read", description: "View data and information" },
  { value: "write", label: "Write", description: "Create and modify data" },
  { value: "delete", label: "Delete", description: "Remove data and records" },
  {
    value: "manage_users",
    label: "Manage Users",
    description: "Add, edit, and remove users"
  },
  {
    value: "manage_groups",
    label: "Manage Groups",
    description: "Create and modify user groups"
  },
  {
    value: "view_analytics",
    label: "View Analytics",
    description: "Access reports and analytics"
  },
  {
    value: "manage_equipment",
    label: "Manage Equipment",
    description: "Control infrastructure equipment"
  },
  {
    value: "update_status",
    label: "Update Status",
    description: "Change equipment and service status"
  },
  {
    value: "export_data",
    label: "Export Data",
    description: "Download and export information"
  },
  {
    value: "system_admin",
    label: "System Admin",
    description: "Full system administration access"
  }
];

const GROUP_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#F97316",
  "#84CC16",
  "#EC4899",
  "#6366F1"
];

const GROUP_ICONS = [
  "👥",
  "🏢",
  "🔧",
  "📊",
  "🛡️",
  "⚡",
  "🎯",
  "📋",
  "🌟",
  "🔥"
];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];

const UserGroupCreationForm: React.FC<UserGroupCreationFormProps> = ({
  isOpen,
  onClose,
  editingGroup
}) => {
  const { createUserGroup, updateUserGroup, userGroups, users } =
    useUserManagement();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: "",
    permissions: [] as string[],
    assignedStates: [] as string[],
    color: GROUP_COLORS[0],
    icon: GROUP_ICONS[0],
    isActive: true
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Reset form when modal opens/closes or editing group changes
  useEffect(() => {
    if (isOpen) {
      if (editingGroup) {
        setFormData({
          name: editingGroup.name,
          description: editingGroup.description || "",
          parentId: editingGroup.parentId || "",
          permissions: editingGroup.permissions,
          assignedStates: editingGroup.assignedStates,
          color: editingGroup.color,
          icon: editingGroup.icon || GROUP_ICONS[0],
          isActive: editingGroup.isActive
        });
        // Note: In a real implementation, you'd fetch the current members of the group
        setSelectedUsers([]);
      } else {
        setFormData({
          name: "",
          description: "",
          parentId: "",
          permissions: [],
          assignedStates: [],
          color: GROUP_COLORS[0],
          icon: GROUP_ICONS[0],
          isActive: true
        });
        setSelectedUsers([]);
      }
      setFormErrors({});
    }
  }, [isOpen, editingGroup]);

  // Get available parent groups (excluding the current group if editing)
  const availableParentGroups = userGroups.filter(
    (group) =>
      group.id !== editingGroup?.id &&
      !group.path.includes(editingGroup?.id || "")
  );

  // Validate form
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Group name is required";
    } else if (formData.name.length < 2) {
      errors.name = "Group name must be at least 2 characters";
    }

    if (formData.description && formData.description.length > 200) {
      errors.description = "Description must be less than 200 characters";
    }

    if (formData.permissions.length === 0) {
      errors.permissions = "At least one permission must be selected";
    }

    if (formData.assignedStates.length === 0) {
      errors.assignedStates = "At least one state must be assigned";
    }

    // Check for duplicate group name
    const existingGroup = userGroups.find(
      (group) =>
        group.name.toLowerCase() === formData.name.toLowerCase() &&
        group.id !== editingGroup?.id
    );
    if (existingGroup) {
      errors.name = "A group with this name already exists";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, userGroups, editingGroup]);

  // Handle permission toggle
  const handlePermissionToggle = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  // Handle state toggle
  const handleStateToggle = (state: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedStates: prev.assignedStates.includes(state)
        ? prev.assignedStates.filter((s) => s !== state)
        : [...prev.assignedStates, state]
    }));
  };

  // Handle bulk state selection
  const handleBulkStateSelection = (
    action: "all" | "none" | "north" | "south" | "east" | "west"
  ) => {
    let states: string[] = [];

    switch (action) {
      case "all":
        states = INDIAN_STATES;
        break;
      case "none":
        states = [];
        break;
      case "north":
        states = [
          "Delhi",
          "Haryana",
          "Himachal Pradesh",
          "Jammu and Kashmir",
          "Punjab",
          "Rajasthan",
          "Uttar Pradesh",
          "Uttarakhand"
        ];
        break;
      case "south":
        states = [
          "Andhra Pradesh",
          "Karnataka",
          "Kerala",
          "Tamil Nadu",
          "Telangana"
        ];
        break;
      case "east":
        states = ["Assam", "Bihar", "Jharkhand", "Odisha", "West Bengal"];
        break;
      case "west":
        states = ["Goa", "Gujarat", "Maharashtra", "Rajasthan"];
        break;
    }

    setFormData((prev) => ({ ...prev, assignedStates: states }));
  };

  // Handle user selection toggle
  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (editingGroup) {
        await updateUserGroup(editingGroup.id, formData);
      } else {
        const newGroupId = await createUserGroup({
          ...formData,
          level: formData.parentId ? 1 : 0,
          path: formData.parentId ? [formData.parentId] : [],
          childGroups: [],
          createdBy: "current-user" // In real app, get from auth context
        });
        // TODO: Add selected users to the group using separate member management
      }
      onClose();
    } catch (error) {
      console.error("Error saving group:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-white bg-opacity-20">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {editingGroup ? "Edit User Group" : "Create New User Group"}
                </h3>
                <p className="text-sm opacity-90">
                  {editingGroup
                    ? "Modify group settings and permissions"
                    : "Set up a new group with permissions and members"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Basic Information
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.name ? "border-red-300" : "border-blue-300"
                    }`}
                    placeholder="Enter group name"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Parent Group (Optional)
                  </label>
                  <select
                    value={formData.parentId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        parentId: e.target.value
                      }))
                    }
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No Parent (Top Level)</option>
                    {availableParentGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {"  ".repeat(group.level - 1)} {group.name} (Level{" "}
                        {group.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value
                      }))
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.description
                        ? "border-red-300"
                        : "border-blue-300"
                    }`}
                    placeholder="Describe the purpose and responsibilities of this group"
                    rows={3}
                    maxLength={200}
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-blue-600">
                    {formData.description.length}/200 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Customization */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
              <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z"
                    clipRule="evenodd"
                  />
                </svg>
                Visual Customization
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">
                    Group Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GROUP_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, color }))
                        }
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color
                            ? "border-gray-400"
                            : "border-gray-200"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 p-3 rounded-lg border border-purple-200 bg-white">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: formData.color }}
                      >
                        {formData.icon}
                      </div>
                      <span className="text-sm text-purple-700">Preview</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">
                    Group Icon
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {GROUP_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, icon }))
                        }
                        className={`p-2 rounded border text-lg ${
                          formData.icon === icon
                            ? "border-purple-400 bg-purple-100"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
              <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-2a1 1 0 11-2 0 1 1 0 012 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Permissions & Access Control
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PERMISSION_OPTIONS.map((permission) => (
                  <label
                    key={permission.value}
                    className="flex items-start space-x-3 p-3 rounded-lg border border-green-200 hover:bg-green-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission.value)}
                      onChange={() => handlePermissionToggle(permission.value)}
                      className="mt-1 rounded border-green-300 text-green-600 focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-green-800">
                        {permission.label}
                      </div>
                      <div className="text-sm text-green-600">
                        {permission.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {formErrors.permissions && (
                <p className="mt-2 text-sm text-red-600">
                  {formErrors.permissions}
                </p>
              )}
            </div>

            {/* Assigned States */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
              <h4 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                Geographic Access (States)
              </h4>

              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleBulkStateSelection("all")}
                    className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkStateSelection("none")}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkStateSelection("north")}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    North India
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkStateSelection("south")}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    South India
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkStateSelection("east")}
                    className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                  >
                    East India
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkStateSelection("west")}
                    className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                  >
                    West India
                  </button>
                </div>
                <p className="mt-2 text-sm text-orange-600">
                  Selected: {formData.assignedStates.length} of{" "}
                  {INDIAN_STATES.length} states
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {INDIAN_STATES.map((state) => (
                  <label
                    key={state}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-orange-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.assignedStates.includes(state)}
                      onChange={() => handleStateToggle(state)}
                      className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-orange-800">{state}</span>
                  </label>
                ))}
              </div>
              {formErrors.assignedStates && (
                <p className="mt-2 text-sm text-red-600">
                  {formErrors.assignedStates}
                </p>
              )}
            </div>

            {/* User Selection (for new groups) */}
            {!editingGroup && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
                <h4 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Add Members (Optional)
                </h4>

                <div className="max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {users.map((user: User) => (
                      <label
                        key={user.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border border-indigo-200 hover:bg-indigo-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserToggle(user.id)}
                          className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-indigo-800">
                            {user.name}
                          </div>
                          <div className="text-sm text-indigo-600">
                            @{user.username} • {user.role}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-sm text-indigo-600">
                  Selected: {selectedUsers.length} users
                </p>
              </div>
            )}

            {/* Status */}
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Group Status
              </h4>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: e.target.checked
                    }))
                  }
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <div>
                  <span className="font-medium text-gray-900">
                    Active Group
                  </span>
                  <p className="text-sm text-gray-600">
                    Members can use group permissions and access assigned
                    resources
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
            >
              {editingGroup ? "Update Group" : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserGroupCreationForm;
