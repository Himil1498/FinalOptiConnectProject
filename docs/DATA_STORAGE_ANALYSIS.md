# Data Storage Analysis for OptiConnect

This document analyzes the current data storage patterns in the OptiConnect frontend, categorizing data based on storage mechanisms: localStorage (persistent client-side), React state (transient in-memory), and data not stored (ephemeral). It also estimates the number of APIs needed for backend integration to persist relevant data, building on the BACKEND_INTEGRATION.md.

The analysis is based on code searches across the project:
- localStorage usages in hooks (useTheme, useTempDataState, useLayoutState), contexts (DataStoreContext), components (PanelManager, DraggablePanel), and store slices (userManagementSlice).
- useState patterns in components for UI states.
- Inferred non-stored data from component logic.

## 1. Data Stored in localStorage

localStorage is used for client-side persistence, especially in development mode. Data here survives browser refreshes but is limited to ~5-10MB per domain and is synchronous/blocking.

### Key Usages and Data Types:
- **User Preferences and UI State**:
  - Theme and accessibility settings (e.g., `opti-connect-accessibility` key in useTheme.ts): Includes contrast modes, font sizes, etc.
  - Layout configurations (useLayoutState.ts): Sidebar collapsed (`sidebarCollapsed`), footer collapsed (`footerCollapsed`).
  - Panel states (PanelManager.tsx, DraggablePanel.tsx): Panel positions, dimensions, minimized/maximized states (`panel-${id}`), custom layouts (`panel-manager-layouts`).

- **Application Data (Dev Mode Fallback)**:
  - Temporary/unsaved data (useTempDataState.ts): `opticonnect_temp_data` – Holds transient items like measurements or imports before saving.
  - Overall saved data (DataStoreContext.tsx): `opticonnect_saved_data` – Core datasets including infrastructure, measurements (distance, elevation, polygons), KML layers.
  - User Management (userManagementSlice.ts): 
    - Users list (`STORAGE_KEYS.USERS`).
    - User groups (`STORAGE_KEYS.USER_GROUPS`).
    - User region configurations (`STORAGE_KEYS.USER_REGION_CONFIGS`).

- **Other**:
  - Environment mode and tokens (from BACKEND_INTEGRATION.md DataCenter): `opticonnect_mode`, `opticonnect_token`, user profile (`opticonnect_user`), config (`opticonnect_config`), infrastructure (`opticonnect_infrastructure`).

### Characteristics:
- Persisted across sessions.
- User-specific (no multi-device sync without backend).
- Used as fallback in production/maintenance modes.
- Potential Issues: No encryption (sensitive data like tokens exposed), quota limits for large datasets (e.g., KML files).

## 2. Data Stored in React State

React state (via useState, useReducer, Redux) manages transient, session-bound data. It's in-memory only, lost on refresh unless synced to localStorage/Redux persist.

### Key Usages and Data Types:
- **UI Interaction States** (useState in most components):
  - Search and Filters: Query strings, results, suggestions, history (ComprehensiveSearchSystem.tsx: `searchQuery`, `searchResults`, `suggestions`, `searchHistory`, `savedSearches`, `searchFilters`); role/status filters (UserList.tsx).
  - Selections and Views: Selected items (EnhancedDataManager.tsx: `selectedItems`, `currentItem`); active tabs/views (AddPOPLocationForm.tsx: `currentTab`; DataManager.tsx: `activeView`; EnhancedDataManager.tsx: `activeTab`, `viewMode`).
  - Forms and Inputs: Form data (AddPOPLocationForm.tsx: `formData`; edit forms in EnhancedDataManager.tsx); temp names (ImprovedExportManager.tsx: `tempDataName`).
  - Loading and Modals: Flags like `isLoading`, `isSearching`, `showDialogs` (e.g., EnhancedDataManager.tsx: multiple show* states; BaseMap.tsx: `isLoading`).
  - Export/Import States: Export options, selected formats, preview (EnhancedExportManager.tsx: `options`, `isExporting`, `showPreview`; ImprovedExportManager.tsx: `exportType`, `filterType`, `exportFormat`).

- **Component-Specific Data**:
  - Map States (BaseMap.tsx, BaseMapProvider.tsx): `map`, `mapCenter`, `mapZoom`, `mapType`, `markers`, `overlays`, `isMapReady`.
  - Workflow and Tools: Selected presets (WorkflowPresets.tsx: `selectedPreset`, `newWorkflowName`); tool filters (DataManager.tsx: `toolFilter`).
  - Data Management: Versions, comparisons (VersionHistory.tsx: `versions`, `selectedVersion`, `compareMode`); permissions (PermissionManager.tsx: `permissions`, `searchQuery`, `activeTab`); imported data (EnhancedDataManager.tsx: `importedData`).
  - Temp Viewer: Selected/moving items (TempDataViewer.tsx: `selectedItems`, `isMoving`).
  - Visualization: Selected items, filters, toolbox (DataMapVisualization.tsx: `selectedItem`, `showToolbox`, `activeFilters`).

- **Redux Store States** (from slices like authSlice, userManagementSlice, infrastructureSlice):
  - Auth: User data, tokens.
  - Infrastructure: Items, loading, errors.
  - Environment: Mode, online status.

### Characteristics:
- Ephemeral: Lost on refresh (unless persisted via Redux Persist or localStorage hooks).
- Performance-focused: For real-time UI updates.
- Scoped: Component or global (Redux).

## 3. Data Not Stored

Data that exists only in memory during runtime, not persisted to localStorage or backend. Typically for performance or one-off computations.

### Key Types:
- **Real-Time Interactions**:
  - Current map drawing/measurements in progress (e.g., ongoing polygon drawing in PolygonDrawingTool.tsx, distance points before save in DistanceMeasurementTool.tsx).
  - Live coordinate displays or tool activations (LiveCoordinateDisplay.tsx, MapToolsPanel.tsx).
  - Temporary calculations: Elevation results during tool use (ElevationTool.tsx), distance computations not yet saved.

- **Unsynchronized States**:
  - Unsaved form inputs or edits (e.g., before submit in forms).
  - Preview data (e.g., export previews in EnhancedExportManager.tsx before finalizing).
  - Event handlers or refs (e.g., useRef for DOM elements like map refs in BaseMap.tsx).

- **Derived/Computed Data**:
  - Filtered/sorted views of data (e.g., memoized results in useMemo for search or lists).
  - Session-only analytics or performance metrics (useAnalytics.ts).
  - Temporary overlays or markers on map (cleared on unmount).

### Characteristics:
- Volatile: Lost immediately on component unmount or refresh.
- No persistence needed: For UX fluidity.
- Potential Loss: Users may lose unsaved work; mitigated by auto-save prompts.

## 4. API Requirements for Backend Integration

To migrate persistent data (primarily from localStorage) to backend, we need CRUD APIs. Transient React state doesn't require APIs unless it represents unsaved changes to be synced. Ephemeral data needs no APIs.

The existing BACKEND_INTEGRATION.md outlines ~20 core APIs (auth, users, infrastructure, regions, permissions, audit, analytics, config). Additional APIs based on analysis:

### Core Entities and Estimated APIs:
- **Users & Groups** (from userManagementSlice): Already covered (4-6 APIs: list/create/update/delete users/groups).
- **Infrastructure & Saved Data** (DataStoreContext): Core (8 APIs: GET/POST/PUT/DELETE for infrastructure; plus share for permissions).
- **Regions & Permissions** (userManagementSlice, PermissionManager): Covered (4-6 APIs).
- **Temp/Unsaved Data**: Optional sync API (2: POST temp, GET temp) – but temp data might remain client-side.
- **UI Preferences (Theme/Layout/Panels)**: New (4 APIs: GET/POST/PUT user preferences/config; integrate into system_config or user profile).
- **Workflow Presets & Search History**: New if persisted (4 APIs: CRUD for presets; 2 for search history if user-specific).
- **Audit & Analytics**: Covered (4 APIs).

### Total Estimated APIs:
- **Minimum (Core Data)**: 20 (as in existing MD) – Covers users, infrastructure, regions, auth, config.
- **Full (Including UI/Workflow)**: 25-30 – Add 5 for preferences (theme/layout), 4 for workflows/search.
- **CRUD Pattern**: For each entity: GET (list/filter), POST (create), PUT (update), DELETE (remove) – ~4 per entity.
- **Additional Endpoints**:
  - `/api/preferences` (CRUD for theme/layout/panels).
  - `/api/workflows` (CRUD for presets).
  - `/api/search/history` (GET/POST user search history).
  - Bulk operations: `/api/bulk/import`, `/api/bulk/export` (for data manager).

### Integration Notes:
- Use DataCenter (from BACKEND_INTEGRATION.md) to switch: localStorage for dev, API for prod.
- Sync Strategy: On mode switch, migrate localStorage to API (e.g., bulk POST for saved_data).
- Security: User-owned data (add `owner_id` to models); permissions for shared items.
- No APIs Needed: Pure UI states (e.g., current tab, loading flags), ephemeral interactions.

This analysis ensures backend covers all persistent data while keeping UI states lightweight. Update BACKEND_INTEGRATION.md to include these specifics.
