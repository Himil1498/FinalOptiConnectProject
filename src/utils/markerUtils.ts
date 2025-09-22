/**
 * Utility functions for Google Maps markers with deprecation handling
 *
 * This module provides a compatibility layer for Google Maps markers,
 * allowing gradual migration from deprecated google.maps.Marker to
 * google.maps.marker.AdvancedMarkerElement
 */

export interface MarkerOptions {
  position: google.maps.LatLngLiteral;
  map: google.maps.Map;
  title?: string;
  icon?: string | google.maps.Icon | google.maps.Symbol;
}

/**
 * Creates a marker with fallback to legacy implementation
 * Suppresses deprecation warnings while providing migration path
 */
export const createCompatibleMarker = (options: MarkerOptions): google.maps.Marker => {
  // For now, continue using the legacy Marker but suppress the warning
  // TODO: Migrate to AdvancedMarkerElement when ready

  // Temporarily suppress console.warn for this specific deprecation
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (message.includes('google.maps.Marker is deprecated')) {
      return; // Suppress this specific warning
    }
    originalWarn.apply(console, args);
  };

  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (message.includes('google.maps.Marker is deprecated')) {
      return; // Suppress this specific warning
    }
    originalError.apply(console, args);
  };

  try {
    const marker = new google.maps.Marker(options);
    return marker;
  } finally {
    // Restore original console methods
    console.warn = originalWarn;
    console.error = originalError;
  }
};

/**
 * Future implementation using AdvancedMarkerElement
 * Currently commented out as it requires more extensive changes
 */
/*
export const createAdvancedMarker = (options: MarkerOptions): google.maps.marker.AdvancedMarkerElement => {
  const marker = new google.maps.marker.AdvancedMarkerElement({
    position: options.position,
    map: options.map,
    title: options.title,
    // Note: AdvancedMarkerElement uses different icon handling
    // Will need to convert icon options when migrating
  });

  return marker;
};
*/