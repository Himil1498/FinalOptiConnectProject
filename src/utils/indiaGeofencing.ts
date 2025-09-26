// India Geofencing Utilities
export interface GeofenceValidationResult {
  isValid: boolean;
  message?: string;
  suggestedAction?: string;
}

export interface IndiaGeofenceConfig {
  strictMode: boolean;
  showWarnings: boolean;
  allowNearBorder: boolean;
  borderTolerance: number; // in kilometers
}

// India boundaries (approximate)
const INDIA_BOUNDS = {
  north: 37.6,
  south: 6.4,
  east: 97.25,
  west: 68.1
};

// Major Indian cities for reference
export const MAJOR_INDIAN_CITIES = [
  { name: 'New Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 }
];

// Check if coordinates are within basic India bounds
export const isWithinIndiaBounds = (lat: number, lng: number): boolean => {
  return (
    lat >= INDIA_BOUNDS.south &&
    lat <= INDIA_BOUNDS.north &&
    lng >= INDIA_BOUNDS.west &&
    lng <= INDIA_BOUNDS.east
  );
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

// Find nearest Indian city for suggestions
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

// Validate coordinates for India geofencing
export const validateIndiaGeofence = (
  lat: number,
  lng: number,
  config: IndiaGeofenceConfig = {
    strictMode: true,
    showWarnings: true,
    allowNearBorder: false,
    borderTolerance: 10
  }
): GeofenceValidationResult => {
  // Check if within basic bounds
  if (!isWithinIndiaBounds(lat, lng)) {
    const { city, distance } = findNearestIndianCity(lat, lng);

    return {
      isValid: false,
      message: `Location is outside India boundaries. You can only use tools within India.`,
      suggestedAction: `Try near ${city.name} (${distance.toFixed(0)}km away) at coordinates ${city.lat.toFixed(4)}, ${city.lng.toFixed(4)}`
    };
  }

  // For locations near borders, provide additional validation
  if (config.showWarnings) {
    const distanceFromCenter = calculateDistance(lat, lng, 20.5937, 78.9629); // Center of India
    if (distanceFromCenter > 1500) { // More than 1500km from center
      return {
        isValid: true,
        message: 'Location is near India border. Some features may be limited.',
        suggestedAction: 'Consider using locations closer to major cities for better accuracy'
      };
    }
  }

  return {
    isValid: true
  };
};

// Validate a list of coordinates (for polygons, polylines, etc.)
export const validateMultipleCoordinates = (
  coordinates: Array<{ lat: number; lng: number }>,
  config?: IndiaGeofenceConfig
): GeofenceValidationResult => {
  for (let i = 0; i < coordinates.length; i++) {
    const { lat, lng } = coordinates[i];
    const result = validateIndiaGeofence(lat, lng, config);

    if (!result.isValid) {
      return {
        isValid: false,
        message: `Point ${i + 1} is outside India boundaries: ${result.message}`,
        suggestedAction: result.suggestedAction
      };
    }
  }

  return {
    isValid: true,
    message: 'All coordinates are within India boundaries'
  };
};

// Check if a bounds rectangle intersects with India
export const validateBoundsIntersection = (
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }
): GeofenceValidationResult => {
  const intersects = !(
    bounds.east < INDIA_BOUNDS.west ||
    bounds.west > INDIA_BOUNDS.east ||
    bounds.north < INDIA_BOUNDS.south ||
    bounds.south > INDIA_BOUNDS.north
  );

  if (!intersects) {
    return {
      isValid: false,
      message: 'Selected area does not intersect with India boundaries',
      suggestedAction: 'Please select an area within India'
    };
  }

  return {
    isValid: true
  };
};

// Get suggested center point for India
export const getIndiaCenterPoint = () => ({
  lat: 20.5937,
  lng: 78.9629,
  zoom: 5
});

// Export default configuration
export const DEFAULT_GEOFENCE_CONFIG: IndiaGeofenceConfig = {
  strictMode: true,
  showWarnings: true,
  allowNearBorder: false,
  borderTolerance: 10
};