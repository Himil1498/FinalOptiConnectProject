import { RegionRestriction } from '../types';

/**
 * Predefined region restrictions for common geographical areas
 */
export const REGION_RESTRICTIONS = {
  INDIA: {
    north: 37.6,
    south: 6.4,
    east: 97.25,
    west: 68.1,
  },
  NORTH_INDIA: {
    north: 37.6,
    south: 23.0,
    east: 97.25,
    west: 68.1,
  },
  SOUTH_INDIA: {
    north: 23.0,
    south: 6.4,
    east: 97.25,
    west: 68.1,
  },
  MUMBAI: {
    north: 19.3,
    south: 18.8,
    east: 72.9,
    west: 72.7,
  },
  DELHI: {
    north: 28.9,
    south: 28.4,
    east: 77.3,
    west: 77.0,
  },
  BANGALORE: {
    north: 13.2,
    south: 12.7,
    east: 77.9,
    west: 77.4,
  },
  CHENNAI: {
    north: 13.3,
    south: 12.8,
    east: 80.3,
    west: 80.1,
  },
  KOLKATA: {
    north: 22.8,
    south: 22.4,
    east: 88.5,
    west: 88.2,
  },
  HYDERABAD: {
    north: 17.6,
    south: 17.2,
    east: 78.7,
    west: 78.2,
  },
} as const;

/**
 * Creates a Google Maps LatLngBounds object from coordinate bounds
 */
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

/**
 * Creates a region restriction configuration for Google Maps
 */
export const createRegionRestriction = (
  region: keyof typeof REGION_RESTRICTIONS,
  strictBounds: boolean = false
): RegionRestriction => {
  const bounds = REGION_RESTRICTIONS[region];
  return {
    enabled: true,
    bounds: createBounds(bounds),
    strictBounds,
  };
};

/**
 * Creates a custom region restriction from coordinate bounds
 */
export const createCustomRegionRestriction = (
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  },
  strictBounds: boolean = false
): RegionRestriction => {
  return {
    enabled: true,
    bounds: createBounds(bounds),
    strictBounds,
  };
};

/**
 * Checks if a coordinate point is within the specified bounds
 */
export const isPointInBounds = (
  point: google.maps.LatLngLiteral,
  bounds: google.maps.LatLngBounds
): boolean => {
  return bounds.contains(new google.maps.LatLng(point.lat, point.lng));
};

/**
 * Calculates the center point of bounds
 */
export const getBoundsCenter = (bounds: google.maps.LatLngBounds): google.maps.LatLngLiteral => {
  const center = bounds.getCenter();
  return {
    lat: center.lat(),
    lng: center.lng(),
  };
};

/**
 * Expands bounds by a specified distance (in degrees)
 */
export const expandBounds = (
  bounds: google.maps.LatLngBounds,
  distance: number
): google.maps.LatLngBounds => {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  return new google.maps.LatLngBounds(
    new google.maps.LatLng(sw.lat() - distance, sw.lng() - distance),
    new google.maps.LatLng(ne.lat() + distance, ne.lng() + distance)
  );
};

/**
 * Creates bounds that encompass multiple points
 */
export const createBoundsFromPoints = (
  points: google.maps.LatLngLiteral[]
): google.maps.LatLngBounds => {
  const bounds = new google.maps.LatLngBounds();
  points.forEach(point => {
    bounds.extend(new google.maps.LatLng(point.lat, point.lng));
  });
  return bounds;
};

/**
 * Utility to apply region restriction to a map
 */
export const applyRegionRestriction = (
  map: google.maps.Map,
  restriction: RegionRestriction
): void => {
  if (restriction.enabled) {
    map.setOptions({
      restriction: {
        latLngBounds: restriction.bounds,
        strictBounds: restriction.strictBounds || false,
      },
    });
  } else {
    map.setOptions({ restriction: null });
  }
};

/**
 * Remove region restriction from a map
 */
export const removeRegionRestriction = (map: google.maps.Map): void => {
  map.setOptions({ restriction: null });
};

/**
 * Get appropriate zoom level for bounds
 */
export const getZoomForBounds = (
  bounds: google.maps.LatLngBounds,
  mapDimensions: { width: number; height: number }
): number => {
  const WORLD_DIM = { height: 256, width: 256 };
  const ZOOM_MAX = 21;

  function latRad(lat: number) {
    const sin = Math.sin((lat * Math.PI) / 180);
    const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  }

  function zoom(mapPx: number, worldPx: number, fraction: number) {
    return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
  }

  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();

  const latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;
  const lngDiff = ne.lng() - sw.lng();
  const lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

  const latZoom = zoom(mapDimensions.height, WORLD_DIM.height, latFraction);
  const lngZoom = zoom(mapDimensions.width, WORLD_DIM.width, lngFraction);

  return Math.min(latZoom, lngZoom, ZOOM_MAX);
};

/**
 * Predefined drawing tool configurations
 */
export const DRAWING_TOOL_CONFIGS = {
  NETWORK_COVERAGE: {
    polygon: {
      fillColor: '#3B82F6',
      fillOpacity: 0.3,
      strokeWeight: 2,
      strokeColor: '#1D4ED8',
      editable: true,
      draggable: false,
    },
    circle: {
      fillColor: '#10B981',
      fillOpacity: 0.2,
      strokeWeight: 2,
      strokeColor: '#059669',
      editable: true,
      draggable: true,
    },
  },
  MAINTENANCE_ZONES: {
    polygon: {
      fillColor: '#F59E0B',
      fillOpacity: 0.25,
      strokeWeight: 2,
      strokeColor: '#D97706',
      editable: true,
      draggable: false,
    },
    rectangle: {
      fillColor: '#F59E0B',
      fillOpacity: 0.25,
      strokeWeight: 2,
      strokeColor: '#D97706',
      editable: true,
      draggable: true,
    },
  },
  RESTRICTED_AREAS: {
    polygon: {
      fillColor: '#EF4444',
      fillOpacity: 0.3,
      strokeWeight: 3,
      strokeColor: '#DC2626',
      editable: false,
      draggable: false,
    },
  },
  CABLE_ROUTES: {
    polyline: {
      strokeColor: '#8B5CF6',
      strokeWeight: 4,
      strokeOpacity: 0.8,
      editable: true,
      draggable: false,
    },
  },
} as const;

/**
 * Converts string map type to Google Maps MapTypeId
 */
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

/**
 * Converts Google Maps MapTypeId to string
 */
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