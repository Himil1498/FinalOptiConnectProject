# Geofencing Implementation Plan

## Current Status
- Multiple geofencing systems exist (custom SVG, bounds, unified hook)
- Tools don't validate points before activation
- Map clicks not restricted to assigned regions
- Users can see assigned regions but tools work everywhere

## Tasks

### 1. Create Unified Geofencing Hook
- [ ] Create `src/hooks/useUnifiedGeofencing.ts` with combined bounds + state validation
- [ ] Add logging and notifications for violations
- [ ] Return { validatePoint, isValidRegion, violations, clearViolations, isDataLoaded }

### 2. Update ComprehensiveGoogleMapInterface.tsx
- [ ] Import/use `useUnifiedGeofencing(assignedStates, isGeofencingActive)`
- [ ] Remove duplicate GeofencingSystem renders; keep one
- [ ] Add validation to `handleToolActivation`: prevent if invalid region + notify
- [ ] Add validation to `handleSearchResultSelect`/`handleNavigateToLocation`
- [ ] Add validation to `handleLocationAdd` in InfrastructureDataManagement
- [ ] Remove custom `useGeofencing` calls; use unified
- [ ] Ensure admin bypass: if isAdmin, always valid

### 3. Update Tool Components for Validation
- [ ] DistanceMeasurementTool.tsx: Add point validation on click
- [ ] PolygonDrawingTool.tsx: Add point validation on vertex placement
- [ ] ElevationTool.tsx: Add point validation on analysis points

### 4. Enhance Map Click Validation
- [ ] GoogleMapContainer.tsx: Add click validation using unified system
- [ ] Ensure notifications are shown for violations

### 5. Update User Region Assignment Display
- [ ] Ensure assigned regions are highlighted properly
- [ ] Show user their assigned regions on login

### 6. Testing
- [ ] Test with admin user (no restrictions)
- [ ] Test with user assigned to specific states
- [ ] Test tool activation outside assigned regions
- [ ] Test map clicks outside regions
- [ ] Verify notifications appear correctly

### 7. Cleanup
- [ ] Remove redundant geofencing code
- [ ] Ensure consistent error handling
- [ ] Update documentation
