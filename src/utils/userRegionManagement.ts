// User Region Management System integrated with Unified Geofencing
import {
  loadIndiaStatesData,
  createUserGeofenceConfig,
  validateGeofence,
  MAJOR_INDIAN_CITIES,
  type UnifiedGeofenceConfig,
  type StateFeature,
  type IndiaGeoData,
  type LatLngLiteral
} from './unifiedGeofencing';
import type { User } from '../types';

export interface UserRegionConfig {
  userId: string;
  assignedStates: string[];
  permissions: UserRegionPermissions;
  restrictions: UserRegionRestrictions;
  validUntil?: string; // ISO date string
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRegionPermissions {
  canViewAllData: boolean;
  canEditInAssignedRegions: boolean;
  canCreateInAssignedRegions: boolean;
  canDeleteInAssignedRegions: boolean;
  canExportData: boolean;
  canShareData: boolean;
  toolsAccess: {
    distanceMeasurement: boolean;
    polygonDrawing: boolean;
    elevationAnalysis: boolean;
    infrastructureManagement: boolean;
  };
}

export interface UserRegionRestrictions {
  strictGeofencing: boolean; // If true, user cannot work outside assigned regions at all
  allowNearBorder: boolean; // Allow work near region borders
  borderTolerance: number; // Tolerance in kilometers for border work
  timeRestrictions?: {
    allowedHours: [number, number]; // [start, end] in 24h format
    allowedDays: number[]; // 0-6, 0 = Sunday
    timezone: string;
  };
  ipRestrictions?: string[]; // Allowed IP ranges
}

export interface RegionAssignmentResult {
  success: boolean;
  message: string;
  assignedStates: string[];
  geofenceConfig: UnifiedGeofenceConfig;
  validationErrors?: string[];
}

export interface RegionValidationResult {
  isValid: boolean;
  message: string;
  violationType?: 'invalid_state' | 'duplicate_state' | 'no_states' | 'permission_denied' | 'validation_error';
  invalidStates?: string[];
  suggestions?: string[];
}

// Cache for India states data
let indiaStatesCache: IndiaGeoData | null = null;

// Get all available Indian states for assignment
export const getAvailableStates = async (): Promise<string[]> => {
  try {
    if (!indiaStatesCache) {
      indiaStatesCache = await loadIndiaStatesData();
    }

    return indiaStatesCache.features.map(feature => feature.properties.st_nm).sort();
  } catch (error) {
    console.error('Error loading available states:', error);
    return [];
  }
};

// Get states grouped by regions for easier assignment
export const getStatesGroupedByRegion = async (): Promise<Record<string, string[]>> => {
  const states = await getAvailableStates();

  // Group states by geographical regions
  const regions: Record<string, string[]> = {
    'North': [
      'Delhi',
      'Haryana',
      'Himachal Pradesh',
      'Jammu and Kashmir',
      'Ladakh',
      'Punjab',
      'Uttarakhand',
      'Uttar Pradesh'
    ],
    'South': [
      'Andhra Pradesh',
      'Karnataka',
      'Kerala',
      'Tamil Nadu',
      'Telangana',
      'Puducherry'
    ],
    'East': [
      'West Bengal',
      'Jharkhand',
      'Odisha',
      'Bihar'
    ],
    'West': [
      'Gujarat',
      'Maharashtra',
      'Rajasthan',
      'Goa',
      'Daman and Diu',
      'Dadra and Nagar Haveli'
    ],
    'Northeast': [
      'Assam',
      'Meghalaya',
      'Manipur',
      'Mizoram',
      'Nagaland',
      'Tripura',
      'Arunachal Pradesh',
      'Sikkim'
    ],
    'Central': [
      'Madhya Pradesh',
      'Chhattisgarh'
    ],
    'Islands': [
      'Andaman and Nicobar Islands',
      'Lakshadweep'
    ]
  };

  // Filter out states that don't exist in the actual data
  const filteredRegions: Record<string, string[]> = {};
  for (const [region, regionStates] of Object.entries(regions)) {
    filteredRegions[region] = regionStates.filter(state => states.includes(state));
  }

  return filteredRegions;
};

// Validate state assignments
export const validateStateAssignments = async (states: string[]): Promise<RegionValidationResult> => {
  if (!states || states.length === 0) {
    return {
      isValid: false,
      message: 'At least one state must be assigned',
      violationType: 'no_states'
    };
  }

  const availableStates = await getAvailableStates();
  const invalidStates = states.filter(state => !availableStates.includes(state));

  if (invalidStates.length > 0) {
    // Find similar states for suggestions
    const suggestions = invalidStates.map(invalid => {
      const similar = availableStates.find(valid =>
        valid.toLowerCase().includes(invalid.toLowerCase()) ||
        invalid.toLowerCase().includes(valid.toLowerCase())
      );
      return similar || null;
    }).filter(Boolean) as string[];

    return {
      isValid: false,
      message: `Invalid states found: ${invalidStates.join(', ')}`,
      violationType: 'invalid_state',
      invalidStates,
      suggestions
    };
  }

  // Check for duplicates
  const uniqueStates = Array.from(new Set(states));
  if (uniqueStates.length !== states.length) {
    return {
      isValid: false,
      message: 'Duplicate states found in assignment',
      violationType: 'duplicate_state'
    };
  }

  return {
    isValid: true,
    message: `Successfully validated ${states.length} state assignments`
  };
};

// Create user region configuration
export const createUserRegionConfig = async (
  userId: string,
  assignedStates: string[],
  permissions: Partial<UserRegionPermissions> = {},
  restrictions: Partial<UserRegionRestrictions> = {},
  createdBy: string
): Promise<RegionAssignmentResult> => {
  try {
    // Validate state assignments
    const validation = await validateStateAssignments(assignedStates);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.message,
        assignedStates: [],
        geofenceConfig: createUserGeofenceConfig(userId, []),
        validationErrors: validation.invalidStates
      };
    }

    // Create default permissions
    const defaultPermissions: UserRegionPermissions = {
      canViewAllData: false,
      canEditInAssignedRegions: true,
      canCreateInAssignedRegions: true,
      canDeleteInAssignedRegions: false,
      canExportData: false,
      canShareData: false,
      toolsAccess: {
        distanceMeasurement: true,
        polygonDrawing: true,
        elevationAnalysis: true,
        infrastructureManagement: false
      },
      ...permissions
    };

    // Create default restrictions
    const defaultRestrictions: UserRegionRestrictions = {
      strictGeofencing: true,
      allowNearBorder: false,
      borderTolerance: 10,
      ...restrictions
    };

    // Create geofence configuration
    const geofenceConfig = createUserGeofenceConfig(userId, assignedStates);

    // Create user region configuration
    const userRegionConfig: UserRegionConfig = {
      userId,
      assignedStates: Array.from(new Set(assignedStates)), // Remove duplicates
      permissions: defaultPermissions,
      restrictions: defaultRestrictions,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      success: true,
      message: `Successfully assigned ${assignedStates.length} states to user`,
      assignedStates: userRegionConfig.assignedStates,
      geofenceConfig
    };

  } catch (error) {
    console.error('Error creating user region config:', error);
    return {
      success: false,
      message: 'Failed to create user region configuration',
      assignedStates: [],
      geofenceConfig: createUserGeofenceConfig(userId, [])
    };
  }
};

// Validate user location against their assigned regions
export const validateUserLocation = async (
  userId: string,
  location: LatLngLiteral,
  assignedStates: string[],
  restrictions: UserRegionRestrictions = {
    strictGeofencing: true,
    allowNearBorder: false,
    borderTolerance: 10
  }
): Promise<{
  isAllowed: boolean;
  message: string;
  violationType?: string;
  suggestedLocation?: LatLngLiteral;
}> => {
  try {
    // Create user-specific geofence config
    const config = createUserGeofenceConfig(userId, assignedStates);
    config.allowNearBorder = restrictions.allowNearBorder;
    config.borderTolerance = restrictions.borderTolerance;

    // Validate location
    const result = await validateGeofence(location.lat, location.lng, config);

    if (result.isValid) {
      return {
        isAllowed: true,
        message: result.message || 'Location is within assigned regions'
      };
    }

    // Find suggested location in assigned states
    let suggestedLocation: LatLngLiteral | undefined;

    if (assignedStates.length > 0) {
      // Find a major city in the assigned states
      const assignedCities = MAJOR_INDIAN_CITIES.filter(city =>
        assignedStates.includes(city.state)
      );

      if (assignedCities.length > 0) {
        const nearestCity = assignedCities[0]; // Could implement distance calculation
        suggestedLocation = {
          lat: nearestCity.lat,
          lng: nearestCity.lng
        };
      }
    }

    return {
      isAllowed: false,
      message: result.message || 'Location is outside assigned regions',
      violationType: result.violationType,
      suggestedLocation
    };

  } catch (error) {
    console.error('Error validating user location:', error);
    return {
      isAllowed: false,
      message: 'Error validating location',
      violationType: 'validation_error'
    };
  }
};

// Get recommended states for a user based on their role or department
export const getRecommendedStates = (user: Partial<User>): {
  recommended: string[];
  reason: string;
} => {
  // Role-based recommendations
  switch (user.role) {
    case 'admin':
      return {
        recommended: [], // Admins can be assigned any states
        reason: 'Administrators can be assigned to any region as needed'
      };

    case 'manager':
      return {
        recommended: ['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu'], // Major business hubs
        reason: 'Managers typically oversee major business regions'
      };

    case 'technician':
      return {
        recommended: ['Delhi', 'Haryana', 'Uttar Pradesh'], // Northern region example
        reason: 'Field technicians usually work in specific regional clusters'
      };

    case 'viewer':
      return {
        recommended: ['Delhi'], // Limited to one state
        reason: 'Viewers typically have limited regional access'
      };

    default:
      return {
        recommended: ['Delhi'],
        reason: 'Default assignment for new users'
      };
  }
};

// Update user region assignments
export const updateUserRegionConfig = async (
  userId: string,
  updates: Partial<UserRegionConfig>,
  updatedBy: string
): Promise<RegionAssignmentResult> => {
  try {
    if (updates.assignedStates) {
      const validation = await validateStateAssignments(updates.assignedStates);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message,
          assignedStates: [],
          geofenceConfig: createUserGeofenceConfig(userId, []),
          validationErrors: validation.invalidStates
        };
      }
    }

    // Create updated geofence configuration if states changed
    const geofenceConfig = updates.assignedStates
      ? createUserGeofenceConfig(userId, updates.assignedStates)
      : createUserGeofenceConfig(userId, []);

    return {
      success: true,
      message: 'User region configuration updated successfully',
      assignedStates: updates.assignedStates || [],
      geofenceConfig
    };

  } catch (error) {
    console.error('Error updating user region config:', error);
    return {
      success: false,
      message: 'Failed to update user region configuration',
      assignedStates: [],
      geofenceConfig: createUserGeofenceConfig(userId, [])
    };
  }
};

// Bulk assign states to multiple users
export const bulkAssignStates = async (
  userIds: string[],
  assignedStates: string[],
  permissions: Partial<UserRegionPermissions>,
  createdBy: string
): Promise<{
  successful: string[];
  failed: Array<{ userId: string; error: string }>;
  summary: string;
}> => {
  const successful: string[] = [];
  const failed: Array<{ userId: string; error: string }> = [];

  // Validate states once for all users
  const validation = await validateStateAssignments(assignedStates);
  if (!validation.isValid) {
    return {
      successful: [],
      failed: userIds.map(userId => ({ userId, error: validation.message })),
      summary: `Bulk assignment failed: ${validation.message}`
    };
  }

  // Process each user
  for (const userId of userIds) {
    try {
      const result = await createUserRegionConfig(
        userId,
        assignedStates,
        permissions,
        {},
        createdBy
      );

      if (result.success) {
        successful.push(userId);
      } else {
        failed.push({ userId, error: result.message });
      }
    } catch (error) {
      failed.push({
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return {
    successful,
    failed,
    summary: `Bulk assignment completed: ${successful.length} successful, ${failed.length} failed`
  };
};

// Default region assignment templates
export const REGION_ASSIGNMENT_TEMPLATES = {
  'Full India Access': {
    description: 'Access to all Indian states and union territories',
    getStates: async () => await getAvailableStates(),
    permissions: {
      canViewAllData: true,
      canEditInAssignedRegions: true,
      canCreateInAssignedRegions: true,
      canDeleteInAssignedRegions: true,
      canExportData: true,
      canShareData: true,
      toolsAccess: {
        distanceMeasurement: true,
        polygonDrawing: true,
        elevationAnalysis: true,
        infrastructureManagement: true
      }
    } as UserRegionPermissions
  },
  'Northern Region': {
    description: 'Access to northern Indian states',
    getStates: async () => {
      const grouped = await getStatesGroupedByRegion();
      return grouped['North'] || [];
    },
    permissions: {
      canViewAllData: false,
      canEditInAssignedRegions: true,
      canCreateInAssignedRegions: true,
      canDeleteInAssignedRegions: false,
      canExportData: true,
      canShareData: false,
      toolsAccess: {
        distanceMeasurement: true,
        polygonDrawing: true,
        elevationAnalysis: true,
        infrastructureManagement: true
      }
    } as UserRegionPermissions
  },
  'Metro Cities Only': {
    description: 'Access to major metropolitan areas only',
    getStates: async () => ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'West Bengal'],
    permissions: {
      canViewAllData: false,
      canEditInAssignedRegions: true,
      canCreateInAssignedRegions: true,
      canDeleteInAssignedRegions: false,
      canExportData: false,
      canShareData: false,
      toolsAccess: {
        distanceMeasurement: true,
        polygonDrawing: false,
        elevationAnalysis: true,
        infrastructureManagement: false
      }
    } as UserRegionPermissions
  },
  'Viewer Only': {
    description: 'View-only access to limited regions',
    getStates: async () => ['Delhi'],
    permissions: {
      canViewAllData: false,
      canEditInAssignedRegions: false,
      canCreateInAssignedRegions: false,
      canDeleteInAssignedRegions: false,
      canExportData: false,
      canShareData: false,
      toolsAccess: {
        distanceMeasurement: false,
        polygonDrawing: false,
        elevationAnalysis: false,
        infrastructureManagement: false
      }
    } as UserRegionPermissions
  }
};

export default {
  getAvailableStates,
  getStatesGroupedByRegion,
  validateStateAssignments,
  createUserRegionConfig,
  validateUserLocation,
  getRecommendedStates,
  updateUserRegionConfig,
  bulkAssignStates,
  REGION_ASSIGNMENT_TEMPLATES
};