import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User, UserGroup, GroupMember } from "../../types";
import { UserRegionConfig } from "../../utils/userRegionManagement";

// LocalStorage keys
const STORAGE_KEYS = {
  USERS: 'opticonnect_admin_users',
  USER_GROUPS: 'opticonnect_user_groups',
  USER_REGION_CONFIGS: 'opticonnect_user_region_configs'
};

// Utility functions for localStorage
const saveUsersToStorage = (users: User[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (error) {
    console.error('Failed to save users to localStorage:', error);
  }
};

const loadUsersFromStorage = (): User[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load users from localStorage:', error);
    return [];
  }
};

const saveUserGroupsToStorage = (groups: UserGroup[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_GROUPS, JSON.stringify(groups));
  } catch (error) {
    console.error('Failed to save user groups to localStorage:', error);
  }
};

const loadUserGroupsFromStorage = (): UserGroup[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_GROUPS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load user groups from localStorage:', error);
    return [];
  }
};

const saveUserRegionConfigsToStorage = (configs: Record<string, UserRegionConfig>) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_REGION_CONFIGS, JSON.stringify(configs));
  } catch (error) {
    console.error('Failed to save user region configs to localStorage:', error);
  }
};

const loadUserRegionConfigsFromStorage = (): Record<string, UserRegionConfig> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_REGION_CONFIGS);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to load user region configs from localStorage:', error);
    return {};
  }
};

interface UserManagementState {
  // Users
  users: User[];
  currentEditingUser: User | null;

  // User Groups
  userGroups: UserGroup[];
  currentEditingGroup: UserGroup | null;

  // Group Memberships
  groupMembers: GroupMember[];

  // User Region Assignments
  userRegionConfigs: Record<string, UserRegionConfig>;

  // Login/Authentication tracking
  loginAttempts: Record<string, { count: number; lastAttempt: string; lockedUntil?: string }>;

  // UI State
  isCreatingUser: boolean;
  isEditingUser: boolean;
  isCreatingGroup: boolean;
  isEditingGroup: boolean;
  isAssigningRegions: boolean;

  // Loading states
  loading: {
    users: boolean;
    groups: boolean;
    regions: boolean;
    creating: boolean;
    updating: boolean;
    deleting: boolean;
    authenticating: boolean;
  };

  // Error handling
  error: string | null;

  // Filters and Search
  filters: {
    role: User["role"] | "all";
    department: string | "all";
    status: "active" | "inactive" | "all";
    assignedStates: string[];
  };
  searchTerm: string;
}

const initialState: UserManagementState = {
  users: loadUsersFromStorage(),
  currentEditingUser: null,
  userGroups: loadUserGroupsFromStorage(),
  currentEditingGroup: null,
  groupMembers: [],
  userRegionConfigs: loadUserRegionConfigsFromStorage(),
  loginAttempts: {},
  isCreatingUser: false,
  isEditingUser: false,
  isCreatingGroup: false,
  isEditingGroup: false,
  isAssigningRegions: false,
  loading: {
    users: false,
    groups: false,
    regions: false,
    creating: false,
    updating: false,
    deleting: false,
    authenticating: false
  },
  error: null,
  filters: {
    role: "all",
    department: "all",
    status: "all",
    assignedStates: []
  },
  searchTerm: ""
};

const userManagementSlice = createSlice({
  name: "userManagement",
  initialState,
  reducers: {
    // Loading states
    setLoading: (
      state,
      action: PayloadAction<{
        type: keyof UserManagementState["loading"];
        loading: boolean;
      }>
    ) => {
      state.loading[action.payload.type] = action.payload.loading;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Users management
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
      state.loading.users = false;
      saveUsersToStorage(state.users);
    },

    addUser: (state, action: PayloadAction<User>) => {
      state.users.push(action.payload);
      state.loading.creating = false;
      state.isCreatingUser = false;
      saveUsersToStorage(state.users);
    },

    updateUser: (state, action: PayloadAction<User>) => {
      const index = state.users.findIndex(
        (user) => user.id === action.payload.id
      );
      if (index !== -1) {
        state.users[index] = action.payload;
      }
      state.loading.updating = false;
      state.isEditingUser = false;
      state.currentEditingUser = null;
      saveUsersToStorage(state.users);
    },

    deleteUser: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter((user) => user.id !== action.payload);
      // Also remove from region configs
      delete state.userRegionConfigs[action.payload];
      state.loading.deleting = false;
      saveUsersToStorage(state.users);
      saveUserRegionConfigsToStorage(state.userRegionConfigs);
    },

    setCurrentEditingUser: (state, action: PayloadAction<User | null>) => {
      state.currentEditingUser = action.payload;
      state.isEditingUser = action.payload !== null;
    },

    // User Groups management
    setUserGroups: (state, action: PayloadAction<UserGroup[]>) => {
      state.userGroups = action.payload;
      state.loading.groups = false;
      saveUserGroupsToStorage(state.userGroups);
    },

    addUserGroup: (state, action: PayloadAction<UserGroup>) => {
      state.userGroups.push(action.payload);
      state.loading.creating = false;
      state.isCreatingGroup = false;
      saveUserGroupsToStorage(state.userGroups);
    },

    updateUserGroup: (state, action: PayloadAction<UserGroup>) => {
      const index = state.userGroups.findIndex(
        (group) => group.id === action.payload.id
      );
      if (index !== -1) {
        state.userGroups[index] = action.payload;
      }
      state.loading.updating = false;
      state.isEditingGroup = false;
      state.currentEditingGroup = null;
      saveUserGroupsToStorage(state.userGroups);
    },

    deleteUserGroup: (state, action: PayloadAction<string>) => {
      state.userGroups = state.userGroups.filter(
        (group) => group.id !== action.payload
      );
      // Also remove group memberships
      state.groupMembers = state.groupMembers.filter(
        (member) => member.groupId !== action.payload
      );
      state.loading.deleting = false;
      saveUserGroupsToStorage(state.userGroups);
    },

    setCurrentEditingGroup: (
      state,
      action: PayloadAction<UserGroup | null>
    ) => {
      state.currentEditingGroup = action.payload;
      state.isEditingGroup = action.payload !== null;
    },

    // Group Memberships
    setGroupMembers: (state, action: PayloadAction<GroupMember[]>) => {
      state.groupMembers = action.payload;
    },

    addGroupMember: (state, action: PayloadAction<GroupMember>) => {
      state.groupMembers.push(action.payload);
      // Update group member count
      const group = state.userGroups.find(
        (g) => g.id === action.payload.groupId
      );
      if (group) {
        group.memberCount += 1;
      }
    },

    removeGroupMember: (
      state,
      action: PayloadAction<{ userId: string; groupId: string }>
    ) => {
      state.groupMembers = state.groupMembers.filter(
        (member) =>
          !(
            member.userId === action.payload.userId &&
            member.groupId === action.payload.groupId
          )
      );
      // Update group member count
      const group = state.userGroups.find(
        (g) => g.id === action.payload.groupId
      );
      if (group) {
        group.memberCount = Math.max(0, group.memberCount - 1);
      }
    },

    // User Region Configs
    setUserRegionConfigs: (
      state,
      action: PayloadAction<Record<string, UserRegionConfig>>
    ) => {
      state.userRegionConfigs = action.payload;
      state.loading.regions = false;
      saveUserRegionConfigsToStorage(state.userRegionConfigs);
    },

    setUserRegionConfig: (
      state,
      action: PayloadAction<{ userId: string; config: UserRegionConfig }>
    ) => {
      state.userRegionConfigs[action.payload.userId] = action.payload.config;
      // Also update the user's assignedStates
      const user = state.users.find((u) => u.id === action.payload.userId);
      if (user) {
        user.assignedStates = action.payload.config.assignedStates;
      }
      state.isAssigningRegions = false;
      saveUserRegionConfigsToStorage(state.userRegionConfigs);
      saveUsersToStorage(state.users);
    },

    removeUserRegionConfig: (state, action: PayloadAction<string>) => {
      delete state.userRegionConfigs[action.payload];
      saveUserRegionConfigsToStorage(state.userRegionConfigs);
    },

    // UI State management
    setCreatingUser: (state, action: PayloadAction<boolean>) => {
      state.isCreatingUser = action.payload;
      if (!action.payload) {
        state.error = null;
      }
    },

    setCreatingGroup: (state, action: PayloadAction<boolean>) => {
      state.isCreatingGroup = action.payload;
      if (!action.payload) {
        state.error = null;
      }
    },

    setAssigningRegions: (state, action: PayloadAction<boolean>) => {
      state.isAssigningRegions = action.payload;
    },

    // Filters and Search
    setFilters: (
      state,
      action: PayloadAction<Partial<UserManagementState["filters"]>>
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },

    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.searchTerm = "";
    },

    // Authentication actions
    recordLoginAttempt: (state, action: PayloadAction<{ email: string; success: boolean }>) => {
      const { email, success } = action.payload;
      const now = new Date().toISOString();

      if (!state.loginAttempts[email]) {
        state.loginAttempts[email] = { count: 0, lastAttempt: now };
      }

      if (success) {
        // Reset login attempts on successful login
        delete state.loginAttempts[email];
        // Update user's last login time
        const user = state.users.find(u => u.email === email);
        if (user) {
          user.lastLogin = now;
          saveUsersToStorage(state.users);
        }
      } else {
        // Increment failed attempts
        state.loginAttempts[email].count += 1;
        state.loginAttempts[email].lastAttempt = now;

        // Lock account after 5 failed attempts for 30 minutes
        if (state.loginAttempts[email].count >= 5) {
          const lockDuration = 30 * 60 * 1000; // 30 minutes
          state.loginAttempts[email].lockedUntil = new Date(Date.now() + lockDuration).toISOString();
        }
      }
    },

    validateUserCredentials: (state, action: PayloadAction<{ email: string; password: string }>) => {
      state.loading.authenticating = true;
      const { email, password } = action.payload;

      // Check if account is locked
      const attempt = state.loginAttempts[email];
      if (attempt?.lockedUntil && new Date(attempt.lockedUntil) > new Date()) {
        state.error = `Account is locked until ${new Date(attempt.lockedUntil).toLocaleString()}`;
        state.loading.authenticating = false;
        return;
      }

      // Find user and validate credentials
      const user = state.users.find(u => u.email === email && u.isActive);
      if (!user || user.password !== password) {
        state.error = "Invalid email or password";
        state.loading.authenticating = false;
        return;
      }

      state.error = null;
      state.loading.authenticating = false;
    },

    checkAccountLockStatus: (state, action: PayloadAction<string>) => {
      const email = action.payload;
      const attempt = state.loginAttempts[email];

      if (attempt?.lockedUntil && new Date(attempt.lockedUntil) <= new Date()) {
        // Lock has expired, clear it
        delete state.loginAttempts[email];
      }
    },

    // Reset states
    resetError: (state) => {
      state.error = null;
    },

    resetUserManagement: (state) => {
      return initialState;
    }
  }
});

export const {
  setLoading,
  setError,
  setUsers,
  addUser,
  updateUser,
  deleteUser,
  setCurrentEditingUser,
  setUserGroups,
  addUserGroup,
  updateUserGroup,
  deleteUserGroup,
  setCurrentEditingGroup,
  setGroupMembers,
  addGroupMember,
  removeGroupMember,
  setUserRegionConfigs,
  setUserRegionConfig,
  removeUserRegionConfig,
  setCreatingUser,
  setCreatingGroup,
  setAssigningRegions,
  setFilters,
  setSearchTerm,
  clearFilters,
  recordLoginAttempt,
  validateUserCredentials,
  checkAccountLockStatus,
  resetError,
  resetUserManagement
} = userManagementSlice.actions;

export default userManagementSlice.reducer;
