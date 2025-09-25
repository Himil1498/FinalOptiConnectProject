// Hook for unified geofencing system
import { useState, useEffect, useCallback } from 'react';
import {
  validateGeofence,
  validateMultipleCoordinates,
  preloadGeofenceData,
  createUserGeofenceConfig,
  type UnifiedGeofenceConfig,
  type GeofenceValidationResult,
  type LatLngLiteral
} from '../utils/unifiedGeofencing';

interface GeofenceViolation {
  point: LatLngLiteral;
  timestamp: Date;
  type: string;
  message?: string;
}

interface UseUnifiedGeofencingOptions {
  assignedStates?: string[];
  userId?: string;
  strictMode?: boolean;
  showWarnings?: boolean;
  autoPreload?: boolean;
}

export const useUnifiedGeofencing = (options: UseUnifiedGeofencingOptions = {}) => {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [violations, setViolations] = useState<GeofenceViolation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const config: UnifiedGeofenceConfig = {
    strictMode: options.strictMode ?? true,
    showWarnings: options.showWarnings ?? true,
    allowNearBorder: false,
    borderTolerance: 10,
    assignedStates: options.assignedStates,
    userId: options.userId
  };

  // Preload geofence data
  useEffect(() => {
    if (options.autoPreload !== false) {
      const preload = async () => {
        setIsLoading(true);
        try {
          await preloadGeofenceData();
          setIsDataLoaded(true);
        } catch (error) {
          console.error('Failed to preload geofence data:', error);
        } finally {
          setIsLoading(false);
        }
      };

      preload();
    }
  }, [options.autoPreload]);

  // Validate a single point
  const validatePoint = useCallback(async (
    lat: number,
    lng: number
  ): Promise<GeofenceValidationResult> => {
    try {
      const result = await validateGeofence(lat, lng, config);

      if (!result.isValid) {
        // Log violation
        setViolations(prev => [...prev, {
          point: { lat, lng },
          timestamp: new Date(),
          type: result.violationType || 'unknown_violation',
          message: result.message
        }]);
      }

      return result;
    } catch (error) {
      console.error('Error validating point:', error);
      const errorResult: GeofenceValidationResult = {
        isValid: false,
        message: 'Validation error occurred',
        violationType: 'invalid_coordinates'
      };
      return errorResult;
    }
  }, [config]);

  // Validate multiple coordinates
  const validatePoints = useCallback(async (
    coordinates: LatLngLiteral[]
  ): Promise<GeofenceValidationResult> => {
    try {
      const result = await validateMultipleCoordinates(coordinates, config);

      if (!result.isValid && result.violatingPoint) {
        // Log violation
        setViolations(prev => [...prev, {
          point: result.violatingPoint!,
          timestamp: new Date(),
          type: result.violationType || 'unknown_violation',
          message: result.message
        }]);
      }

      return result;
    } catch (error) {
      console.error('Error validating points:', error);
      const errorResult: GeofenceValidationResult = {
        isValid: false,
        message: 'Validation error occurred',
        violationType: 'invalid_coordinates'
      };
      return errorResult;
    }
  }, [config]);

  // Check if point is valid (boolean only)
  const isPointValid = useCallback(async (
    lat: number,
    lng: number
  ): Promise<boolean> => {
    const result = await validatePoint(lat, lng);
    return result.isValid;
  }, [validatePoint]);

  // Clear violations
  const clearViolations = useCallback(() => {
    setViolations([]);
  }, []);

  // Get recent violations (last N violations)
  const getRecentViolations = useCallback((count: number = 10) => {
    return violations.slice(-count);
  }, [violations]);

  return {
    // Validation functions
    validatePoint,
    validatePoints,
    isPointValid,

    // State
    isDataLoaded,
    isLoading,
    violations,

    // Utility functions
    clearViolations,
    getRecentViolations,

    // Config
    config
  };
};

export default useUnifiedGeofencing;