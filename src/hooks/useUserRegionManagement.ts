// React hook for User Region Management
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getAvailableStates,
  getStatesGroupedByRegion,
  validateStateAssignments,
  createUserRegionConfig,
  validateUserLocation,
  getRecommendedStates,
  updateUserRegionConfig,
  bulkAssignStates,
  REGION_ASSIGNMENT_TEMPLATES,
  type UserRegionConfig,
  type UserRegionPermissions,
  type UserRegionRestrictions,
  type RegionAssignmentResult,
  type RegionValidationResult
} from '../utils/userRegionManagement';
import type { User } from '../types';
import type { LatLngLiteral } from '../utils/unifiedGeofencing';

interface UseUserRegionManagementOptions {
  autoLoadStates?: boolean;
  cacheStates?: boolean;
}

interface UseUserRegionManagementReturn {
  // Data
  availableStates: string[];
  statesGroupedByRegion: Record<string, string[]>;
  regionTemplates: typeof REGION_ASSIGNMENT_TEMPLATES;

  // Loading states
  isLoadingStates: boolean;
  isValidatingAssignments: boolean;
  isCreatingConfig: boolean;

  // Functions
  loadStates: () => Promise<void>;
  validateAssignments: (states: string[]) => Promise<RegionValidationResult>;
  createRegionConfig: (
    userId: string,
    assignedStates: string[],
    permissions?: Partial<UserRegionPermissions>,
    restrictions?: Partial<UserRegionRestrictions>,
    createdBy?: string
  ) => Promise<RegionAssignmentResult>;
  updateRegionConfig: (
    userId: string,
    updates: Partial<UserRegionConfig>,
    updatedBy: string
  ) => Promise<RegionAssignmentResult>;
  validateLocation: (
    userId: string,
    location: LatLngLiteral,
    assignedStates: string[],
    restrictions?: UserRegionRestrictions
  ) => Promise<{
    isAllowed: boolean;
    message: string;
    violationType?: string;
    suggestedLocation?: LatLngLiteral;
  }>;
  getRecommendations: (user: Partial<User>) => {
    recommended: string[];
    reason: string;
  };
  bulkAssign: (
    userIds: string[],
    assignedStates: string[],
    permissions: Partial<UserRegionPermissions>,
    createdBy: string
  ) => Promise<{
    successful: string[];
    failed: Array<{ userId: string; error: string }>;
    summary: string;
  }>;

  // Utilities
  getStatesForTemplate: (templateName: keyof typeof REGION_ASSIGNMENT_TEMPLATES) => Promise<string[]>;
  getPermissionsForTemplate: (templateName: keyof typeof REGION_ASSIGNMENT_TEMPLATES) => UserRegionPermissions;

  // Error state
  error: string | null;
  clearError: () => void;
}

export const useUserRegionManagement = (
  options: UseUserRegionManagementOptions = {}
): UseUserRegionManagementReturn => {
  const {
    autoLoadStates = true,
    cacheStates = true
  } = options;

  // State management
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [statesGroupedByRegion, setStatesGroupedByRegion] = useState<Record<string, string[]>>({});
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isValidatingAssignments, setIsValidatingAssignments] = useState(false);
  const [isCreatingConfig, setIsCreatingConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized templates
  const regionTemplates = useMemo(() => REGION_ASSIGNMENT_TEMPLATES, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load states
  const loadStates = useCallback(async () => {
    if (isLoadingStates || (cacheStates && availableStates.length > 0)) {
      return;
    }

    setIsLoadingStates(true);
    setError(null);

    try {
      const [states, groupedStates] = await Promise.all([
        getAvailableStates(),
        getStatesGroupedByRegion()
      ]);

      setAvailableStates(states);
      setStatesGroupedByRegion(groupedStates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load states';
      setError(errorMessage);
      console.error('Error loading states:', err);
    } finally {
      setIsLoadingStates(false);
    }
  }, [isLoadingStates, cacheStates, availableStates.length]);

  // Auto-load states on mount
  useEffect(() => {
    if (autoLoadStates) {
      loadStates();
    }
  }, [autoLoadStates, loadStates]);

  // Validate assignments
  const validateAssignments = useCallback(async (states: string[]): Promise<RegionValidationResult> => {
    setIsValidatingAssignments(true);
    setError(null);

    try {
      const result = await validateStateAssignments(states);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Validation failed';
      setError(errorMessage);
      return {
        isValid: false,
        message: errorMessage,
        violationType: 'validation_error'
      };
    } finally {
      setIsValidatingAssignments(false);
    }
  }, []);

  // Create region config
  const createRegionConfig = useCallback(async (
    userId: string,
    assignedStates: string[],
    permissions: Partial<UserRegionPermissions> = {},
    restrictions: Partial<UserRegionRestrictions> = {},
    createdBy: string = 'system'
  ): Promise<RegionAssignmentResult> => {
    setIsCreatingConfig(true);
    setError(null);

    try {
      const result = await createUserRegionConfig(
        userId,
        assignedStates,
        permissions,
        restrictions,
        createdBy
      );

      if (!result.success && result.validationErrors) {
        setError(`Validation failed: ${result.validationErrors.join(', ')}`);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create region config';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
        assignedStates: [],
        geofenceConfig: {
          strictMode: true,
          showWarnings: true,
          allowNearBorder: false,
          borderTolerance: 10,
          assignedStates: [],
          userId
        }
      };
    } finally {
      setIsCreatingConfig(false);
    }
  }, []);

  // Update region config
  const updateRegionConfig = useCallback(async (
    userId: string,
    updates: Partial<UserRegionConfig>,
    updatedBy: string
  ): Promise<RegionAssignmentResult> => {
    setError(null);

    try {
      const result = await updateUserRegionConfig(userId, updates, updatedBy);

      if (!result.success && result.validationErrors) {
        setError(`Update failed: ${result.validationErrors.join(', ')}`);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update region config';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
        assignedStates: [],
        geofenceConfig: {
          strictMode: true,
          showWarnings: true,
          allowNearBorder: false,
          borderTolerance: 10,
          assignedStates: updates.assignedStates || [],
          userId
        }
      };
    }
  }, []);

  // Validate location
  const validateLocation = useCallback(async (
    userId: string,
    location: LatLngLiteral,
    assignedStates: string[],
    restrictions: UserRegionRestrictions = {
      strictGeofencing: true,
      allowNearBorder: false,
      borderTolerance: 10
    }
  ) => {
    setError(null);

    try {
      return await validateUserLocation(userId, location, assignedStates, restrictions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Location validation failed';
      setError(errorMessage);
      return {
        isAllowed: false,
        message: errorMessage,
        violationType: 'validation_error'
      };
    }
  }, []);

  // Get recommendations
  const getRecommendations = useCallback((user: Partial<User>) => {
    return getRecommendedStates(user);
  }, []);

  // Bulk assign
  const bulkAssign = useCallback(async (
    userIds: string[],
    assignedStates: string[],
    permissions: Partial<UserRegionPermissions>,
    createdBy: string
  ) => {
    setError(null);

    try {
      return await bulkAssignStates(userIds, assignedStates, permissions, createdBy);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bulk assignment failed';
      setError(errorMessage);
      return {
        successful: [],
        failed: userIds.map(userId => ({ userId, error: errorMessage })),
        summary: `Bulk assignment failed: ${errorMessage}`
      };
    }
  }, []);

  // Get states for template
  const getStatesForTemplate = useCallback(async (templateName: keyof typeof REGION_ASSIGNMENT_TEMPLATES) => {
    try {
      const template = regionTemplates[templateName];
      return await template.getStates();
    } catch (err) {
      console.error(`Error getting states for template ${templateName}:`, err);
      return [];
    }
  }, [regionTemplates]);

  // Get permissions for template
  const getPermissionsForTemplate = useCallback((templateName: keyof typeof REGION_ASSIGNMENT_TEMPLATES) => {
    return regionTemplates[templateName].permissions;
  }, [regionTemplates]);

  return {
    // Data
    availableStates,
    statesGroupedByRegion,
    regionTemplates,

    // Loading states
    isLoadingStates,
    isValidatingAssignments,
    isCreatingConfig,

    // Functions
    loadStates,
    validateAssignments,
    createRegionConfig,
    updateRegionConfig,
    validateLocation,
    getRecommendations,
    bulkAssign,

    // Utilities
    getStatesForTemplate,
    getPermissionsForTemplate,

    // Error state
    error,
    clearError
  };
};

export default useUserRegionManagement;