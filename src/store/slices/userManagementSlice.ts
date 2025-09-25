import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, UserGroup, GroupMember } from '../../types';
import { UserRegionConfig } from '../../utils/userRegionManagement';

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
  };

  // Error handling
  error: string | null;

  // Filters and Search
  filters: {
    role: User['role'] | 'all';
    department: string | 'all';
    status: 'active' | 'inactive' | 'all';
    assignedStates: string[];
  };
  searchTerm: string;
}

const initialState: UserManagementState = {
  users: [],
  currentEditingUser: null,
  userGroups: [],
  currentEditingGroup: null,
  groupMembers: [],
  userRegionConfigs: {},
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
  },
  error: null,
  filters: {
    role: 'all',
    department: 'all',
    status: 'all',
    assignedStates: [],
  },
  searchTerm: '',
};

const userManagementSlice = createSlice({
  name: 'userManagement',
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action: PayloadAction<{ type: keyof UserManagementState['loading']; loading: boolean }>) => {
      state.loading[action.payload.type] = action.payload.loading;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Users management
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
      state.loading.users = false;
    },

    addUser: (state, action: PayloadAction<User>) => {
      state.users.push(action.payload);
      state.loading.creating = false;
      state.isCreatingUser = false;
    },

    updateUser: (state, action: PayloadAction<User>) => {
      const index = state.users.findIndex(user => user.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
      state.loading.updating = false;
      state.isEditingUser = false;
      state.currentEditingUser = null;
    },

    deleteUser: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(user => user.id !== action.payload);
      // Also remove from region configs
      delete state.userRegionConfigs[action.payload];
      state.loading.deleting = false;
    },

    setCurrentEditingUser: (state, action: PayloadAction<User | null>) => {
      state.currentEditingUser = action.payload;
      state.isEditingUser = action.payload !== null;
    },

    // User Groups management
    setUserGroups: (state, action: PayloadAction<UserGroup[]>) => {
      state.userGroups = action.payload;
      state.loading.groups = false;
    },

    addUserGroup: (state, action: PayloadAction<UserGroup>) => {
      state.userGroups.push(action.payload);
      state.loading.creating = false;
      state.isCreatingGroup = false;
    },

    updateUserGroup: (state, action: PayloadAction<UserGroup>) => {
      const index = state.userGroups.findIndex(group => group.id === action.payload.id);
      if (index !== -1) {
        state.userGroups[index] = action.payload;
      }
      state.loading.updating = false;
      state.isEditingGroup = false;
      state.currentEditingGroup = null;
    },

    deleteUserGroup: (state, action: PayloadAction<string>) => {
      state.userGroups = state.userGroups.filter(group => group.id !== action.payload);
      // Also remove group memberships
      state.groupMembers = state.groupMembers.filter(member => member.groupId !== action.payload);
      state.loading.deleting = false;
    },

    setCurrentEditingGroup: (state, action: PayloadAction<UserGroup | null>) => {
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
      const group = state.userGroups.find(g => g.id === action.payload.groupId);
      if (group) {
        group.memberCount += 1;
      }
    },

    removeGroupMember: (state, action: PayloadAction<{ userId: string; groupId: string }>) => {
      state.groupMembers = state.groupMembers.filter(
        member => !(member.userId === action.payload.userId && member.groupId === action.payload.groupId)
      );
      // Update group member count
      const group = state.userGroups.find(g => g.id === action.payload.groupId);
      if (group) {
        group.memberCount = Math.max(0, group.memberCount - 1);
      }
    },

    // User Region Configs
    setUserRegionConfigs: (state, action: PayloadAction<Record<string, UserRegionConfig>>) => {
      state.userRegionConfigs = action.payload;
      state.loading.regions = false;
    },

    setUserRegionConfig: (state, action: PayloadAction<{ userId: string; config: UserRegionConfig }>) => {
      state.userRegionConfigs[action.payload.userId] = action.payload.config;
      // Also update the user's assignedStates
      const user = state.users.find(u => u.id === action.payload.userId);
      if (user) {
        user.assignedStates = action.payload.config.assignedStates;
      }
      state.isAssigningRegions = false;
    },

    removeUserRegionConfig: (state, action: PayloadAction<string>) => {
      delete state.userRegionConfigs[action.payload];
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
    setFilters: (state, action: PayloadAction<Partial<UserManagementState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },

    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.searchTerm = '';
    },

    // Reset states
    resetError: (state) => {
      state.error = null;
    },

    resetUserManagement: (state) => {
      return initialState;
    },
  },
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
  resetError,
  resetUserManagement,
} = userManagementSlice.actions;

export default userManagementSlice.reducer;