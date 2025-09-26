// Unified Geofencing System for India with State-based Region Support
// Use Google Maps types directly
export type LatLngLiteral = google.maps.LatLngLiteral;

export interface GeofenceValidationResult {
  isValid: boolean;
  message?: string;
  suggestedAction?: string;
  violationType?: 'outside_india' | 'outside_assigned_region' | 'near_border' | 'invalid_coordinates';
  allowedStates?: string[];
  violatingPoint?: LatLngLiteral;
}

export interface UnifiedGeofenceConfig {
  strictMode: boolean;
  showWarnings: boolean;
  allowNearBorder: boolean;
  borderTolerance: number; // in kilometers
  assignedStates?: string[]; // For user-specific region restrictions
  userId?: string; // For user-specific tracking
}

export interface StateFeature {
  type: 'Feature';
  properties: {
    st_nm: string;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface IndiaGeoData {
  type: 'FeatureCollection';
  features: StateFeature[];
}

export interface IndiaBoundaryData {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: {
      Source: string;
    };
    geometry: {
      type: 'MultiPolygon';
      coordinates: number[][][][];
    };
  }>;
}

// Cache for geo data to avoid multiple loads
let indiaStatesData: IndiaGeoData | null = null;
let indiaBoundaryData: IndiaBoundaryData | null = null;
let isLoadingStates = false;
let isLoadingBoundary = false;

// Major Indian cities for fallback suggestions
export const MAJOR_INDIAN_CITIES = [
  { name: 'New Delhi', lat: 28.6139, lng: 77.2090, state: 'Delhi' },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, state: 'Gujarat' },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, state: 'Rajasthan' },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh' }
];

// India bounds for quick rejection
const INDIA_BOUNDS = {
  north: 37.6,
  south: 6.4,
  east: 97.25,
  west: 68.1
};

// Load India states data
export const loadIndiaStatesData = async (): Promise<IndiaGeoData> => {
  if (indiaStatesData) {
    return indiaStatesData;
  }

  if (isLoadingStates) {
    await new Promise(resolve => {
      const checkLoaded = () => {
        if (indiaStatesData || !isLoadingStates) {
          resolve(true);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    });
    return indiaStatesData!;
  }

  try {
    isLoadingStates = true;
    const response = await fetch('/india.json');
    if (!response.ok) {
      throw new Error(`Failed to load India states data: ${response.status}`);
    }
    indiaStatesData = await response.json();
    isLoadingStates = false;
    return indiaStatesData!;
  } catch (error) {
    isLoadingStates = false;
    console.error('Error loading India states data:', error);
    throw error;
  }
};

// Load India boundary data
export const loadIndiaBoundaryData = async (): Promise<IndiaBoundaryData> => {
  if (indiaBoundaryData) {
    return indiaBoundaryData;
  }

  if (isLoadingBoundary) {
    await new Promise(resolve => {
      const checkLoaded = () => {
        if (indiaBoundaryData || !isLoadingBoundary) {
          resolve(true);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    });
    return indiaBoundaryData!;
  }

  try {
    isLoadingBoundary = true;
    const response = await fetch('/india-boundary.geojson');
    if (!response.ok) {
      throw new Error(`Failed to load India boundary data: ${response.status}`);
    }
    indiaBoundaryData = await response.json();
    isLoadingBoundary = false;
    return indiaBoundaryData!;
  } catch (error) {
    isLoadingBoundary = false;
    console.error('Error loading India boundary data:', error);
    throw error;
  }
};

// Point-in-polygon algorithm using ray casting
export const isPointInPolygon = (point: [number, number], polygon: number[][]): boolean => {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
};

// Check if point is within any polygon in a MultiPolygon
export const isPointInMultiPolygon = (point: [number, number], multiPolygon: number[][][][]): boolean => {
  console.log(`🔺 DEBUG: Checking point ${point} against ${multiPolygon.length} polygons`);

  for (let polyIndex = 0; polyIndex < multiPolygon.length; polyIndex++) {
    const polygon = multiPolygon[polyIndex];
    console.log(`🔺 DEBUG: Checking polygon ${polyIndex + 1}/${multiPolygon.length} with ${polygon.length} rings`);

    // Check outer ring (first ring)
    const outerRing = polygon[0];
    console.log(`🔺 DEBUG: Outer ring has ${outerRing.length} points`);

    if (isPointInPolygon(point, outerRing)) {
      console.log(`✅ DEBUG: Point is in outer ring of polygon ${polyIndex + 1}`);

      // Check if it's in any holes (subsequent rings)
      let inHole = false;
      for (let i = 1; i < polygon.length; i++) {
        if (isPointInPolygon(point, polygon[i])) {
          console.log(`🕳️ DEBUG: Point is in hole ${i} - excluding from polygon`);
          inHole = true;
          break;
        }
      }
      if (!inHole) {
        console.log(`🎉 DEBUG: Point is valid in polygon ${polyIndex + 1} (not in any holes)`);
        return true;
      }
    } else {
      console.log(`❌ DEBUG: Point not in outer ring of polygon ${polyIndex + 1}`);
    }
  }

  console.log('❌ DEBUG: Point not found in any polygon in MultiPolygon');
  return false;
};

// Check if point is within a Polygon or MultiPolygon
export const isPointInGeometry = (point: [number, number], geometry: StateFeature['geometry']): boolean => {
  if (geometry.type === 'Polygon') {
    const coordinates = geometry.coordinates as number[][][];
    // Check outer ring
    if (isPointInPolygon(point, coordinates[0])) {
      // Check if it's in any holes
      for (let i = 1; i < coordinates.length; i++) {
        if (isPointInPolygon(point, coordinates[i])) {
          return false; // Point is in a hole
        }
      }
      return true;
    }
    return false;
  } else if (geometry.type === 'MultiPolygon') {
    return isPointInMultiPolygon(point, geometry.coordinates as number[][][][]);
  }
  return false;
};

// Check if point is within India boundaries (precise)
export const isPointInIndia = async (lat: number, lng: number): Promise<boolean> => {
  // Quick bounds check first
  if (!isWithinIndiaBounds(lat, lng)) {
    console.log('🚫 DEBUG: Point failed basic bounds check');
    return false;
  }

  try {
    console.log('📦 DEBUG: Loading India boundary data...');
    const boundaryData = await loadIndiaBoundaryData();
    const point: [number, number] = [lng, lat]; // GeoJSON uses [lng, lat]
    console.log('🎯 DEBUG: Checking point against boundary polygons:', point);

    console.log('📊 DEBUG: Boundary data loaded, features count:', boundaryData.features.length);

    for (let i = 0; i < boundaryData.features.length; i++) {
      const feature = boundaryData.features[i];
      console.log(`🔍 DEBUG: Checking feature ${i + 1}/${boundaryData.features.length}, type:`, feature.geometry?.type);

      if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
        const multiPolygon = feature.geometry.coordinates;
        console.log(`🔍 DEBUG: MultiPolygon has ${multiPolygon.length} polygons`);

        if (isPointInMultiPolygon(point, multiPolygon)) {
          console.log('✅ DEBUG: Point found in boundary polygon');
          return true;
        }
      }
    }

    console.log('❌ DEBUG: Point not found in any boundary polygon');
    return false;
  } catch (error) {
    console.error('🚨 DEBUG: Boundary data loading error, falling back to bounds:', error);
    return isWithinIndiaBounds(lat, lng);
  }
};

// Check if point is within assigned states
export const isPointInAssignedStates = async (
  lat: number,
  lng: number,
  assignedStates: string[]
): Promise<{ isValid: boolean; state?: string }> => {
  if (assignedStates.length === 0) {
    return { isValid: false };
  }

  try {
    const statesData = await loadIndiaStatesData();
    const point: [number, number] = [lng, lat];

    for (const feature of statesData.features) {
      if (assignedStates.includes(feature.properties.st_nm)) {
        if (isPointInGeometry(point, feature.geometry)) {
          return { isValid: true, state: feature.properties.st_nm };
        }
      }
    }

    return { isValid: false };
  } catch (error) {
    console.error('Error checking assigned states:', error);
    return { isValid: false };
  }
};

// Basic bounds check for performance
export const isWithinIndiaBounds = (lat: number, lng: number): boolean => {
  return (
    lat >= INDIA_BOUNDS.south &&
    lat <= INDIA_BOUNDS.north &&
    lng >= INDIA_BOUNDS.west &&
    lng <= INDIA_BOUNDS.east
  );
};

// Calculate distance using Haversine formula
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Find nearest Indian city with state info
export const findNearestIndianCity = (lat: number, lng: number) => {
  let nearestCity = MAJOR_INDIAN_CITIES[0];
  let minDistance = calculateDistance(lat, lng, nearestCity.lat, nearestCity.lng);

  for (const city of MAJOR_INDIAN_CITIES) {
    const distance = calculateDistance(lat, lng, city.lat, city.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city;
    }
  }

  return { city: nearestCity, distance: minDistance };
};

// Main validation function - UNIFIED SYSTEM
export const validateGeofence = async (
  lat: number,
  lng: number,
  config: UnifiedGeofenceConfig = {
    strictMode: true,
    showWarnings: true,
    allowNearBorder: false,
    borderTolerance: 10
  }
): Promise<GeofenceValidationResult> => {
  console.log('🔍 DEBUG: validateGeofence called with:', { lat, lng });

  // Validate input coordinates
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    console.log('❌ Invalid coordinates detected');
    return {
      isValid: false,
      message: 'Invalid coordinates provided',
      violationType: 'invalid_coordinates',
      suggestedAction: 'Please provide valid latitude and longitude values'
    };
  }

  // Quick bounds check first - if outside India's bounding box, definitely invalid
  const withinBounds = isWithinIndiaBounds(lat, lng);
  console.log('🌍 DEBUG: Bounds check result:', { lat, lng, withinBounds });

  if (!withinBounds) {
    console.log('❌ DEBUG: Outside India bounds - BLOCKING');
    const { city, distance } = findNearestIndianCity(lat, lng);
    return {
      isValid: false,
      message: `Location is outside India boundaries. Nearest Indian city is ${city.name}, ${city.state} (${distance.toFixed(1)} km away)`,
      violationType: 'outside_india',
      suggestedAction: `Try selecting a location within India boundaries, such as near ${city.name}`,
      violatingPoint: { lat, lng }
    };
  }

  try {
    // Check if point is within India's precise boundaries
    console.log('🔍 DEBUG: Checking precise boundaries...');
    const isInIndia = await isPointInIndia(lat, lng);
    console.log('🇮🇳 DEBUG: Point in India:', isInIndia);

    if (!isInIndia) {
      console.log('❌ DEBUG: Outside India territories - BLOCKING');
      const { city, distance } = findNearestIndianCity(lat, lng);
      return {
        isValid: false,
        message: `Location is outside India territories. Nearest Indian city is ${city.name}, ${city.state} (${distance.toFixed(1)} km away)`,
        violationType: 'outside_india',
        suggestedAction: `Please select a location within India boundaries, such as near ${city.name}`,
        violatingPoint: { lat, lng }
      };
    }

    // If assigned states are configured, check state-level restrictions
    if (config.assignedStates && config.assignedStates.length > 0) {
      const stateValidation = await isPointInAssignedStates(lat, lng, config.assignedStates);
      if (!stateValidation.isValid) {
        return {
          isValid: false,
          message: `Location is not within your assigned regions. You can only work in: ${config.assignedStates.join(', ')}`,
          violationType: 'outside_assigned_region',
          suggestedAction: `Please select a location within your assigned states: ${config.assignedStates.join(', ')}`,
          allowedStates: config.assignedStates,
          violatingPoint: { lat, lng }
        };
      }
    }

    // Check border proximity if configured
    if (config.strictMode && !config.allowNearBorder) {
      // For now, we'll skip precise border distance checking as it requires complex calculations
      // In a production system, you'd implement border distance calculations here
    }

    // All validations passed
    console.log('✅ DEBUG: All validations passed - ALLOWING');
    return {
      isValid: true,
      message: config.assignedStates
        ? `Location validated within assigned regions`
        : `Location validated within India boundaries`
    };

  } catch (error) {
    console.error('Error during geofence validation:', error);

    // Fallback to bounds check if precise validation fails
    if (isWithinIndiaBounds(lat, lng)) {
      return {
        isValid: true,
        message: 'Location validated using fallback method (bounds check)'
      };
    } else {
      const { city, distance } = findNearestIndianCity(lat, lng);
      return {
        isValid: false,
        message: `Location validation failed. Nearest Indian city is ${city.name}, ${city.state} (${distance.toFixed(1)} km away)`,
        violationType: 'outside_india',
        suggestedAction: `Please select a location within India boundaries, such as near ${city.name}`,
        violatingPoint: { lat, lng }
      };
    }
  }
};

// Validate multiple coordinates (for polygons, polylines, etc.)
export const validateMultipleCoordinates = async (
  coordinates: LatLngLiteral[],
  config?: UnifiedGeofenceConfig
): Promise<GeofenceValidationResult> => {
  for (let i = 0; i < coordinates.length; i++) {
    const { lat, lng } = coordinates[i];
    const result = await validateGeofence(lat, lng, config);

    if (!result.isValid) {
      return {
        isValid: false,
        message: `Point ${i + 1} validation failed: ${result.message}`,
        violationType: result.violationType,
        suggestedAction: result.suggestedAction,
        allowedStates: result.allowedStates,
        violatingPoint: { lat, lng }
      };
    }
  }

  return {
    isValid: true,
    message: 'All coordinates validated successfully'
  };
};

// Google Maps bounds utilities
export const createBounds = (bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}): google.maps.LatLngBounds => {
  return new google.maps.LatLngBounds(
    new google.maps.LatLng(bounds.south, bounds.west), // Southwest
    new google.maps.LatLng(bounds.north, bounds.east)  // Northeast
  );
};

export const applyIndiaRestriction = (map: google.maps.Map): void => {
  map.setOptions({
    restriction: {
      latLngBounds: createBounds(INDIA_BOUNDS),
      strictBounds: true,
    },
  });
};

// Default configurations
export const DEFAULT_GEOFENCE_CONFIG: UnifiedGeofenceConfig = {
  strictMode: true,
  showWarnings: true,
  allowNearBorder: false,
  borderTolerance: 10
};

export const createUserGeofenceConfig = (
  userId: string,
  assignedStates: string[]
): UnifiedGeofenceConfig => ({
  ...DEFAULT_GEOFENCE_CONFIG,
  assignedStates,
  userId
});

// Preload data for faster validations
export const preloadGeofenceData = async (): Promise<void> => {
  try {
    await Promise.all([
      loadIndiaStatesData(),
      loadIndiaBoundaryData()
    ]);
  } catch (error) {
    console.warn('Failed to preload geofence data:', error);
  }
};

// Get India center point for navigation
export const getIndiaCenterPoint = (): LatLngLiteral & { zoom: number } => ({
  lat: 20.5937,
  lng: 78.9629,
  zoom: 5
});

// Google Maps utility functions
export const convertStringToMapTypeId = (mapType: string): google.maps.MapTypeId => {
  switch (mapType.toLowerCase()) {
    case 'roadmap':
      return google.maps.MapTypeId.ROADMAP;
    case 'satellite':
      return google.maps.MapTypeId.SATELLITE;
    case 'hybrid':
      return google.maps.MapTypeId.HYBRID;
    case 'terrain':
      return google.maps.MapTypeId.TERRAIN;
    default:
      return google.maps.MapTypeId.HYBRID;
  }
};

export const convertMapTypeIdToString = (mapTypeId: google.maps.MapTypeId): string => {
  switch (mapTypeId) {
    case google.maps.MapTypeId.ROADMAP:
      return 'roadmap';
    case google.maps.MapTypeId.SATELLITE:
      return 'satellite';
    case google.maps.MapTypeId.HYBRID:
      return 'hybrid';
    case google.maps.MapTypeId.TERRAIN:
      return 'terrain';
    default:
      return 'hybrid';
  }
};

// Export legacy compatibility functions
export const validateIndiaGeofence = validateGeofence;
export const isPointInIndiaTerritory = isPointInIndia;

const defaultExport = {
  validateGeofence,
  validateMultipleCoordinates,
  isPointInIndia,
  isPointInAssignedStates,
  preloadGeofenceData,
  applyIndiaRestriction,
  createUserGeofenceConfig,
  getIndiaCenterPoint,
  MAJOR_INDIAN_CITIES
};

export default defaultExport;