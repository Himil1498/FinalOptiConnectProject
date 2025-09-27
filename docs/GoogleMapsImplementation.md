# Google Maps Implementation in OptiConnect Project

## Overview

The OptiConnect project integrates Google Maps JavaScript API extensively for GIS-based telecom infrastructure management. The implementation uses React, TypeScript, and the `@googlemaps/react-wrapper` library for seamless integration. Key features include:

- **Interactive Mapping**: Enhanced Google Maps with custom controls, zoom, map types (roadmap, satellite, hybrid, terrain), and styling (default, dark, retro).
- **India-Centric Focus**: Strict geofencing to India boundaries using GeoJSON data (`india.json`, `india-boundary.geojson`), with state-level restrictions.
- **Performance Optimizations**: Debounced event handlers, memoized callbacks, and conditional rendering.
- **Error Handling**: Loading states, API key validation, and fallback components.
- **Geofencing**: Unified system for boundary enforcement, state assignments, and violation detection.
- **Integration Points**: Used in pages like `BaseMapPage.tsx`, `InfrastructurePage.tsx`, and admin components for data visualization, marker placement, and KML layer management.

The core entry point is `EnhancedGoogleMapContainer` in `src/components/map/EnhancedGoogleMap.tsx`, which wraps the map and handles API loading. Legacy components like `GoogleMapContainer.tsx` exist but appear underutilized.

Environment setup requires `REACT_APP_GOOGLE_MAPS_API_KEY` in `.env`, with enabled APIs: Maps JavaScript API, Places API, Geometry Library, Drawing Library.

## Core Implementation Flow

1. **API Loading**: Uses `@googlemaps/react-wrapper` with `Loader` from `@googlemaps/js-api-loader` in hooks like `useGoogleMaps.ts`.
2. **Map Initialization**: Creates `google.maps.Map` instance with options (center: India ~20.59° N, 78.96° E; zoom: 5; restrictions: India bounds).
3. **Event Handling**: Debounced listeners for `center_changed`, `zoom_changed`, `mousemove` (for coordinates), `click` (with geofence validation).
4. **Rendering**: Wrapper handles statuses (LOADING, FAILURE) with custom UI; falls back to error components if API key invalid.
5. **State Management**: Redux (`store/slices/mapSlice.ts`) for center/zoom; React Context for shared map state.
6. **Geofencing Enforcement**: Applied via `mapOptions.restriction` and custom validation in utils/hooks.

## Related Components

### Main Map Components (`src/components/map/`)
- **EnhancedGoogleMap.tsx** (Primary): Core enhanced map with controls, coordinate display, region restrictions. Uses `Wrapper`, Redux dispatchers (`setMapCenter`, `setMapZoom`). Renders `MapControlPanel`, `MapTypeSelector`, `CoordinateDisplayWidget`.
  - Props: `center`, `zoom`, `controls`, `settings`, `coordinateDisplay`, `regionRestriction`, `eventHandlers`.
  - Used in: `BaseMapExample.tsx` (demo), potentially in dashboards.
- **GoogleMapContainer.tsx** (Legacy): Basic container with tower markers, KML layers, India boundary overlay. Loads GeoJSON, adds markers/circles for towers. Uses Redux for towers/layers.
  - Features: Info windows, coverage circles, boundary data layer.
  - Used in: Older infrastructure views; appears semi-deprecated.
- **GeofencingSystem.tsx**: SVG-based overlay for state boundaries (assigned vs. restricted). Uses ray-casting for point-in-polygon checks. Integrates with `useGeofencing` hook.
  - Props: `assignedStates`, `isActive`, `mapWidth/Height`, `onGeofenceViolation`.
  - Used in: Admin/user region management components.
- **BaseMap.tsx / BaseMapExample.tsx / BaseMapProvider.tsx**: Basic wrappers and providers for map context. `BaseMapProvider` uses React Context for state sharing.
  - Used in: `BaseMapPage.tsx` for demo.
- **MapControlPanel.tsx / MapControlsPanel.tsx**: Custom UI panels for zoom, reset, map type/style switching.
- **CoordinateDisplayWidget.tsx / LiveCoordinateDisplay.tsx**: Real-time lat/lng display (decimal/DMS formats) on mouse hover.
- **MapTypeSelector.tsx**: Dropdown for map types and styles (dark/retro).
- **KMLLayerManager.tsx**: Handles KML file loading (`pop_location.kml`, `sub_pop_location.kml`) and layer toggling.
- **Other Tools**: `PolygonDrawingTool.tsx`, `DistanceMeasurementTool.tsx`, `ElevationTool.tsx` – Integrate Google Maps Drawing Library and Geometry Library.
- **Overlays/Interfaces**: `ComprehensiveGoogleMapInterface.tsx`, `IntegratedGoogleMapsInterface.tsx` – Advanced wrappers with multi-tool support.
- **Fallbacks**: `SimpleMapFallback.tsx`, `WorkingMapFallback.tsx` – Render if Google Maps fails.

### Components Using Google Maps
- **Pages**:
  - `BaseMapPage.tsx`: Renders `BaseMapExample` for interactive demo; showcases controls and markers.
  - `InfrastructurePage.tsx`: Uses `InfrastructureDataManagement` (admin component) for KML/infrastructure visualization on map.
  - `Dashboard.tsx` / `DataManagerPage.tsx`: Likely embed maps for data overlays (inferred from Redux integration).
- **Admin Components** (`src/components/admin/`):
  - `InfrastructureDataManagement.tsx`: Manages KML layers, markers; toggles visibility; adds locations with geofence checks.
- **Data Components** (`src/components/data/`):
  - `DataMapVisualization.tsx`: Visualizes data (towers, POP locations) on map.
- **Common Components**:
  - `MapSearchBox.tsx`: Places API integration for search.
  - `FloatingToolPanel.tsx` / `MapToolsPanel.tsx`: Toolboxes with map interactions.

## Hooks

- **useGoogleMaps.ts** (`src/hooks/`): Custom hook for map initialization, India boundary loading (GeoJSON parsing), mouse tracking, geofence validation (`isPointInIndia`). Returns map instance, controls (`panTo`, `addMarker`, `addPolygon`).
  - Dependencies: `unifiedGeofencing.ts` for restrictions; loads `/india.json`.
  - Used in: Core map components like `EnhancedGoogleMap.tsx`.
- **useBaseMap.ts**: Context-based hook for base map state (center, zoom, markers). Integrates with `BaseMapProvider`.
  - Used in: `BaseMap.tsx` family.
- **useUnifiedGeofencing.ts**: Manages state assignments, violation logging. Uses ray-casting on GeoJSON.
  - Used in: `GeofencingSystem.tsx`, admin panels.
- **useKMLLayers.ts**: Loads and toggles KML overlays (POP/sub-POP locations).
  - Used in: `KMLLayerManager.tsx`, infrastructure management.
- **Other Related**: `useInfrastructureData.ts` (fetches tower data for markers), `useLayoutState.ts` (map resizing).

## Utilities (`src/utils/`)

- **unifiedGeofencing.ts**: Core geofencing logic. Loads `/india.json` and `/india-boundary.geojson`; ray-casting for point-in-polygon/MultiPolygon; Haversine distance; validates points/states. Exports `validateGeofence`, `isPointInIndia`, `applyIndiaRestriction`.
  - Key Functions: `loadIndiaStatesData`, `isPointInMultiPolygon`, `createBounds`, `preloadGeofenceData`.
  - Used in: All geofencing hooks/components; map restrictions.
- **mapRestrictions.ts**: Legacy bounds creation (`createRegionRestriction`), India bounds enforcement.
  - Used in: Older map setups; partially superseded by unifiedGeofencing.
- **indiaGeofencing.ts / preciseIndiaGeofencing.ts**: State-specific checks; polygon validation for assigned regions.
  - Used in: User region management (`useUserRegionManagement.ts`).
- **markerUtils.ts**: Creates compatible markers/icons for towers (status-based colors).
  - Used in: `GoogleMapContainer.tsx`, data visualization.
- **kmlParser.ts**: Parses KML files for layers (e.g., POP locations).
  - Used in: `KMLLayerManager.tsx`.

## Geofencing System

- **Overview**: Enforces India-only interactions; user-specific state restrictions (e.g., assignedStates: ['Maharashtra', 'Karnataka']).
- **Data Sources**:
  - `/public/india.json`: State boundaries (FeatureCollection with MultiPolygon geometries).
  - `/public/india-boundary.geojson`: National boundaries.
  - `/public/pop_location.kml` / `sub_pop_location.kml`: Telecom site overlays.
- **Validation Flow**:
  1. Bounds check (`isWithinIndiaBounds`).
  2. Precise polygon check (`isPointInMultiPolygon` via ray-casting).
  3. State assignment check (`isPointInAssignedStates`).
  4. Violation: Triggers notifications; blocks actions (clicks, markers).
- **Files**:
  - Components: `GeofencingSystem.tsx` (SVG overlay), `RegionAssignmentSystem.tsx` (admin).
  - Hooks: `useUnifiedGeofencing.ts`, `useUserRegionManagement.ts`.
  - Utils: `unifiedGeofencing.ts`, `indiaGeofencing.ts`, `preciseIndiaGeofencing.ts`, `userRegionManagement.ts`.
  - Integration: Applied in map options (`restriction: { latLngBounds, strictBounds: true }`); click listeners validate via `validateGeofence`.

## Used vs Unused Files

### Used (Actively Integrated)
- **Components** (`src/components/map/`): EnhancedGoogleMap.tsx, GoogleMapContainer.tsx (legacy but functional), GeofencingSystem.tsx, BaseMap.tsx, MapControlPanel.tsx, CoordinateDisplayWidget.tsx, MapTypeSelector.tsx, KMLLayerManager.tsx, PolygonDrawingTool.tsx.
- **Hooks**: useGoogleMaps.ts, useBaseMap.ts, useUnifiedGeofencing.ts, useKMLLayers.ts, useInfrastructureData.ts.
- **Utils**: unifiedGeofencing.ts, mapRestrictions.ts, markerUtils.ts, kmlParser.ts, indiaGeofencing.ts, preciseIndiaGeofencing.ts.
- **Pages**: BaseMapPage.tsx, InfrastructurePage.tsx.
- **Public Assets**: india.json, india-boundary.geojson, pop_location.kml, sub_pop_location.kml.
- **Docs**: GOOGLE_MAPS_INTEGRATION.md (detailed guide).
- **Types**: src/components/map/types/MapInterfaces.ts (map props/interfaces).

### Unused/Deprecated (Inferred from Lack of Imports/References)
- **Components** (`src/components/map/`): BaseMapExample.tsx (demo-only, not production), WorkingMapFallback.tsx (rarely triggered), ComprehensiveGoogleMapInterface.tsx / IntegratedGoogleMapsInterface.tsx (advanced, possibly prototypes), CustomMapControls.tsx (overlaps with MapControlPanel), DistanceMeasurementTool.tsx / ElevationTool.tsx (tools not fully integrated), MultiToolManager.tsx / WorkflowManager.tsx (incomplete).
- **Hooks** (`src/components/map/hooks/`): useMapEventHandlers.ts (basic events, superseded by useGoogleMaps).
- **Utils**: lightThemeHelper.ts (map styling partial), resizeObserverErrorHandler.ts (map resize handling unused).
- **Other**: src/components/map/types/ (minimal usage beyond MapInterfaces.ts).

To confirm usage, grep for imports (e.g., `grep -r "EnhancedGoogleMap" src/` yields references in pages/demos).

## File Dependencies Graph

### High-Level Connections
```
Public Assets
├── india.json ──> unifiedGeofencing.ts (loadIndiaStatesData) ──> useGoogleMaps.ts (boundary polygons)
├── india-boundary.geojson ──> unifiedGeofencing.ts (loadIndiaBoundaryData) ──> GeofencingSystem.tsx (ray-casting)
└── *.kml ──> kmlParser.ts ──> KMLLayerManager.tsx ──> InfrastructureDataManagement.tsx

Core Hooks/Utils
├── useGoogleMaps.ts ──> unifiedGeofencing.ts (isPointInIndia, applyIndiaRestriction)
│   ├── mapRestrictions.ts (convertMapTypeIdToString)
│   └── markerUtils.ts (createCompatibleMarker)
├── useUnifiedGeofencing.ts ──> indiaGeofencing.ts (state checks) ──> userRegionManagement.ts
└── useBaseMap.ts ──> BaseMapProvider.tsx (context)

Components
├── EnhancedGoogleMap.tsx ──> useGoogleMaps.ts (initialization)
│   ├── MapControlPanel.tsx (zoom/reset handlers)
│   ├── MapTypeSelector.tsx (type/style changes)
│   └── CoordinateDisplayWidget.tsx (mouse events)
├── GoogleMapContainer.tsx ──> markerUtils.ts (towers) ──> Redux (mapSlice: towers/layers)
├── GeofencingSystem.tsx ──> useGeofencing (hook) ──> unifiedGeofencing.ts (validatePoint)
└── KMLLayerManager.tsx ──> useKMLLayers.ts ──> kmlParser.ts

Pages/Integration
├── BaseMapPage.tsx ──> BaseMapExample.tsx ──> BaseMap.tsx ──> useBaseMap.ts
└── InfrastructurePage.tsx ──> InfrastructureDataManagement.tsx ──> GoogleMapContainer.tsx + KMLLayerManager.tsx

Redux/Context
├── store/slices/mapSlice.ts ──> EnhancedGoogleMap.tsx (setMapCenter/Zoom)
└── DataStoreContext.tsx ──> InfrastructurePage.tsx (getDataByType for KML/infra)
```

### Detailed Import Paths (Examples)
- `EnhancedGoogleMap.tsx` imports: `@googlemaps/react-wrapper`, `useSelector/useDispatch` (Redux), `unifiedGeofencing.ts` (restrictions), `./MapControlPanel.tsx`, `./CoordinateDisplayWidget.tsx`.
- `useGoogleMaps.ts` imports: `@googlemaps/js-api-loader`, `unifiedGeofencing.ts` (loadIndiaBoundary, isPointInIndia).
- `GeofencingSystem.tsx` imports: None direct from Google Maps; uses custom ray-casting on GeoJSON.
- `InfrastructureDataManagement.tsx` (inferred): Imports `GoogleMapContainer.tsx`, `KMLLayerManager.tsx`, `useInfrastructureData.ts`.

## Public Assets and Configuration

- **GeoJSON/KML Files** (`public/`):
  - `india.json`: State polygons for geofencing.
  - `india-boundary.geojson`: National outline.
  - `pop_location.kml` / `sub_pop_location.kml`: Telecom POP/sub-POP sites.
- **Config**: `REACT_APP_GOOGLE_MAPS_API_KEY`; libraries: `['geometry', 'places', 'drawing']`; version: `weekly`.
- **Styles**: Custom in `EnhancedGoogleMap.tsx` (dark/retro arrays); global CSS in `src/styles/`.

## Recommendations
- Migrate legacy `GoogleMapContainer.tsx` to `EnhancedGoogleMap.tsx` for consistency.
- Preload GeoJSON in app init (`preloadGeofenceData`) for faster validation.
- Add tests for geofencing (e.g., unit tests for `isPointInMultiPolygon`).
- Monitor API quotas via Google Cloud Console.

For full code examples, refer to `docs/GOOGLE_MAPS_INTEGRATION.md`.
