# Complete Map System Documentation & Removal Guide

## 📑 Table of Contents
1. [Overview & System Analysis](#overview--system-analysis)
2. [File Structure & Component Analysis](#file-structure--component-analysis)
3. [Map Hooks & Utilities Analysis](#map-hooks--utilities-analysis)
4. [Geofencing & Boundary System](#geofencing--boundary-system)
5. [Step-by-Step Removal Guide](#step-by-step-removal-guide)
6. [Critical Preservation Requirements](#critical-preservation-requirements)
7. [Testing & Validation](#testing--validation)
8. [Migration Timeline & Checklist](#migration-timeline--checklist)

---

# Overview & System Analysis

## 🎯 Project Overview
This document provides a comprehensive analysis of all map-related files, components, hooks, and utilities in the FinalOptiConnectProject. This analysis is intended to guide the removal and replacement of the current Google Maps-based system with a new robust map system while preserving critical functionality.

## 📊 Current System Status
- **Primary Interface**: `ComprehensiveGoogleMapInterface.tsx` (2000+ lines)
- **Active Tools**: Distance, Elevation, Polygon, Geofencing, KML Management
- **Critical Features**: India boundary restrictions, POP/SubPOP management
- **Dependencies**: Google Maps JavaScript API, India boundary data
- **Integration Points**: Infrastructure management, Data Manager, Admin tools

---

# File Structure & Component Analysis

## 🗺️ Core Map Components (`src/components/map/`)

### 🔴 **PRIMARY MAP CONTAINER COMPONENTS** (MUST REMOVE)

#### 1. **`ComprehensiveGoogleMapInterface.tsx`** ⭐ MAIN COMPONENT
- **Status**: ACTIVELY USED
- **Purpose**: Primary map interface component
- **Dependencies**: Uses most other map components
- **Size**: Very large (2000+ lines)
- **Usage**: Main map implementation in the application
- **Remove Priority**: 🔴 HIGH - Core Google Maps dependency

#### 2. **`GoogleMapContainer.tsx`**
- **Status**: USED as secondary component
- **Purpose**: Basic Google Maps wrapper
- **Dependencies**: google-maps API
- **Usage**: Fallback or simplified map container
- **Remove Priority**: 🔴 HIGH - Direct Google Maps integration

#### 3. **`IntegratedGoogleMapsInterface.tsx`**
- **Status**: POSSIBLY UNUSED
- **Purpose**: Alternative integrated map interface
- **Usage**: May be legacy code
- **Remove Priority**: 🟡 MEDIUM - May be unused

### 🛠️ **MAP TOOL COMPONENTS** (EXTRACT LOGIC, REPLACE MAP API)

#### 4. **`DistanceMeasurementTool.tsx`**
- **Status**: ACTIVELY USED
- **Purpose**: Distance measurement functionality
- **Features**: Point-to-point distance, polyline drawing
- **Dependencies**: Google Maps Drawing, Geometry libraries
- **Preserve**: Mathematical calculations, UI logic
- **Replace**: Google Maps polyline API
- **Migration Priority**: 🟡 HIGH - Core tool functionality

#### 5. **`ElevationTool.tsx`**
- **Status**: ACTIVELY USED
- **Purpose**: Elevation profile analysis
- **Features**: Elevation charts, terrain analysis
- **Dependencies**: Google Maps Elevation API
- **Preserve**: Chart generation, mathematical analysis
- **Replace**: Elevation data source, map integration
- **Migration Priority**: 🟡 HIGH - Core tool functionality

#### 6. **`PolygonDrawingTool.tsx`**
- **Status**: ACTIVELY USED
- **Purpose**: Area measurement, polygon drawing
- **Features**: Area calculation, polygon manipulation
- **Dependencies**: Google Maps Drawing library
- **Preserve**: Area calculation algorithms, UI components
- **Replace**: Google Maps polygon API
- **Migration Priority**: 🟡 HIGH - Core tool functionality

#### 7. **`GeofencingSystem.tsx`**
- **Status**: ACTIVELY USED
- **Purpose**: Geographic boundary enforcement
- **Features**: India boundary validation
- **Dependencies**: India geofencing utilities
- **Preserve**: ALL validation logic (critical for security)
- **Replace**: Map integration layer only
- **Migration Priority**: 🔴 CRITICAL - Security feature

### 🎛️ **CONTROL AND PANEL COMPONENTS** (ADAPT FOR NEW MAP)

#### 8. **`FloatingToolPanel.tsx`**
- **Status**: ACTIVELY USED
- **Purpose**: Main tool selection panel
- **Features**: Tool switching, floating UI
- **Preserve**: UI components, tool coordination
- **Replace**: Tool integration layer
- **Migration Priority**: 🟢 MEDIUM - UI adaptation

#### 9. **`MapControlsPanel.tsx`**
- **Status**: POSSIBLY USED
- **Purpose**: Map control buttons
- **Features**: Zoom, center, map type controls
- **Migration Priority**: 🟢 LOW - Standard controls

#### 10. **`MapToolsPanel.tsx`**
- **Status**: POSSIBLY USED
- **Purpose**: Tool-specific controls
- **Features**: Tool options and settings
- **Migration Priority**: 🟢 LOW - Tool-specific UI

#### 11. **`CustomMapControls.tsx`**
- **Status**: POSSIBLY USED
- **Purpose**: Custom control widgets
- **Features**: Custom map controls
- **Migration Priority**: 🟢 LOW - Custom widgets

### 📍 **LOCATION AND DATA COMPONENTS** (HIGH PRIORITY TO PRESERVE)

#### 12. **`AddPOPLocationForm.tsx`**
- **Status**: ACTIVELY USED
- **Purpose**: Add POP/Sub POP locations
- **Features**: Location picker, form integration
- **Dependencies**: Data store context
- **Preserve**: Form logic, validation, data submission
- **Replace**: Map location picker interface
- **Migration Priority**: 🔴 CRITICAL - Core business logic

#### 13. **`LiveCoordinateDisplay.tsx`**
- **Status**: ACTIVELY USED
- **Purpose**: Real-time coordinate display
- **Features**: Mouse tracking, coordinate display
- **Preserve**: Coordinate formatting, real-time tracking
- **Replace**: Mouse event integration
- **Migration Priority**: 🟡 MEDIUM - User feedback feature

#### 14. **`CoordinateDisplayWidget.tsx`**
- **Status**: POSSIBLY USED
- **Purpose**: Coordinate display widget
- **Features**: Coordinate formatting
- **Migration Priority**: 🟢 LOW - Display widget

#### 15. **`KMLLayerManager.tsx`**
- **Status**: ACTIVELY USED
- **Purpose**: KML layer management
- **Features**: Layer toggle, KML display
- **Preserve**: KML parsing logic, layer management
- **Replace**: KML rendering on new map
- **Migration Priority**: 🟡 HIGH - Data visualization

### 🏗️ **SUPPORT AND UTILITY COMPONENTS** (ADAPT COORDINATION LOGIC)

#### 16. **`MultiToolManager.tsx`**
- **Status**: USED
- **Purpose**: Manages multiple active tools
- **Features**: Tool coordination, state management
- **Preserve**: Tool coordination logic
- **Replace**: Tool integration interfaces
- **Migration Priority**: 🟡 MEDIUM - Tool management

#### 17. **`WorkflowManager.tsx`**
- **Status**: POSSIBLY USED
- **Purpose**: Workflow coordination
- **Features**: Tool workflows, process management
- **Migration Priority**: 🟢 LOW - Workflow logic

#### 18. **`AdminPanelManager.tsx`**
- **Status**: USED
- **Purpose**: Admin-specific map controls
- **Features**: Administrative tools
- **Migration Priority**: 🟡 MEDIUM - Admin integration

### 📱 **LEGACY AND FALLBACK COMPONENTS** (SAFE TO REMOVE)

#### 19-31. **Legacy Components** (REMOVE IMMEDIATELY)
```
❌ BaseMap.tsx                          - Legacy implementation
❌ BaseMapExample.tsx                   - Example code
❌ BaseMapProvider.tsx                  - Legacy provider
❌ EnhancedGoogleMap.tsx               - Superseded implementation
❌ GoogleMapsComponent.tsx             - Basic Google Maps component
❌ GoogleMapControls.tsx               - Legacy controls
❌ MapContainer.tsx                     - Generic container
❌ MapControlPanel.tsx                  - Legacy controls
❌ MapDataOverlay.tsx                   - Legacy overlay
❌ MapStatusIndicator.tsx               - Status display
❌ MapTypeSelector.tsx                  - Legacy selector
❌ SimpleMapFallback.tsx                - Fallback component
❌ WorkingMapFallback.tsx               - Fallback component
```

---

# Map Hooks & Utilities Analysis

## 🎣 Map Hooks Analysis

### 1. **`useGoogleMaps.ts`** ⭐ PRIMARY MAP HOOK

#### **Status**: 🔴 ACTIVELY USED - MUST REPLACE
#### **Purpose**: Core Google Maps integration and management
#### **File Size**: Large (~300+ lines)

#### **Key Features**:
- **Map Initialization**: Creates and configures Google Maps instance
- **API Loading**: Manages Google Maps JavaScript API loading
- **India Restrictions**: Applies India boundary restrictions
- **Mouse Tracking**: Real-time mouse position tracking
- **Boundary Management**: Loads and manages India boundary polygons
- **Event Handling**: Map click, zoom, pan events

#### **Dependencies**:
```typescript
- '@googlemaps/js-api-loader'               ❌ REMOVE
- '../utils/unifiedGeofencing'              ✅ ADAPT
- Google Maps JavaScript API                ❌ REMOVE
- India boundary JSON data (/india.json)    ✅ PRESERVE
```

#### **Return Interface**:
```typescript
{
  mapRef: RefObject<HTMLDivElement>                    ✅ PRESERVE PATTERN
  map: google.maps.Map | null                         ❌ REPLACE WITH NEW MAP TYPE
  isLoaded: boolean                                    ✅ PRESERVE
  error: string | null                                 ✅ PRESERVE
  mousePosition: { lat: number; lng: number } | null  ✅ PRESERVE
  indiaBounds: google.maps.LatLngBounds | null        ✅ ADAPT FOR NEW MAP
  indiaPolygons: google.maps.Polygon[]                ✅ ADAPT FOR NEW MAP
}
```

#### **Critical Methods to Preserve**:
```typescript
✅ loadIndiaBoundary() - Loads India GeoJSON data
✅ Real-time mouse position tracking logic
✅ Map restriction application logic
❌ Google Maps specific API calls
```

### 2. **`useBaseMap.ts`** - LEGACY MAP HOOK

#### **Status**: 🟡 LEGACY/PARTIALLY USED - CAN REMOVE
#### **Purpose**: Alternative map management approach
#### **File Size**: Medium (~200+ lines)

#### **Key Features**:
- **Basic Map Management**: Simpler map operations
- **Marker Management**: Add, remove, clear markers
- **Click Handling**: Map click event management
- **Geocoding**: Address to coordinates conversion
- **Pan/Zoom Controls**: Basic map navigation

#### **Used By**:
- `BaseMapPage.tsx` (Legacy page) ❌
- `BaseMapProvider.tsx` (Legacy provider) ❌
- `BaseMapExample.tsx` (Example component) ❌

#### **Migration Decision**: 🗑️ SAFE TO REMOVE - Superseded by useGoogleMaps

### 3. **`useMapEventHandlers.ts`** (in map/hooks/)

#### **Status**: 🟢 USED - ADAPT FOR NEW MAP
#### **Purpose**: Centralized map event handling
#### **Features**: Event delegation, tool integration, state management
#### **Preserve**: Event handling patterns and logic
#### **Replace**: Event API integration

---

## 🛠️ Map Utilities Analysis

### 1. **Geofencing Utilities** ⭐ CRITICAL TO PRESERVE

#### **`preciseIndiaGeofencing.ts`** 🔴 CRITICAL
- **Status**: ACTIVELY USED - MUST PRESERVE ALL LOGIC
- **Purpose**: High-precision India boundary validation
- **Features**:
  - Detailed India boundary coordinates ✅ PRESERVE
  - Precise point-in-polygon algorithms ✅ PRESERVE
  - State-level boundary data ✅ PRESERVE
  - Complex polygon validation ✅ PRESERVE
- **Size**: Very large (contains extensive coordinate data)
- **Dependencies**: None (self-contained) ✅ GOOD

#### **`unifiedGeofencing.ts`** 🔴 CRITICAL
- **Status**: ACTIVELY USED - ADAPT FOR NEW MAP
- **Purpose**: Unified interface for all geofencing functions
- **Features**:
  - Combines different geofencing methods ✅ PRESERVE
  - Map restriction application ⚠️ ADAPT
  - India center point calculation ✅ PRESERVE
  - Map type conversion utilities ⚠️ ADAPT
- **Dependencies**: Other geofencing files ✅ PRESERVE

#### **Critical Functions in unifiedGeofencing.ts**:
```typescript
✅ PRESERVE: isPointInIndia(lat: number, lng: number): boolean
✅ PRESERVE: validateIndianCoordinates(coordinates: Coordinates[]): boolean
✅ PRESERVE: getIndiaCenterPoint(): { lat: number; lng: number }
⚠️ ADAPT:   applyIndiaRestriction(map: google.maps.Map): void
⚠️ ADAPT:   convertStringToMapTypeId(mapType: string): google.maps.MapTypeId
```

#### **`indiaGeofencing.ts`** 🟡 BASIC FALLBACK
- **Status**: LEGACY - BASIC FALLBACK
- **Purpose**: Simple bounding box validation for India
- **Decision**: Keep as fallback, low priority

### 2. **Map Configuration Utilities**

#### **`mapRestrictions.ts`** 🟢 ADAPT CONFIGURATION
- **Status**: USED - ADAPT FOR NEW MAP
- **Purpose**: Map boundary and restriction definitions
- **Features**: Zoom limits, pan restrictions, map type restrictions

#### **Critical Constants to Preserve**:
```typescript
✅ PRESERVE: INDIA_BOUNDS = { north: 37.0, south: 6.0, east: 97.0, west: 68.0 }
✅ PRESERVE: MAP_ZOOM_LIMITS = { min: 4, max: 20 }
✅ PRESERVE: All geographic constants
⚠️ ADAPT:   Map-specific restriction implementations
```

---

## 📁 Map Types and Interfaces

### **`src/components/map/types/MapInterfaces.ts`**
- **Status**: 🔴 ACTIVELY USED - UPDATE FOR NEW MAP
- **Purpose**: TypeScript interfaces for map components
- **Action Required**: Replace Google Maps types with new map library types

#### **Example Migration**:
```typescript
// BEFORE (Google Maps)
interface MapComponentProps {
  center: google.maps.LatLngLiteral;
  bounds: google.maps.LatLngBounds;
  map: google.maps.Map;
}

// AFTER (Generic/New Map Library)
interface MapComponentProps {
  center: [number, number];  // or { lat: number, lng: number }
  bounds: [[number, number], [number, number]];
  map: L.Map;  // or NewMapType
}
```

---

## 🗃️ Map State Management

### **`src/store/slices/mapSlice.ts`**
- **Status**: 🟡 USED (if Redux is used) - ADAPT STATE STRUCTURE
- **Purpose**: Map state management with Redux
- **Preserve**: State structure and logic
- **Replace**: Map-specific types and integration

---

# Geofencing & Boundary System

## 🗺️ Geofencing System Architecture

### **Three-Layer Geofencing Approach** ✅ PRESERVE THIS ARCHITECTURE:
1. **Basic Geofencing** (`indiaGeofencing.ts`) - Simple bounding box
2. **Precise Geofencing** (`preciseIndiaGeofencing.ts`) - Detailed polygon validation
3. **Unified Interface** (`unifiedGeofencing.ts`) - Combined functionality

---

## 📁 Critical Geofencing Files Analysis

### 1. **`preciseIndiaGeofencing.ts`** ⭐ MOST CRITICAL

#### **Status**: 🔴 CRITICAL - MUST PRESERVE ALL ALGORITHMS
#### **Purpose**: High-precision India boundary validation using actual geographic data
#### **File Size**: VERY LARGE (~2000+ lines with coordinate data)

#### **Mathematical Algorithms to Preserve**:
```typescript
// ✅ CRITICAL: Point-in-Polygon Algorithm (Ray casting)
function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// ✅ CRITICAL: Distance Calculation (Haversine formula)
function calculateDistance(
  point1: {lat: number, lng: number},
  point2: {lat: number, lng: number}
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng/2) * Math.sin(dLng/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

#### **Core Functions to Preserve**:
```typescript
✅ validateIndianCoordinates(coordinates, config): Promise<GeofenceValidationResult[]>
✅ isPointInIndia(lat: number, lng: number): Promise<boolean>
✅ loadIndiaBoundaryData(): Promise<any>
✅ calculateDistance(point1, point2): number
✅ isNearBorder(lat, lng, tolerance): Promise<boolean>
```

#### **Configuration Interface to Preserve**:
```typescript
✅ interface IndiaGeofenceConfig {
  strictMode: boolean;          // Strict boundary checking
  showWarnings: boolean;        // Display warning messages
  allowNearBorder: boolean;     // Allow near-border points
  borderTolerance: number;      // Tolerance in kilometers
}
```

#### **Data Loading Pattern to Preserve**:
```typescript
✅ // Async loading with caching - PRESERVE THIS PATTERN
let indiaBoundaryData: any = null;
let isLoading = false;

export const loadIndiaBoundaryData = async (): Promise<any> => {
  if (indiaBoundaryData) return indiaBoundaryData;

  if (isLoading) {
    await waitForLoad();
    return indiaBoundaryData;
  }

  isLoading = true;
  try {
    const response = await fetch('/india.json');  // ✅ PRESERVE FILE DEPENDENCY
    indiaBoundaryData = await response.json();
    return indiaBoundaryData;
  } finally {
    isLoading = false;
  }
};
```

### 2. **`unifiedGeofencing.ts`** ⭐ CRITICAL INTERFACE

#### **Functions Requiring Adaptation**:
```typescript
// ⚠️ ADAPT FOR NEW MAP: Google Maps specific
applyIndiaRestriction(map: google.maps.Map): void

// ✅ PRESERVE: Platform independent
getIndiaCenterPoint(): { lat: number; lng: number }
isPointInIndia(lat: number, lng: number): boolean
validateIndianCoordinates(coordinates: Coordinates[]): boolean

// ⚠️ ADAPT FOR NEW MAP: Map type specific
convertStringToMapTypeId(mapType: string): google.maps.MapTypeId
```

#### **Enhanced Features to Preserve**:
```typescript
✅ // State-based region validation - PRESERVE
validateUserRegionAccess(
  coordinates: LatLngLiteral[],
  userStates: string[],
  config?: UnifiedGeofenceConfig
): Promise<GeofenceValidationResult[]>

✅ // State identification - PRESERVE
getStateForCoordinates(lat: number, lng: number): Promise<string | null>
```

### 3. **Critical Data Dependencies**

#### **`/public/india.json`** 🔴 CRITICAL FILE
- **Status**: MUST PRESERVE EXACTLY
- **Size**: Very large (detailed coordinates)
- **Format**: GeoJSON FeatureCollection
- **Content**: MultiPolygon coordinates for India
- **Usage**: Required for precise geofencing
- **Action**: NO CHANGES - Keep exact file

#### **Boundary Data Structure to Preserve**:
```typescript
✅ interface IndiaGeoData {
  type: 'FeatureCollection';
  features: StateFeature[];
}

✅ interface StateFeature {
  type: 'Feature';
  properties: { st_nm: string; };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}
```

---

## 🔄 Geofencing Integration Patterns

### **Current Integration Examples to Adapt**:

#### **Map Integration** (ADAPT FOR NEW MAP):
```typescript
// CURRENT (Google Maps) - REPLACE
import { applyIndiaRestriction, getIndiaCenterPoint } from '../utils/unifiedGeofencing';

const map = new google.maps.Map(mapRef.current, {
  center: getIndiaCenterPoint(),  // ✅ PRESERVE
  zoom: 6,                        // ✅ PRESERVE
  restriction: {                  // ⚠️ ADAPT FOR NEW MAP
    latLngBounds: indiaBounds,
    strictBounds: true
  }
});

applyIndiaRestriction(map);       // ⚠️ ADAPT FOR NEW MAP

// NEW IMPLEMENTATION EXAMPLE (Leaflet)
import L from 'leaflet';
import { getIndiaCenterPoint, getIndiaBounds } from '../utils/unifiedGeofencing';

const map = L.map(mapRef.current, {
  center: getIndiaCenterPoint(),  // ✅ PRESERVE
  zoom: 6,                        // ✅ PRESERVE
  maxBounds: getIndiaBounds(),    // ✅ ADAPT IMPLEMENTATION
  maxBoundsViscosity: 1.0
});
```

#### **Form Validation** (PRESERVE EXACTLY):
```typescript
// ✅ PRESERVE THIS PATTERN EXACTLY
import { validateIndianCoordinates } from '../utils/preciseIndiaGeofencing';

const validateLocation = async (lat: number, lng: number) => {
  const result = await validateIndianCoordinates([{lat, lng}], {
    strictMode: true,
    showWarnings: true,
    allowNearBorder: false,
    borderTolerance: 5
  });

  if (!result[0].isValid) {
    setError(result[0].message);
    return false;
  }
  return true;
};
```

#### **Data Import Validation** (PRESERVE EXACTLY):
```typescript
// ✅ PRESERVE THIS PATTERN EXACTLY
import { validateIndianCoordinatesWithStates } from '../utils/unifiedGeofencing';

const validateImportedData = async (data: LocationData[], userStates: string[]) => {
  const coordinates = data.map(item => ({lat: item.lat, lng: item.lng}));

  const results = await validateIndianCoordinatesWithStates(coordinates, {
    strictMode: false,
    assignedStates: userStates,
    allowNearBorder: true,
    borderTolerance: 10
  });

  return results.filter(result => !result.isValid);
};
```

---

# Step-by-Step Removal Guide

## 🔄 Complete Removal Process (6 Phases, 20-Day Timeline)

### **Phase 1: Preparation and Backup** 🛡️ (Days 1-2)

#### Step 1.1: Create Backup Branch
```bash
git checkout -b backup/current-map-system
git add .
git commit -m "Backup: Complete current map system before refactoring"
git push origin backup/current-map-system

# Create working branch
git checkout -b feature/new-map-system
```

#### Step 1.2: Document Current State
```bash
# Create documentation of current imports
grep -r "ComprehensiveGoogleMapInterface" src/ > docs/current-main-map-usage.txt
grep -r "useGoogleMaps" src/ > docs/current-hook-usage.txt
grep -r "google.maps" src/ > docs/current-google-maps-usage.txt

# Find all components importing map-related files
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "ComprehensiveGoogleMapInterface\|useGoogleMaps\|unifiedGeofencing\|preciseIndiaGeofencing" > docs/components-using-maps.txt
```

#### Step 1.3: Extract Critical Data ✅ CRITICAL
```bash
# Backup critical files
cp public/india.json docs/backup-india-boundary-data.json
cp src/utils/preciseIndiaGeofencing.ts docs/backup-precise-geofencing.ts
cp src/utils/unifiedGeofencing.ts docs/backup-unified-geofencing.ts
cp src/utils/mapRestrictions.ts docs/backup-map-restrictions.ts

# Extract critical constants
grep -E "INDIA_BOUNDS|MAP_ZOOM_LIMITS|CENTER_POINT" src/utils/*.ts > docs/critical-constants.txt
```

#### Step 1.4: Analyze Dependencies
```bash
# Check package.json for Google Maps dependencies
grep -E "google|maps" package.json > docs/current-map-dependencies.txt

# Find all Google Maps type usage
grep -r "google\.maps\." src/ > docs/google-maps-types-usage.txt
```

### **Phase 2: Create New Map Foundation** 🏗️ (Days 3-5)

#### Step 2.1: Choose New Map Library
**Recommended: Leaflet + React-Leaflet**
```bash
# Install new map library
npm install leaflet react-leaflet
npm install @types/leaflet --save-dev

# Alternative: Mapbox
# npm install mapbox-gl react-map-gl
# npm install @types/mapbox-gl --save-dev
```

#### Step 2.2: Create New Base Hook
```typescript
// src/hooks/useNewMap.ts
import { useRef, useState, useCallback, useEffect } from 'react';
import L from 'leaflet';
import { getIndiaCenterPoint } from '../utils/adaptedGeofencing';

export interface NewMapConfig {
  center: [number, number];
  zoom: number;
  restriction?: {
    bounds: [[number, number], [number, number]];
    strictBounds: boolean;
  };
}

export const useNewMap = (config: NewMapConfig) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return;

    try {
      const newMap = L.map(mapRef.current, {
        center: config.center,
        zoom: config.zoom,
        zoomControl: true,
        scrollWheelZoom: true
      });

      // Add base layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(newMap);

      // Apply India restrictions if provided
      if (config.restriction) {
        newMap.setMaxBounds(config.restriction.bounds);
        newMap.setMinZoom(4);
        newMap.setMaxZoom(20);
      }

      // Mouse tracking
      newMap.on('mousemove', (e: L.LeafletMouseEvent) => {
        setMousePosition({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      setMap(newMap);
      setIsLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize map');
    }
  }, [config, map]);

  return {
    mapRef,
    map,
    isLoaded,
    error,
    mousePosition
  };
};
```

#### Step 2.3: Adapt Geofencing for New Map ✅ CRITICAL
```typescript
// src/utils/adaptedGeofencing.ts
import L from 'leaflet';
import {
  validateIndianCoordinates,
  isPointInIndia,
  loadIndiaBoundaryData
} from './preciseIndiaGeofencing'; // ✅ PRESERVE IMPORT

// ✅ PRESERVE: All mathematical functions exactly as they are
export { validateIndianCoordinates, isPointInIndia, loadIndiaBoundaryData };

// ✅ PRESERVE: India center point calculation
export const getIndiaCenterPoint = (): [number, number] => {
  return [20.5937, 78.9629]; // India geographic center
};

// ✅ PRESERVE: India bounds calculation
export const getIndiaBounds = (): [[number, number], [number, number]] => {
  return [
    [6.0, 68.0],   // Southwest corner
    [37.0, 97.0]   // Northeast corner
  ];
};

// ⚠️ ADAPT: Apply restrictions for new map library
export const applyIndiaRestriction = (map: L.Map): void => {
  const bounds = getIndiaBounds();

  map.setMaxBounds(bounds);
  map.setMinZoom(4);
  map.setMaxZoom(20);

  // Ensure map stays within bounds
  map.on('drag', () => {
    map.panInsideBounds(bounds, { animate: false });
  });
};

// ⚠️ ADAPT: Convert map type for new library
export const convertMapType = (mapType: string): string => {
  const typeMap: Record<string, string> = {
    'roadmap': 'roadmap',
    'satellite': 'satellite',
    'hybrid': 'hybrid',
    'terrain': 'terrain'
  };

  return typeMap[mapType] || 'roadmap';
};
```

#### Step 2.4: Create New Primary Map Component
```typescript
// src/components/map/NewMapInterface.tsx
import React, { useState, useCallback } from 'react';
import { useNewMap } from '../../hooks/useNewMap';
import { getIndiaCenterPoint, applyIndiaRestriction } from '../../utils/adaptedGeofencing';

export interface NewMapInterfaceProps {
  onMapReady?: (map: L.Map) => void;
  onLocationSelect?: (coordinates: { lat: number; lng: number }) => void;
  children?: React.ReactNode;
}

export const NewMapInterface: React.FC<NewMapInterfaceProps> = ({
  onMapReady,
  onLocationSelect,
  children
}) => {
  const { mapRef, map, isLoaded, error, mousePosition } = useNewMap({
    center: getIndiaCenterPoint(),
    zoom: 6,
    restriction: {
      bounds: [[6.0, 68.0], [37.0, 97.0]],
      strictBounds: true
    }
  });

  // Apply India restrictions when map is ready
  React.useEffect(() => {
    if (map && isLoaded) {
      applyIndiaRestriction(map);
      onMapReady?.(map);
    }
  }, [map, isLoaded, onMapReady]);

  // Handle map clicks
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    onLocationSelect?.({ lat: e.latlng.lat, lng: e.latlng.lng });
  }, [onLocationSelect]);

  React.useEffect(() => {
    if (map && onLocationSelect) {
      map.on('click', handleMapClick);
      return () => {
        map.off('click', handleMapClick);
      };
    }
  }, [map, handleMapClick, onLocationSelect]);

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-2">Map Error</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />

      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Mouse coordinates display */}
      {mousePosition && (
        <div className="absolute bottom-4 left-4 bg-white px-3 py-1 rounded shadow text-sm">
          {mousePosition.lat.toFixed(6)}, {mousePosition.lng.toFixed(6)}
        </div>
      )}

      {children}
    </div>
  );
};
```

### **Phase 3: Tool Migration** 🛠️ (Days 6-10)

#### Step 3.1: Migrate Distance Tool ✅ PRESERVE CALCULATIONS
```typescript
// src/components/map/NewDistanceMeasurementTool.tsx
import React, { useState, useCallback, useEffect } from 'react';
import L from 'leaflet';

// ✅ PRESERVE: Distance calculation function exactly as is
const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
  const R = 6371; // Earth's radius in kilometers
  const [lat1, lng1] = point1;
  const [lat2, lng2] = point2;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export interface DistancePoint {
  id: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
}

export interface DistanceSegment {
  startPoint: { lat: number; lng: number };
  endPoint: { lat: number; lng: number };
  distance: number;
}

interface NewDistanceMeasurementToolProps {
  map: L.Map | null;
  isActive: boolean;
  onMeasurementComplete: (data: {
    points: DistancePoint[];
    totalDistance: number;
    segments: DistanceSegment[];
  }) => void;
}

export const NewDistanceMeasurementTool: React.FC<NewDistanceMeasurementToolProps> = ({
  map,
  isActive,
  onMeasurementComplete
}) => {
  const [points, setPoints] = useState<DistancePoint[]>([]);
  const [polyline, setPolyline] = useState<L.Polyline | null>(null);
  const [markers, setMarkers] = useState<L.Marker[]>([]);

  // ✅ PRESERVE: All calculation logic
  const addPoint = useCallback((latlng: L.LatLng) => {
    const newPoint: DistancePoint = {
      id: `point_${Date.now()}`,
      lat: latlng.lat,
      lng: latlng.lng,
      x: 0, // Will be calculated based on screen position
      y: 0
    };

    setPoints(prev => {
      const newPoints = [...prev, newPoint];

      if (newPoints.length > 1) {
        // Calculate total distance and segments
        let totalDistance = 0;
        const segments: DistanceSegment[] = [];

        for (let i = 1; i < newPoints.length; i++) {
          const segmentDistance = calculateDistance(
            [newPoints[i-1].lat, newPoints[i-1].lng],
            [newPoints[i].lat, newPoints[i].lng]
          );

          segments.push({
            startPoint: { lat: newPoints[i-1].lat, lng: newPoints[i-1].lng },
            endPoint: { lat: newPoints[i].lat, lng: newPoints[i].lng },
            distance: segmentDistance
          });

          totalDistance += segmentDistance;
        }

        onMeasurementComplete({
          points: newPoints,
          totalDistance,
          segments
        });
      }

      return newPoints;
    });
  }, [onMeasurementComplete]);

  // Handle map clicks when tool is active
  useEffect(() => {
    if (!map || !isActive) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      addPoint(e.latlng);
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map, isActive, addPoint]);

  // Update polyline when points change
  useEffect(() => {
    if (!map) return;

    // Remove existing polyline
    if (polyline) {
      map.removeLayer(polyline);
    }

    // Remove existing markers
    markers.forEach(marker => map.removeLayer(marker));

    if (points.length > 0) {
      // Add markers for each point
      const newMarkers = points.map((point, index) => {
        const marker = L.marker([point.lat, point.lng], {
          icon: L.divIcon({
            className: 'distance-marker',
            html: `<div class="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">${index + 1}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(map);

        return marker;
      });

      setMarkers(newMarkers);

      // Create polyline if we have multiple points
      if (points.length > 1) {
        const newPolyline = L.polyline(
          points.map(p => [p.lat, p.lng]),
          {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.8
          }
        ).addTo(map);

        setPolyline(newPolyline);
      }
    }
  }, [map, points, polyline, markers]);

  // Clear measurements
  const clearMeasurements = useCallback(() => {
    setPoints([]);
    if (polyline && map) {
      map.removeLayer(polyline);
      setPolyline(null);
    }
    markers.forEach(marker => {
      if (map) map.removeLayer(marker);
    });
    setMarkers([]);
  }, [map, polyline, markers]);

  return (
    <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg">
      <h3 className="font-semibold mb-2">Distance Measurement</h3>

      {points.length > 0 && (
        <div className="space-y-2 text-sm">
          <p>Points: {points.length}</p>
          {points.length > 1 && (
            <p>Total Distance: {
              points.reduce((total, point, index) => {
                if (index === 0) return 0;
                return total + calculateDistance(
                  [points[index-1].lat, points[index-1].lng],
                  [point.lat, point.lng]
                );
              }, 0).toFixed(2)
            } km</p>
          )}
        </div>
      )}

      <div className="mt-3 space-x-2">
        <button
          onClick={clearMeasurements}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
```

#### Step 3.2: Migrate Other Tools (Similar Pattern)
- **Elevation Tool**: Preserve calculation logic, replace map integration
- **Polygon Tool**: Preserve area calculations, replace drawing API
- **Geofencing Tool**: Preserve ALL validation logic, update map integration

### **Phase 4: Component Updates** 🔄 (Days 11-13)

#### Step 4.1: Update Infrastructure Components
```typescript
// src/components/admin/InfrastructureDataManagement.tsx
// BEFORE
- import { ComprehensiveGoogleMapInterface } from '../map/ComprehensiveGoogleMapInterface';

// AFTER
+ import { NewMapInterface } from '../map/NewMapInterface';

// BEFORE
- <ComprehensiveGoogleMapInterface
-   center={center}
-   zoom={zoom}
-   onMapReady={handleMapReady}
-   onLocationSelect={handleLocationSelect}
- />

// AFTER
+ <NewMapInterface
+   onMapReady={handleMapReady}
+   onLocationSelect={handleLocationSelect}
+ >
+   {/* Child components */}
+ </NewMapInterface>
```

#### Step 4.2: Update All Importing Components
```bash
# Find all files importing the old map interface
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "ComprehensiveGoogleMapInterface"

# Update each file systematically
# 1. Replace import statements
# 2. Update component usage
# 3. Update prop interfaces
# 4. Test functionality
```

### **Phase 5: Remove Google Maps Dependencies** ❌ (Days 14-15)

#### Step 5.1: Remove Package Dependencies
```bash
# Remove Google Maps packages
npm uninstall @googlemaps/js-api-loader
npm uninstall @types/google.maps
npm uninstall react-google-maps
# (any other Google Maps related packages)

# Verify removal
npm ls | grep -i google || echo "No Google packages remaining"
```

#### Step 5.2: Remove Component Files (SPECIFIC ORDER)
```bash
# 1. Remove legacy/unused components first (SAFE)
rm src/components/map/BaseMap.tsx
rm src/components/map/BaseMapExample.tsx
rm src/components/map/BaseMapProvider.tsx
rm src/components/map/EnhancedGoogleMap.tsx
rm src/components/map/GoogleMapsComponent.tsx
rm src/components/map/GoogleMapControls.tsx
rm src/components/map/MapContainer.tsx
rm src/components/map/MapControlPanel.tsx
rm src/components/map/MapDataOverlay.tsx
rm src/components/map/MapStatusIndicator.tsx
rm src/components/map/MapTypeSelector.tsx
rm src/components/map/SimpleMapFallback.tsx
rm src/components/map/WorkingMapFallback.tsx
rm src/pages/BaseMapPage.tsx

# 2. Remove Google Maps specific components
rm src/components/map/GoogleMapContainer.tsx
rm src/components/map/IntegratedGoogleMapsInterface.tsx

# 3. Remove hooks (AFTER confirming no usage)
rm src/hooks/useBaseMap.ts
rm src/hooks/useGoogleMaps.ts

# 4. FINALLY remove main component (LAST)
rm src/components/map/ComprehensiveGoogleMapInterface.tsx
```

#### Step 5.3: Clean Up Imports and References
```bash
# Find and fix broken imports
grep -r "ComprehensiveGoogleMapInterface" src/ || echo "✅ All main component imports cleaned"
grep -r "useGoogleMaps" src/ || echo "✅ All hook imports cleaned"
grep -r "useBaseMap" src/ || echo "✅ All legacy hook imports cleaned"
grep -r "google\.maps" src/ || echo "✅ All Google Maps type references cleaned"

# Fix any remaining broken imports manually
```

#### Step 5.4: Update Type Definitions
```typescript
// src/components/map/types/MapInterfaces.ts

// REMOVE Google Maps types
- import { google } from 'google-maps';
- type LatLngLiteral = google.maps.LatLngLiteral;
- type Map = google.maps.Map;
- type LatLngBounds = google.maps.LatLngBounds;

// ADD new map library types
+ import * as L from 'leaflet';
+ type LatLngLiteral = { lat: number; lng: number };
+ type Map = L.Map;
+ type LatLngBounds = L.LatLngBounds;

// Update all interfaces accordingly
interface MapComponentProps {
-  center: google.maps.LatLngLiteral;
-  bounds: google.maps.LatLngBounds;
-  map: google.maps.Map;
+  center: LatLngLiteral;
+  bounds: LatLngBounds;
+  map: L.Map;
}
```

### **Phase 6: Testing and Validation** ✅ (Days 16-20)

#### Step 6.1: Functional Testing Checklist
```bash
# Map Display
- [ ] Map loads without errors
- [ ] Map displays India correctly
- [ ] Zoom controls work (4-20 levels)
- [ ] Pan is restricted to India bounds

# India Restrictions
- [ ] Cannot pan outside India
- [ ] Cannot zoom beyond limits
- [ ] Boundary validation works
- [ ] Error messages display correctly

# Tools
- [ ] Distance measurement works
- [ ] Elevation tool functions
- [ ] Polygon drawing works
- [ ] All calculations are accurate

# Data Integration
- [ ] POP/SubPOP locations display
- [ ] Location picker works
- [ ] Data import/export functions
- [ ] Infrastructure management works

# Geofencing
- [ ] Point validation works
- [ ] State restrictions function
- [ ] Border tolerance works
- [ ] All mathematical functions accurate
```

#### Step 6.2: Performance Testing
```bash
# Load Time
- [ ] Map initializes in < 3 seconds
- [ ] Tools load quickly
- [ ] No memory leaks

# Responsiveness
- [ ] Tool interactions smooth
- [ ] Large datasets handle well
- [ ] Mobile performance acceptable
```

#### Step 6.3: Data Integrity Testing
```bash
# Geofencing Accuracy
- [ ] Test known India boundary points
- [ ] Test points outside India
- [ ] Test near-border locations
- [ ] Verify state-level validation

# Mathematical Accuracy
- [ ] Distance calculations match previous system
- [ ] Elevation data accuracy maintained
- [ ] Area calculations correct
- [ ] Coordinate transformations accurate
```

---

# Critical Preservation Requirements

## ✅ **MUST PRESERVE FUNCTIONALITY** (NO COMPROMISE)

### 1. **India Boundary Restrictions** 🔴 SECURITY CRITICAL
```typescript
✅ PRESERVE EXACTLY:
- Point-in-polygon validation algorithms
- India boundary coordinate data (/public/india.json)
- Border tolerance calculations (5km default)
- State-level boundary validation
- Async boundary data loading with caching
- All geofencing error messages and user feedback

🚫 CANNOT CHANGE:
- Mathematical accuracy of boundary validation
- Security restrictions on geographic access
- India boundary data file location or format
```

### 2. **POP/SubPOP Location Management** 🔴 BUSINESS CRITICAL
```typescript
✅ PRESERVE EXACTLY:
- Location picking from map interface
- Coordinate validation before saving
- Form integration with map selection
- Data persistence to DataStore
- Integration with Infrastructure Management
- Real-time coordinate display during selection

🚫 CANNOT CHANGE:
- Data structures for POP/SubPOP locations
- Integration with Infrastructure tab
- Coordinate precision (6 decimal places)
```

### 3. **Distance/Elevation/Area Measurements** 🔴 CALCULATION CRITICAL
```typescript
✅ PRESERVE EXACTLY:
- Haversine formula for distance calculation
- All mathematical algorithms for area calculation
- Elevation profile analysis logic
- Chart generation and data visualization
- Unit conversion functions (km/miles, metric/imperial)
- Precision levels for all measurements

🚫 CANNOT CHANGE:
- Mathematical formulas or algorithms
- Calculation precision
- Unit conversion accuracy
```

### 4. **Data Import/Export Functionality** 🔴 DATA CRITICAL
```typescript
✅ PRESERVE EXACTLY:
- KML file parsing and display
- CSV import/export functionality
- JSON data format compatibility
- Excel file processing
- Coordinate validation during import
- Error handling for invalid data

🚫 CANNOT CHANGE:
- Supported file formats
- Data validation rules
- Import/export data structures
```

### 5. **User Permission System** 🔴 SECURITY CRITICAL
```typescript
✅ PRESERVE EXACTLY:
- State-based access restrictions
- User region validation
- Permission checking before map operations
- Admin-level geographic access controls
- Region assignment validation

🚫 CANNOT CHANGE:
- Permission logic or security rules
- State boundary definitions
- Access control mechanisms
```

---

## 📊 **MUST PRESERVE DATA** (EXACT PRESERVATION)

### 1. **India Boundary Data** 🔴 CRITICAL
```bash
✅ Files to preserve exactly:
- /public/india.json (NO CHANGES ALLOWED)
- All coordinate arrays and polygon definitions
- State boundary data embedded in utilities
- Geographic center point calculations
- Boundary tolerance constants

📍 Location: /public/india.json
📏 Size: ~2MB of coordinate data
🔒 Security: Must maintain exact geographic accuracy
```

### 2. **Mathematical Constants** 🔴 CRITICAL
```typescript
✅ Constants to preserve exactly:
INDIA_BOUNDS = {
  north: 37.0,    // Kashmir region
  south: 6.0,     // Tamil Nadu southern tip
  east: 97.0,     // Arunachal Pradesh
  west: 68.0      // Gujarat western border
}

MAP_ZOOM_LIMITS = {
  min: 4,         // Minimum zoom level
  max: 20,        // Maximum zoom level
  default: 6      // Default India view
}

INDIA_CENTER = [20.5937, 78.9629]  // Geographic center of India
BORDER_TOLERANCE = 5  // kilometers
EARTH_RADIUS = 6371   // kilometers for distance calculations
```

### 3. **Data Structures** 🔴 CRITICAL
```typescript
✅ Interfaces to preserve exactly:
interface GeofenceValidationResult {
  isValid: boolean;
  message?: string;
  suggestedAction?: string;
  violationType?: 'outside_india' | 'outside_assigned_region' | 'near_border' | 'invalid_coordinates';
  allowedStates?: string[];
  violatingPoint?: { lat: number; lng: number };
}

interface DistancePoint {
  id: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
}

interface ElevationData {
  lat: number;
  lng: number;
  elevation: number;
  index: number;
}
```

---

## 🚀 **PERFORMANCE REQUIREMENTS** (NO DEGRADATION)

### 1. **Map Loading Performance**
```typescript
✅ Requirements:
- Map initialization: < 3 seconds
- Tool activation: < 500ms
- Geofencing validation: < 100ms per point
- India boundary loading: < 2 seconds (with caching)
- Mouse tracking: < 16ms (60fps)

🎯 Targets:
- First map render: 1-2 seconds
- Tool switching: < 200ms
- Bulk coordinate validation: < 50ms per 100 points
```

### 2. **Memory Usage**
```typescript
✅ Requirements:
- Base map memory: < 100MB
- Boundary data cache: < 50MB
- Tool memory per active tool: < 20MB
- No memory leaks during extended use
- Garbage collection efficiency maintained
```

### 3. **Responsiveness**
```typescript
✅ Requirements:
- Drawing tools: No lag during interaction
- Pan/zoom: Smooth 60fps performance
- Large datasets: < 1 second render for 1000+ points
- Real-time coordinate display: < 16ms updates
```

---

# Testing & Validation

## ✅ **COMPREHENSIVE TESTING STRATEGY**

### **Phase 1: Unit Testing** (Mathematical Functions)

#### **Geofencing Algorithm Tests**
```typescript
// Test point-in-polygon accuracy
describe('Point-in-Polygon Validation', () => {
  test('Known India points validate as inside', () => {
    const delhiCoords = { lat: 28.6139, lng: 77.2090 };
    const mumbaiCoords = { lat: 19.0760, lng: 72.8777 };

    expect(isPointInIndia(delhiCoords.lat, delhiCoords.lng)).toBe(true);
    expect(isPointInIndia(mumbaiCoords.lat, mumbaiCoords.lng)).toBe(true);
  });

  test('Known non-India points validate as outside', () => {
    const pakistanCoords = { lat: 33.6844, lng: 73.0479 }; // Islamabad
    const chinaCoords = { lat: 39.9042, lng: 116.4074 }; // Beijing

    expect(isPointInIndia(pakistanCoords.lat, pakistanCoords.lng)).toBe(false);
    expect(isPointInIndia(chinaCoords.lat, chinaCoords.lng)).toBe(false);
  });

  test('Border points with tolerance', () => {
    // Test points near India-Pakistan border
    const borderPoint = { lat: 32.5, lng: 74.5 };

    expect(isNearBorder(borderPoint.lat, borderPoint.lng, 10)).toBe(true);
    expect(isNearBorder(borderPoint.lat, borderPoint.lng, 1)).toBe(false);
  });
});
```

#### **Distance Calculation Tests**
```typescript
describe('Distance Calculations', () => {
  test('Known distance between major cities', () => {
    const delhi = { lat: 28.6139, lng: 77.2090 };
    const mumbai = { lat: 19.0760, lng: 72.8777 };

    const distance = calculateDistance(
      [delhi.lat, delhi.lng],
      [mumbai.lat, mumbai.lng]
    );

    // Known distance ~1150km, allow 1% tolerance
    expect(distance).toBeCloseTo(1150, -1);
  });

  test('Zero distance for same point', () => {
    const point = { lat: 20.0, lng: 80.0 };
    const distance = calculateDistance(
      [point.lat, point.lng],
      [point.lat, point.lng]
    );

    expect(distance).toBe(0);
  });
});
```

### **Phase 2: Integration Testing** (Component Integration)

#### **Map Integration Tests**
```typescript
describe('New Map Integration', () => {
  test('Map initializes with India restrictions', async () => {
    const { map, isLoaded } = renderMapComponent();

    await waitFor(() => expect(isLoaded).toBe(true));

    expect(map.getMinZoom()).toBe(4);
    expect(map.getMaxZoom()).toBe(20);
    expect(map.getMaxBounds()).toEqual(getIndiaBounds());
  });

  test('Tools integrate correctly with new map', async () => {
    const { map } = renderMapWithDistanceTool();

    // Simulate distance measurement
    fireEvent.click(map, { latlng: { lat: 28.6, lng: 77.2 } });
    fireEvent.click(map, { latlng: { lat: 19.1, lng: 72.9 } });

    expect(getByText(/1150.*km/)).toBeInTheDocument();
  });
});
```

#### **Data Integration Tests**
```typescript
describe('Data Integration', () => {
  test('POP location picker works with new map', async () => {
    const onLocationSelect = jest.fn();
    const { map } = renderAddPOPForm({ onLocationSelect });

    fireEvent.click(map, { latlng: { lat: 28.6, lng: 77.2 } });

    expect(onLocationSelect).toHaveBeenCalledWith({
      lat: 28.6,
      lng: 77.2
    });
  });

  test('Infrastructure data displays correctly', async () => {
    const infraData = [
      { id: '1', lat: 28.6, lng: 77.2, type: 'pop', name: 'Delhi POP' }
    ];

    const { map } = renderInfrastructureMap({ data: infraData });

    await waitFor(() => {
      expect(getByText('Delhi POP')).toBeInTheDocument();
    });
  });
});
```

### **Phase 3: Performance Testing**

#### **Load Performance Tests**
```typescript
describe('Performance Tests', () => {
  test('Map loads within performance budget', async () => {
    const startTime = performance.now();

    const { isLoaded } = renderMapComponent();

    await waitFor(() => expect(isLoaded).toBe(true));

    const loadTime = performance.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3 second budget
  });

  test('Large dataset rendering performance', async () => {
    const largeDataset = generateTestPoints(1000);
    const startTime = performance.now();

    const { map } = renderMapWithData({ data: largeDataset });

    await waitFor(() => {
      expect(getAllByTestId('map-marker')).toHaveLength(1000);
    });

    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(1000); // 1 second budget
  });

  test('Memory usage within limits', async () => {
    const initialMemory = getMemoryUsage();

    // Load map and perform operations
    const { map } = renderMapComponent();
    await performMapOperations(map);

    const finalMemory = getMemoryUsage();
    const memoryIncrease = finalMemory - initialMemory;

    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB limit
  });
});
```

### **Phase 4: End-to-End Testing**

#### **User Workflow Tests**
```typescript
describe('Complete User Workflows', () => {
  test('Add POP location workflow', async () => {
    // 1. Navigate to Infrastructure page
    await navigateTo('/infrastructure');

    // 2. Click Add POP button
    fireEvent.click(getByText('Add POP Location'));

    // 3. Select location on map
    fireEvent.click(getByTestId('map-container'), {
      clientX: 100,
      clientY: 100
    });

    // 4. Fill form
    fireEvent.change(getByLabelText('Location Name'), {
      target: { value: 'Test POP' }
    });

    // 5. Submit
    fireEvent.click(getByText('Save Location'));

    // 6. Verify location appears
    await waitFor(() => {
      expect(getByText('Test POP')).toBeInTheDocument();
    });

    // 7. Verify geofencing worked
    expect(getByTestId('validation-success')).toBeInTheDocument();
  });

  test('Distance measurement workflow', async () => {
    // 1. Activate distance tool
    fireEvent.click(getByText('Distance Tool'));

    // 2. Click multiple points
    const mapContainer = getByTestId('map-container');
    fireEvent.click(mapContainer, { clientX: 100, clientY: 100 });
    fireEvent.click(mapContainer, { clientX: 200, clientY: 200 });

    // 3. Verify distance display
    await waitFor(() => {
      expect(getByText(/Total Distance:/)).toBeInTheDocument();
    });

    // 4. Verify calculation accuracy
    const distanceText = getByText(/\d+\.\d+ km/);
    expect(distanceText).toBeInTheDocument();
  });
});
```

---

# Migration Timeline & Checklist

## 📅 **20-Day Migration Timeline**

### **Week 1: Preparation & Foundation**

#### **Days 1-2: Preparation** 🛡️
- [ ] **Day 1**: Create backup branch and document current state
- [ ] **Day 1**: Extract critical data and constants
- [ ] **Day 2**: Analyze dependencies and create migration plan
- [ ] **Day 2**: Choose new map library and install dependencies

#### **Days 3-5: Foundation** 🏗️
- [ ] **Day 3**: Create new base hook (`useNewMap`)
- [ ] **Day 3**: Adapt geofencing utilities for new map
- [ ] **Day 4**: Create new primary map component
- [ ] **Day 4**: Test basic map functionality and India restrictions
- [ ] **Day 5**: Create coordinate display and basic tools integration

### **Week 2: Tool Migration & Component Updates**

#### **Days 6-8: Tool Migration** 🛠️
- [ ] **Day 6**: Migrate distance measurement tool
- [ ] **Day 7**: Migrate elevation tool
- [ ] **Day 8**: Migrate polygon drawing tool

#### **Days 9-10: Advanced Tools** 🔧
- [ ] **Day 9**: Update geofencing system integration
- [ ] **Day 9**: Migrate KML layer manager
- [ ] **Day 10**: Update floating tool panel and multi-tool manager
- [ ] **Day 10**: Test all tools with new map system

### **Week 3: Component Updates & Cleanup**

#### **Days 11-13: Component Updates** 🔄
- [ ] **Day 11**: Update Infrastructure Management components
- [ ] **Day 12**: Update Data Manager integration
- [ ] **Day 12**: Update AddPOPLocationForm and location picker
- [ ] **Day 13**: Update all remaining components importing map files
- [ ] **Day 13**: Fix all import references and type definitions

#### **Days 14-15: Cleanup** ❌
- [ ] **Day 14**: Remove Google Maps package dependencies
- [ ] **Day 14**: Remove legacy and unused component files
- [ ] **Day 15**: Remove Google Maps specific components and hooks
- [ ] **Day 15**: Clean up imports and update type definitions

### **Week 4: Testing & Validation**

#### **Days 16-18: Core Testing** ✅
- [ ] **Day 16**: Unit testing (mathematical functions, algorithms)
- [ ] **Day 17**: Integration testing (component integration, data flow)
- [ ] **Day 18**: Performance testing (load time, memory usage, responsiveness)

#### **Days 19-20: Final Validation** 🎯
- [ ] **Day 19**: End-to-end testing (complete user workflows)
- [ ] **Day 19**: Cross-browser compatibility testing
- [ ] **Day 20**: Final validation and bug fixes
- [ ] **Day 20**: Documentation updates and deployment preparation

---

## 📋 **Detailed Checklists**

### **Pre-Migration Checklist** ✅
- [ ] **Backup Created**: Current system backed up in separate branch
- [ ] **Dependencies Documented**: All current imports and usage mapped
- [ ] **Critical Data Extracted**: Constants, algorithms, and data files saved
- [ ] **New Library Chosen**: Map library selected and researched
- [ ] **Team Alignment**: All stakeholders informed of migration plan

### **Foundation Checklist** 🏗️
- [ ] **New Hook Created**: Base map hook implemented and tested
- [ ] **Geofencing Adapted**: India restrictions working with new map
- [ ] **Basic Map Working**: Map loads, displays, and responds correctly
- [ ] **Performance Baseline**: Initial performance metrics established
- [ ] **Error Handling**: Basic error handling and fallbacks implemented

### **Tool Migration Checklist** 🛠️
- [ ] **Distance Tool**: Mathematical accuracy preserved, new map integration working
- [ ] **Elevation Tool**: Chart generation working, elevation data accurate
- [ ] **Polygon Tool**: Area calculations correct, drawing functionality smooth
- [ ] **Geofencing**: All validation logic preserved, map integration updated
- [ ] **Tool Coordination**: Multi-tool manager working with new system

### **Component Update Checklist** 🔄
- [ ] **Infrastructure Management**: All map integration points updated
- [ ] **Data Manager**: Data visualization working with new map
- [ ] **Location Forms**: Map location picker functional
- [ ] **Admin Components**: Administrative map tools working
- [ ] **Type Definitions**: All TypeScript interfaces updated

### **Cleanup Checklist** ❌
- [ ] **Package Dependencies**: Google Maps packages removed
- [ ] **Legacy Components**: Unused components deleted
- [ ] **Google Maps Components**: All Google Maps specific code removed
- [ ] **Import References**: All broken imports fixed
- [ ] **Type Errors**: All TypeScript errors resolved

### **Testing Checklist** ✅
- [ ] **Unit Tests**: All mathematical functions tested
- [ ] **Integration Tests**: Component integration verified
- [ ] **Performance Tests**: Performance requirements met
- [ ] **E2E Tests**: Complete user workflows functional
- [ ] **Cross-Browser**: Compatibility across target browsers

### **Final Validation Checklist** 🎯
- [ ] **Functionality**: All original features working
- [ ] **Performance**: No performance degradation
- [ ] **Security**: India restrictions and geofencing working
- [ ] **Data Integrity**: All data structures and calculations accurate
- [ ] **User Experience**: UI/UX equivalent or improved

---

## 🚨 **Critical Success Criteria**

### **Technical Requirements** ✅
1. **Zero Functionality Loss**: Every current feature must work identically
2. **Performance Maintained**: No degradation in load time or responsiveness
3. **Mathematical Accuracy**: All calculations must remain precise
4. **Security Preserved**: India boundary restrictions must function identically
5. **Data Integrity**: No loss or corruption of any data

### **Business Requirements** ✅
1. **User Workflows**: All user workflows must function without changes
2. **Data Compatibility**: All existing data must continue to work
3. **Integration Points**: All external integrations must continue working
4. **Compliance**: All geographic and security requirements met
5. **Scalability**: System must handle same or larger data loads

### **Quality Requirements** ✅
1. **Code Quality**: Clean, maintainable code architecture
2. **Documentation**: Complete documentation of new system
3. **Testing Coverage**: Comprehensive test suite for all functionality
4. **Error Handling**: Robust error handling and user feedback
5. **Monitoring**: Logging and monitoring for new system

---

## 🛠️ **Emergency Rollback Plan**

### **Rollback Triggers**
- Critical functionality broken for > 2 hours
- Performance degradation > 50%
- Security features compromised
- Data corruption or loss detected
- Geofencing accuracy compromised

### **Rollback Steps**
1. **Immediate**: Switch to backup branch
2. **Database**: Restore any data if needed
3. **Dependencies**: Reinstall Google Maps packages
4. **Testing**: Verify original system functionality
5. **Communication**: Notify stakeholders of rollback

### **Post-Rollback Analysis**
1. **Root Cause**: Identify what caused the rollback
2. **Fix Strategy**: Plan fixes for identified issues
3. **Testing Plan**: Enhanced testing before next attempt
4. **Timeline Adjustment**: Revised migration timeline
5. **Risk Mitigation**: Additional safeguards for next attempt

---

*Generated for: Complete Map System Refactoring and Replacement*
*Timeline: 20-day comprehensive migration*
*Status: Ready for execution*