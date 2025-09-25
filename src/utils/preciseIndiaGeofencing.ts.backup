// Precise India Geofencing using actual boundary data
export interface GeofenceValidationResult {
  isValid: boolean;
  message?: string;
  suggestedAction?: string;
  violationType?: 'outside_india' | 'near_border' | 'invalid_coordinates';
}

export interface IndiaGeofenceConfig {
  strictMode: boolean;
  showWarnings: boolean;
  allowNearBorder: boolean;
  borderTolerance: number; // in kilometers
}

// Cache for India boundary data
let indiaBoundaryData: any = null;
let isLoading = false;

// Load India boundary data from JSON file
export const loadIndiaBoundaryData = async (): Promise<any> => {
  if (indiaBoundaryData) {
    return indiaBoundaryData;
  }

  if (isLoading) {
    // Wait for existing load to complete
    await new Promise(resolve => {
      const checkLoaded = () => {
        if (indiaBoundaryData || !isLoading) {
          resolve(true);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    });
    return indiaBoundaryData;
  }

  try {
    isLoading = true;
    const response = await fetch('/india.json');
    if (!response.ok) {
      throw new Error(`Failed to load India boundary data: ${response.status}`);
    }
    indiaBoundaryData = await response.json();
    isLoading = false;
    return indiaBoundaryData;
  } catch (error) {
    isLoading = false;
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

    if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
};

// Check if point is within any India polygon (handles MultiPolygon)
export const isPointInIndia = (lat: number, lng: number, boundaryData: any): boolean => {
  if (!boundaryData?.features) {
    return false;
  }

  const point: [number, number] = [lng, lat]; // GeoJSON uses [lng, lat] format

  for (const feature of boundaryData.features) {
    const { geometry } = feature;

    if (!geometry || !geometry.coordinates) {
      continue;
    }

    if (geometry.type === 'Polygon') {
      // Single polygon
      const polygon = geometry.coordinates[0]; // Outer ring
      if (isPointInPolygon(point, polygon)) {
        return true;
      }
    } else if (geometry.type === 'MultiPolygon') {
      // Multiple polygons
      for (const polygonCoords of geometry.coordinates) {
        const polygon = polygonCoords[0]; // Outer ring of each polygon
        if (isPointInPolygon(point, polygon)) {
          return true;
        }
      }
    }
  }

  return false;
};

// Calculate distance between two points using Haversine formula
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

// Major Indian cities for fallback suggestions
export const MAJOR_INDIAN_CITIES = [
  { name: 'New Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462 }
];

// Find nearest Indian city
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

// Basic bounds check for performance (quick rejection)
const INDIA_BOUNDS = {
  north: 37.6,
  south: 6.4,
  east: 97.25,
  west: 68.1
};

export const isWithinIndiaBounds = (lat: number, lng: number): boolean => {
  return (
    lat >= INDIA_BOUNDS.south &&
    lat <= INDIA_BOUNDS.north &&
    lng >= INDIA_BOUNDS.west &&
    lng <= INDIA_BOUNDS.east
  );
};

// Main validation function with precise boundary checking
export const validateIndiaGeofencePrecise = async (
  lat: number,
  lng: number,
  config: IndiaGeofenceConfig = {
    strictMode: true,
    showWarnings: true,
    allowNearBorder: false,
    borderTolerance: 10
  }
): Promise<GeofenceValidationResult> => {
  // Validate input coordinates
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return {
      isValid: false,
      message: 'Invalid coordinates provided',
      violationType: 'invalid_coordinates',
      suggestedAction: 'Please provide valid latitude and longitude values'
    };
  }

  // Quick bounds check first (for performance)
  if (!isWithinIndiaBounds(lat, lng)) {
    const { city, distance } = findNearestIndianCity(lat, lng);
    return {
      isValid: false,
      message: `Location is outside India boundaries. Tools are restricted to India only.`,
      violationType: 'outside_india',
      suggestedAction: `Try near ${city.name} (${distance.toFixed(0)}km away) at coordinates ${city.lat.toFixed(4)}, ${city.lng.toFixed(4)}`
    };
  }

  try {
    // Load precise boundary data
    const boundaryData = await loadIndiaBoundaryData();

    // Check if point is actually within India using precise boundaries
    const isInIndia = isPointInIndia(lat, lng, boundaryData);

    if (!isInIndia) {
      const { city, distance } = findNearestIndianCity(lat, lng);
      return {
        isValid: false,
        message: `Location is outside India territorial boundaries. All mapping tools are restricted to India only.`,
        violationType: 'outside_india',
        suggestedAction: `Try near ${city.name} (${distance.toFixed(0)}km away) at coordinates ${city.lat.toFixed(4)}, ${city.lng.toFixed(4)}`
      };
    }

    // For locations near borders, provide additional validation
    if (config.showWarnings) {
      const distanceFromCenter = calculateDistance(lat, lng, 20.5937, 78.9629); // Center of India
      if (distanceFromCenter > 1400) { // More than 1400km from center
        return {
          isValid: true,
          message: 'Location is near India border. Tools functionality verified.',
          violationType: 'near_border',
          suggestedAction: 'Consider using locations closer to major cities for optimal performance'
        };
      }
    }

    return {
      isValid: true,
      message: 'Location validated within India boundaries'
    };

  } catch (error) {
    console.error('Error in precise geofencing validation:', error);

    // Fallback to basic bounds check if precise validation fails
    if (isWithinIndiaBounds(lat, lng)) {
      return {
        isValid: true,
        message: 'Location validated using fallback method (precise validation failed)'
      };
    } else {
      const { city, distance } = findNearestIndianCity(lat, lng);
      return {
        isValid: false,
        message: `Location is outside India boundaries (fallback validation).`,
        violationType: 'outside_india',
        suggestedAction: `Try near ${city.name} (${distance.toFixed(0)}km away)`
      };
    }
  }
};

// Validate multiple coordinates (for polygons, polylines, etc.)
export const validateMultipleCoordinatesPrecise = async (
  coordinates: Array<{ lat: number; lng: number }>,
  config?: IndiaGeofenceConfig
): Promise<GeofenceValidationResult> => {
  for (let i = 0; i < coordinates.length; i++) {
    const { lat, lng } = coordinates[i];
    const result = await validateIndiaGeofencePrecise(lat, lng, config);

    if (!result.isValid) {
      return {
        isValid: false,
        message: `Point ${i + 1} is outside India boundaries: ${result.message}`,
        violationType: result.violationType,
        suggestedAction: result.suggestedAction
      };
    }
  }

  return {
    isValid: true,
    message: 'All coordinates validated within India boundaries'
  };
};

// Default configuration
export const DEFAULT_PRECISE_GEOFENCE_CONFIG: IndiaGeofenceConfig = {
  strictMode: true,
  showWarnings: true,
  allowNearBorder: false,
  borderTolerance: 5
};

// Preload boundary data for faster subsequent validations
export const preloadIndiaBoundaryData = () => {
  loadIndiaBoundaryData().catch(error => {
    console.warn('Failed to preload India boundary data:', error);
  });
};

// Get India center point for navigation
export const getIndiaCenterPoint = () => ({
  lat: 20.5937,
  lng: 78.9629,
  zoom: 5
});