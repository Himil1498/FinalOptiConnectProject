# Google Maps Integration Guide - Opti Connect

## Overview

Opti Connect features a comprehensive Google Maps integration built with React, TypeScript, and the Google Maps JavaScript API. The implementation provides advanced GIS capabilities for network infrastructure management and optimization.

## Features

### 🗺️ Enhanced Map Component
- **TypeScript Integration**: Full type safety with Google Maps API
- **React Hooks**: Modern React patterns with useEffect and useCallback
- **Performance Optimized**: Debounced updates and memoized handlers
- **Error Handling**: Comprehensive error states and fallbacks

### 🎮 Interactive Controls
- **Zoom Controls**: Custom zoom in/out with level display
- **Navigation**: Reset view, fit bounds, my location
- **Map Types**: Roadmap, Satellite, Hybrid, Terrain
- **Custom Styles**: Dark mode, Retro, Default themes

### 📍 Coordinate Display
- **Live Updates**: Real-time coordinates on mouse hover
- **Multiple Formats**: Decimal degrees and DMS (Degrees, Minutes, Seconds)
- **Copy to Clipboard**: One-click coordinate copying
- **Precision Control**: Configurable decimal precision

### 🎯 Region Restrictions
- **Predefined Regions**: India, major cities, and custom areas
- **Boundary Enforcement**: Optional strict bounds mode
- **Dynamic Switching**: Runtime region changes
- **Visual Feedback**: Clear restriction indicators

### 🎨 Map Styling
- **Multiple Themes**: Default, Dark, Retro map styles
- **Custom Controls**: Positioned control panels
- **Responsive Design**: Mobile and desktop optimized
- **Professional UI**: Clean, modern interface

## Architecture

### Component Structure
```
src/components/map/
├── EnhancedGoogleMap.tsx          # Main enhanced map component
├── MapControlPanel.tsx            # Custom map controls
├── CoordinateDisplayWidget.tsx    # Live coordinate display
├── MapTypeSelector.tsx            # Map type and style switcher
├── DrawingManager.tsx             # Drawing tools integration
└── GoogleMapContainer.tsx         # Legacy component
```

### Utilities
```
src/utils/
└── mapRestrictions.ts            # Region restrictions and bounds
```

### Types
```
src/types/index.ts               # TypeScript definitions
```

## Quick Start

### Basic Usage

```tsx
import EnhancedGoogleMapContainer from '../components/map/EnhancedGoogleMap';

function MapView() {
  return (
    <EnhancedGoogleMapContainer
      controls={{
        zoom: true,
        mapType: true,
        fullscreen: true,
      }}
      coordinateDisplay={{
        enabled: true,
        format: 'decimal',
        precision: 6,
      }}
    />
  );
}
```

### With Region Restrictions

```tsx
import { createRegionRestriction } from '../utils/mapRestrictions';

const regionRestriction = createRegionRestriction('INDIA', false);

<EnhancedGoogleMapContainer
  regionRestriction={regionRestriction}
  settings={{
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    gestureHandling: 'auto',
  }}
/>
```

### Event Handling

```tsx
const eventHandlers = {
  onClick: (event: google.maps.MapMouseEvent) => {
    console.log('Clicked at:', event.latLng?.toJSON());
  },
  onZoomChanged: (zoom: number) => {
    console.log('Zoom level:', zoom);
  },
  onCenterChanged: (center: google.maps.LatLngLiteral) => {
    console.log('Map center:', center);
  },
};

<EnhancedGoogleMapContainer
  eventHandlers={eventHandlers}
/>
```

## API Reference

### EnhancedGoogleMapContainer Props

```tsx
interface EnhancedGoogleMapProps {
  // Basic map configuration
  controls?: MapControls;
  settings?: Partial<MapSettings>;

  // Feature configurations
  coordinateDisplay?: Partial<CoordinateDisplay>;
  regionRestriction?: Partial<RegionRestriction>;

  // Event handlers
  eventHandlers?: MapEventHandlers;

  // Styling
  className?: string;
}
```

### MapControls Interface

```tsx
interface MapControls {
  zoom?: boolean;           // Show zoom controls
  streetView?: boolean;     // Show street view control
  mapType?: boolean;        // Show map type control
  fullscreen?: boolean;     // Show fullscreen control
  scale?: boolean;          // Show scale control
  rotate?: boolean;         // Show rotate control
}
```

### CoordinateDisplay Interface

```tsx
interface CoordinateDisplay {
  enabled: boolean;         // Enable coordinate display
  format: 'decimal' | 'dms'; // Coordinate format
  precision: number;        // Decimal precision
}
```

### RegionRestriction Interface

```tsx
interface RegionRestriction {
  enabled: boolean;         // Enable restriction
  bounds: google.maps.LatLngBounds; // Restriction bounds
  strictBounds?: boolean;   // Enforce strict bounds
}
```

## Region Restrictions

### Predefined Regions

```tsx
import { REGION_RESTRICTIONS } from '../utils/mapRestrictions';

// Available regions:
REGION_RESTRICTIONS.INDIA          // All of India
REGION_RESTRICTIONS.NORTH_INDIA    // Northern states
REGION_RESTRICTIONS.SOUTH_INDIA    // Southern states
REGION_RESTRICTIONS.MUMBAI         // Mumbai metropolitan
REGION_RESTRICTIONS.DELHI          // Delhi NCR
REGION_RESTRICTIONS.BANGALORE      // Bangalore city
REGION_RESTRICTIONS.CHENNAI        // Chennai city
REGION_RESTRICTIONS.KOLKATA        // Kolkata city
REGION_RESTRICTIONS.HYDERABAD      // Hyderabad city
```

### Creating Custom Restrictions

```tsx
import { createCustomRegionRestriction } from '../utils/mapRestrictions';

const customBounds = {
  north: 28.7,
  south: 28.4,
  east: 77.3,
  west: 77.0,
};

const restriction = createCustomRegionRestriction(customBounds, true);
```

## Map Styling

### Available Themes

1. **Default**: Standard Google Maps styling
2. **Dark Mode**: Dark theme for night viewing
3. **Retro**: Vintage map appearance

### Custom Styling

```tsx
const customStyles: google.maps.MapTypeStyle[] = [
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#e9e9e9" }]
  },
  // Add more styling rules...
];

<EnhancedGoogleMapContainer
  settings={{ styles: customStyles }}
/>
```

## Advanced Features

### Drawing Tools Integration

```tsx
import DrawingManager from '../components/map/DrawingManager';

const drawingMode: DrawingMode = {
  enabled: true,
  mode: 'polygon',
  options: {
    polygonOptions: {
      fillColor: '#FF0000',
      fillOpacity: 0.3,
    },
  },
};

// DrawingManager component handles Google Maps Drawing Library
<DrawingManager
  map={mapRef.current}
  drawingMode={drawingMode}
  onOverlayComplete={(event) => {
    console.log('Drawing completed:', event);
  }}
/>
```

### Coordinate Utilities

```tsx
import {
  isPointInBounds,
  getBoundsCenter,
  expandBounds,
  createBoundsFromPoints,
} from '../utils/mapRestrictions';

// Check if point is within bounds
const isInside = isPointInBounds(
  { lat: 20.5937, lng: 78.9629 },
  indiaBounds
);

// Get center of bounds
const center = getBoundsCenter(bounds);

// Expand bounds by 0.1 degrees
const expandedBounds = expandBounds(bounds, 0.1);
```

## Configuration

### Environment Variables

```env
# Required: Google Maps API Key
REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here

# Optional: Default map settings
REACT_APP_DEFAULT_MAP_CENTER_LAT=20.5937
REACT_APP_DEFAULT_MAP_CENTER_LNG=78.9629
REACT_APP_DEFAULT_ZOOM_LEVEL=5
```

### Google Cloud Console Setup

1. **Enable APIs**:
   - Maps JavaScript API
   - Places API (optional)
   - Drawing Library (for drawing tools)

2. **API Key Configuration**:
   - Set domain restrictions
   - Configure API restrictions
   - Set up billing (required for production)

3. **Quota Management**:
   - Monitor API usage
   - Set up usage alerts
   - Configure quotas per API

## Performance Optimization

### Best Practices

1. **Debounced Updates**: Map events are debounced to prevent excessive API calls
2. **Memoized Callbacks**: Event handlers are memoized to prevent re-renders
3. **Conditional Rendering**: Components only render when necessary
4. **Efficient Bounds**: Smart bounds calculation for optimal zoom levels

### Code Example

```tsx
// Debounced center change handler
const handleCenterChanged = useCallback(() => {
  if (centerUpdateTimeoutRef.current) {
    clearTimeout(centerUpdateTimeoutRef.current);
  }

  centerUpdateTimeoutRef.current = setTimeout(() => {
    // Update center after 300ms delay
    const newCenter = map.getCenter();
    dispatch(setMapCenter([newCenter.lat(), newCenter.lng()]));
  }, 300);
}, [dispatch]);
```

## Error Handling

### Common Issues and Solutions

**API Key Issues**:
```tsx
// The component shows helpful error messages
if (!apiKey) {
  return <ApiKeyMissingError />;
}

if (status === 'FAILURE') {
  return <GoogleMapsFailureError />;
}
```

**Loading States**:
```tsx
if (status === 'LOADING') {
  return <LoadingSpinner message="Loading Google Maps..." />;
}
```

## Testing

### Unit Testing

```tsx
import { render, screen } from '@testing-library/react';
import EnhancedGoogleMapContainer from '../EnhancedGoogleMap';

// Mock Google Maps API
jest.mock('@googlemaps/react-wrapper');

test('renders map container', () => {
  render(<EnhancedGoogleMapContainer />);
  expect(screen.getByRole('application')).toBeInTheDocument();
});
```

### Integration Testing

```tsx
// Test coordinate display functionality
test('displays coordinates on mouse move', async () => {
  const { getByTestId } = render(<EnhancedGoogleMapContainer />);

  // Simulate mouse move event
  fireEvent.mouseMove(getByTestId('map-container'), {
    clientX: 100,
    clientY: 100,
  });

  await waitFor(() => {
    expect(screen.getByText(/coordinates/i)).toBeInTheDocument();
  });
});
```

## Production Deployment

### Checklist

- [ ] Valid Google Maps API key configured
- [ ] APIs enabled in Google Cloud Console
- [ ] Billing account set up and verified
- [ ] Domain restrictions configured properly
- [ ] API quotas set appropriately
- [ ] Error boundaries implemented
- [ ] Performance monitoring enabled
- [ ] HTTPS enabled for production domain

### Security Considerations

1. **API Key Security**:
   - Use environment variables
   - Set domain restrictions
   - Enable only required APIs
   - Monitor usage regularly

2. **User Data**:
   - Don't log sensitive location data
   - Implement proper user consent
   - Follow privacy regulations

## Troubleshooting

### Common Problems

**Map Not Loading**:
1. Check API key validity
2. Verify domain restrictions
3. Ensure billing is enabled
4. Check browser console for errors

**Controls Not Working**:
1. Verify Google Maps libraries are loaded
2. Check TypeScript types are correct
3. Ensure proper event handler binding

**Performance Issues**:
1. Check for memory leaks in event listeners
2. Verify proper cleanup in useEffect
3. Monitor API quota usage

### Debug Mode

```tsx
// Enable debug logging
const debugMap = process.env.NODE_ENV === 'development';

if (debugMap) {
  console.log('Map initialized:', map);
  console.log('Current center:', map.getCenter());
  console.log('Current zoom:', map.getZoom());
}
```

## Future Enhancements

### Planned Features

1. **Advanced Drawing Tools**:
   - Measurement tools
   - Shape editing
   - Layer management

2. **Data Visualization**:
   - Heatmaps
   - Clustering
   - Custom overlays

3. **Real-time Updates**:
   - WebSocket integration
   - Live data feeds
   - Automatic refresh

4. **Mobile Optimization**:
   - Touch gestures
   - Responsive controls
   - Offline capabilities

## Support

For Google Maps integration issues:
- Check the [Google Maps JavaScript API documentation](https://developers.google.com/maps/documentation/javascript)
- Review the [React Google Maps wrapper documentation](https://github.com/googlemaps/react-wrapper)
- Monitor Google Cloud Console for API usage and errors
- Check browser developer tools for JavaScript errors