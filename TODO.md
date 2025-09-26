# Geofencing Implementation Plan

## Current Status
- Multiple geofencing systems exist (custom SVG, bounds, unified hook)
- Tools don't validate points before activation
- Map clicks not restricted to assigned regions
- Users can see assigned regions but tools work everywhere

## Tasks

### 1. Integrate useUnifiedGeofencing in ComprehensiveGoogleMapInterface.tsx
- [ ] Import useUnifiedGeofencing hook
- [ ] Initialize with assignedStates and user config
- [ ] Replace custom useGeofencing with unified system
- [ ] Remove duplicate GeofencingSystem components
- [ ] Add validation to handleToolActivation for each tool
- [ ] Add validation to handleSearchResultSelect and handleNavigateToLocation
- [ ] Add validation to handleLocationAdd in InfrastructureDataManagement

### 2. Update Tool Components for Validation
- [ ] DistanceMeasurementTool.tsx: Add point validation on click
- [ ] PolygonDrawingTool.tsx: Add point validation on vertex placement
- [ ] ElevationTool.tsx: Add point validation on analysis points

### 3. Enhance Map Click Validation
- [ ] GoogleMapContainer.tsx: Add click validation using unified system
- [ ] Ensure notifications are shown for violations

### 4. Update User Region Assignment Display
- [ ] Ensure assigned regions are highlighted properly
- [ ] Show user their assigned regions on login

### 5. Testing
- [ ] Test with admin user (no restrictions)
- [ ] Test with user assigned to specific states
- [ ] Test tool activation outside assigned regions
- [ ] Test map clicks outside regions
- [ ] Verify notifications appear correctly

### 6. Cleanup
- [ ] Remove redundant geofencing code
- [ ] Ensure consistent error handling
- [ ] Update documentation
