import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useMemo } from 'react';
import { RootState, AppDispatch } from '../store';
import {
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
} from '../store/slices/userManagementSlice';
import { User, UserGroup, GroupMember } from '../types';
import { useUserRegionManagement } from './useUserRegionManagement';
import { createUserRegionConfig, getRecommendedStates, UserRegionPermissions, UserRegionRestrictions } from '../utils/userRegionManagement';

// Mock data for development - replace with actual API calls
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'admin@opticonnect.com',
    name: 'Admin User',
    role: 'admin',
    permissions: ['all'],
    assignedStates: [], // Admin has access to all states
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    email: 'manager@opticonnect.com',
    name: 'Regional Manager',
    role: 'manager',
    permissions: ['read', 'write', 'manage_users', 'view_analytics', 'manage_equipment'],
    assignedStates: ['Maharashtra', 'Gujarat'],
    department: 'Operations',
    phoneNumber: '+91-98765-43210',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    email: 'tech@opticonnect.com',
    name: 'Field Technician',
    role: 'technician',
    permissions: ['read', 'write', 'manage_equipment', 'update_status'],
    assignedStates: ['Maharashtra'],
    department: 'Engineering',
    phoneNumber: '+91-98765-43212',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    email: 'user@opticonnect.com',
    name: 'Regular User',
    role: 'viewer',
    permissions: ['read', 'view_basic_analytics'],
    assignedStates: ['Maharashtra', 'Gujarat', 'Rajasthan'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const MOCK_USER_GROUPS: UserGroup[] = [
  {
    id: 'group-1',
    name: 'Operations Team',
    description: 'Main operations team for network management',
    level: 1,
    path: ['group-1'],
    permissions: ['read', 'write', 'manage_equipment'],
    assignedStates: ['Maharashtra', 'Gujarat'],
    color: '#3b82f6',
    icon: '👥',
    isActive: true,
    memberCount: 2,
    childGroups: ['group-2'],
    createdBy: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'group-2',
    name: 'Field Engineers',
    description: 'Field engineering team under operations',
    parentId: 'group-1',
    level: 2,
    path: ['group-1', 'group-2'],
    permissions: ['read', 'write', 'manage_equipment'],
    assignedStates: ['Maharashtra'],
    color: '#10b981',
    icon: '🔧',
    isActive: true,
    memberCount: 1,
    childGroups: [],
    createdBy: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
  role: User['role'];
  department?: string;
  // New basic fields
  employeeId?: string;
  gender?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    pinCode: string;
  };
  supervisorName?: string;
  officeLocation?: string;
  profilePicture?: File | null;
  assignedStates: string[];
  parentUserId?: string; // For hierarchy
  // Multiple managers/reporting structure
  reportingManagers?: string[];
  permissions: UserRegionPermissions;
  restrictions: UserRegionRestrictions;
  groupIds?: string[];
}

export const useUserManagement = () => {
  const dispatch = useDispatch<AppDispatch>();
  const userManagementState = useSelector((state: RootState) => state.userManagement);
  const { user: currentUser } = useSelector((state: RootState) => state.auth);

  // Use the region management hook
  const regionManagement = useUserRegionManagement();

  // Get filtered users based on search and filters
  const filteredUsers = useMemo(() => {
    let filtered = userManagementState.users;

    // Search filter
    if (userManagementState.searchTerm) {
      const search = userManagementState.searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        (user.department && user.department.toLowerCase().includes(search)) ||
        (user.phoneNumber && user.phoneNumber.includes(search))
      );
    }

    // Role filter
    if (userManagementState.filters.role !== 'all') {
      filtered = filtered.filter(user => user.role === userManagementState.filters.role);
    }

    // Department filter
    if (userManagementState.filters.department !== 'all') {
      filtered = filtered.filter(user => user.department === userManagementState.filters.department);
    }

    // Status filter
    if (userManagementState.filters.status !== 'all') {
      const isActive = userManagementState.filters.status === 'active';
      filtered = filtered.filter(user => user.isActive === isActive);
    }

    // Assigned states filter
    if (userManagementState.filters.assignedStates.length > 0) {
      filtered = filtered.filter(user =>
        user.assignedStates?.some(state =>
          userManagementState.filters.assignedStates.includes(state)
        )
      );
    }

    return filtered;
  }, [userManagementState.users, userManagementState.searchTerm, userManagementState.filters]);

  // Get user statistics
  const userStats = useMemo(() => {
    const total = userManagementState.users.length;
    const active = userManagementState.users.filter(u => u.isActive).length;
    const byRole = userManagementState.users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, active, inactive: total - active, byRole };
  }, [userManagementState.users]);

  // Load initial data
  const loadUsers = useCallback(async () => {
    dispatch(setLoading({ type: 'users', loading: true }));
    try {
      // In production, this would be an API call
      // const users = await userAPI.getUsers();
      dispatch(setUsers(MOCK_USERS));
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Failed to load users'));
    }
  }, [dispatch]);

  const loadUserGroups = useCallback(async () => {
    dispatch(setLoading({ type: 'groups', loading: true }));
    try {
      // In production, this would be an API call
      // const groups = await userGroupAPI.getGroups();
      dispatch(setUserGroups(MOCK_USER_GROUPS));
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Failed to load user groups'));
    }
  }, [dispatch]);

  // User management operations
  const createUser = useCallback(async (userData: CreateUserData): Promise<boolean> => {
    dispatch(setLoading({ type: 'creating', loading: true }));
    try {
      // Validate passwords match
      if (userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Validate email uniqueness
      const existingUser = userManagementState.users.find(u => u.email === userData.email);
      if (existingUser) {
        throw new Error('Email already exists');
      }

      // Validate assigned states
      const stateValidation = await regionManagement.validateAssignments(userData.assignedStates);
      if (!stateValidation.isValid) {
        throw new Error(stateValidation.message);
      }

      // Create new user
      const newUser: User = {
        id: `user-${Date.now()}`, // In production, this would come from backend
        name: userData.name,
        email: userData.email,
        role: userData.role,
        permissions: Object.keys(userData.permissions)
          .filter(key => userData.permissions[key as keyof UserRegionPermissions])
          .concat(['read']), // Basic read permission for all users
        assignedStates: userData.assignedStates,
        department: userData.department,
        phoneNumber: userData.phoneNumber,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create region configuration
      const regionResult = await regionManagement.createRegionConfig(
        newUser.id,
        userData.assignedStates,
        userData.permissions,
        userData.restrictions,
        currentUser?.id || 'system'
      );

      if (!regionResult.success) {
        throw new Error(regionResult.message);
      }

      // Add user to store
      dispatch(addUser(newUser));

      // Store region configuration
      dispatch(setUserRegionConfig({
        userId: newUser.id,
        config: {
          userId: newUser.id,
          assignedStates: userData.assignedStates,
          permissions: userData.permissions,
          restrictions: userData.restrictions,
          createdBy: currentUser?.id || 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }));

      dispatch(setError(null));
      return true;
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Failed to create user'));
      dispatch(setLoading({ type: 'creating', loading: false }));
      return false;
    }
  }, [dispatch, userManagementState.users, regionManagement, currentUser]);

  const editUser = useCallback((user: User) => {
    dispatch(setCurrentEditingUser(user));
  }, [dispatch]);

  const updateUserData = useCallback(async (userId: string, updates: Partial<User>): Promise<boolean> => {
    dispatch(setLoading({ type: 'updating', loading: true }));
    try {
      const user = userManagementState.users.find(u => u.id === userId);
      if (!user) {
        throw new Error('User not found');
      }

      const updatedUser: User = {
        ...user,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // If assigned states changed, update region configuration
      if (updates.assignedStates) {
        const stateValidation = await regionManagement.validateAssignments(updates.assignedStates);
        if (!stateValidation.isValid) {
          throw new Error(stateValidation.message);
        }
      }

      dispatch(updateUser(updatedUser));
      dispatch(setError(null));
      return true;
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Failed to update user'));
      dispatch(setLoading({ type: 'updating', loading: false }));
      return false;
    }
  }, [dispatch, userManagementState.users, regionManagement]);

  const removeUser = useCallback(async (userId: string): Promise<boolean> => {
    dispatch(setLoading({ type: 'deleting', loading: true }));
    try {
      // Remove user
      dispatch(deleteUser(userId));
      // Remove region configuration
      dispatch(removeUserRegionConfig(userId));
      dispatch(setError(null));
      return true;
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Failed to delete user'));
      dispatch(setLoading({ type: 'deleting', loading: false }));
      return false;
    }
  }, [dispatch]);

  // Get role-based recommendations
  const getUserRecommendations = useCallback((partialUser: Partial<User>) => {
    return getRecommendedStates(partialUser);
  }, []);

  // Get available parent users for hierarchy
  const getAvailableParentUsers = useCallback(() => {
    return userManagementState.users.filter(user =>
      user.role === 'admin' || user.role === 'manager'
    );
  }, [userManagementState.users]);

  return {
    // State
    ...userManagementState,
    filteredUsers,
    userStats,

    // Region management integration
    ...regionManagement,

    // Operations
    loadUsers,
    loadUserGroups,
    createUser,
    editUser,
    updateUser: updateUserData,
    deleteUser: removeUser,
    getUserRecommendations,
    getAvailableParentUsers,

    // UI Actions
    setCreatingUser: (creating: boolean) => dispatch(setCreatingUser(creating)),
    setCreatingGroup: (creating: boolean) => dispatch(setCreatingGroup(creating)),
    setFilters: (filters: Parameters<typeof setFilters>[0]) => dispatch(setFilters(filters)),
    setSearchTerm: (term: string) => dispatch(setSearchTerm(term)),
    clearFilters: () => dispatch(clearFilters()),
    resetError: () => dispatch(resetError()),
  };
};