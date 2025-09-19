// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// GIS types
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeoFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon';
    coordinates: number[] | number[][] | number[][][];
  };
}

// Map layer types
export interface LayerConfig {
  id: string;
  name: string;
  type: 'raster' | 'vector' | 'geojson';
  url?: string;
  data?: any;
  visible: boolean;
  opacity: number;
  minZoom?: number;
  maxZoom?: number;
}

// Enhanced Map types
export interface MapViewState {
  center: [number, number];
  zoom: number;
  bearing?: number;
  pitch?: number;
  bounds?: google.maps.LatLngBounds;
}

export interface MapMarker {
  id: string;
  position: google.maps.LatLngLiteral;
  title: string;
  description?: string;
  icon?: google.maps.Icon | google.maps.Symbol;
  draggable?: boolean;
  visible?: boolean;
  data?: any;
}

export interface MapPolygon {
  id: string;
  paths: google.maps.LatLngLiteral[][];
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  fillColor?: string;
  fillOpacity?: number;
  editable?: boolean;
  draggable?: boolean;
  visible?: boolean;
  data?: any;
}

export interface MapCircle {
  id: string;
  center: google.maps.LatLngLiteral;
  radius: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  fillColor?: string;
  fillOpacity?: number;
  editable?: boolean;
  draggable?: boolean;
  visible?: boolean;
  data?: any;
}

export interface MapPolyline {
  id: string;
  path: google.maps.LatLngLiteral[];
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  editable?: boolean;
  draggable?: boolean;
  visible?: boolean;
  data?: any;
}

export interface MapControls {
  zoom?: boolean;
  streetView?: boolean;
  mapType?: boolean;
  fullscreen?: boolean;
  scale?: boolean;
  rotate?: boolean;
}

export interface MapSettings {
  mapTypeId: google.maps.MapTypeId;
  styles?: google.maps.MapTypeStyle[];
  restriction?: google.maps.MapRestriction;
  gestureHandling?: 'auto' | 'cooperative' | 'greedy' | 'none';
  draggable?: boolean;
  scrollwheel?: boolean;
  disableDoubleClickZoom?: boolean;
  keyboardShortcuts?: boolean;
}

export interface DrawingMode {
  enabled: boolean;
  mode: 'marker' | 'polygon' | 'polyline' | 'circle' | 'rectangle' | null;
  options?: google.maps.drawing.DrawingManagerOptions;
}

export interface MeasurementMode {
  enabled: boolean;
  mode: 'distance' | 'area' | null;
  units: 'metric' | 'imperial';
  results?: {
    distance?: number;
    area?: number;
    path?: google.maps.LatLngLiteral[];
  };
}

export interface CoordinateDisplay {
  enabled: boolean;
  format: 'decimal' | 'dms';
  precision: number;
  currentCoordinates?: google.maps.LatLngLiteral;
}

export interface MapEventHandlers {
  onClick?: (event: google.maps.MapMouseEvent) => void;
  onRightClick?: (event: google.maps.MapMouseEvent) => void;
  onMouseMove?: (event: google.maps.MapMouseEvent) => void;
  onMouseOut?: (event: google.maps.MapMouseEvent) => void;
  onZoomChanged?: (zoom: number) => void;
  onCenterChanged?: (center: google.maps.LatLngLiteral) => void;
  onBoundsChanged?: (bounds: google.maps.LatLngBounds) => void;
  onMapTypeChanged?: (mapTypeId: google.maps.MapTypeId) => void;
}

export interface RegionRestriction {
  enabled: boolean;
  bounds: google.maps.LatLngBounds;
  strictBounds?: boolean;
}

// Equipment types
export interface Equipment {
  id: string;
  name: string;
  type: 'antenna' | 'amplifier' | 'router' | 'switch' | 'modem' | 'other';
  manufacturer: string;
  model: string;
  serialNumber: string;
  status: 'active' | 'inactive' | 'maintenance' | 'critical';
  installedDate: string;
  warrantyExpiry?: string;
  specifications: Record<string, any>;
}

// Network types
export interface NetworkSegment {
  id: string;
  name: string;
  type: 'fiber' | 'copper' | 'wireless' | 'satellite';
  startPoint: Coordinates;
  endPoint: Coordinates;
  capacity: number;
  currentLoad: number;
  status: 'active' | 'inactive' | 'maintenance' | 'critical';
  equipment: Equipment[];
}

// Analytics types
export interface MetricValue {
  timestamp: string;
  value: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'number' | 'date';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string; }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
}

// Audit log types
export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  details?: Record<string, any>;
}

// Auth types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'technician' | 'viewer';
  permissions: string[];
  assignedStates?: string[];
  department?: string;
  phoneNumber?: string;
  avatar?: string;
  lastLogin?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface RefreshTokenResponse {
  token: string;
  expiresIn: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePassword {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// User Groups types
export interface UserGroup {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  level: number;
  path: string[]; // Array of parent group IDs
  permissions: string[];
  assignedStates: string[];
  color: string;
  icon?: string;
  isActive: boolean;
  memberCount: number;
  childGroups: string[]; // Array of child group IDs
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  userId: string;
  groupId: string;
  role: 'member' | 'admin' | 'moderator';
  joinedAt: string;
  isActive: boolean;
}

export interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  category: 'basic' | 'advanced' | 'admin' | 'custom';
  isBuiltIn: boolean;
  createdAt: string;
}

export interface BulkOperation {
  id: string;
  type: 'import' | 'export' | 'update' | 'delete' | 'migrate' | 'assign_users' | 'move_users' | 'update_permissions' | 'assign_states';
  target: 'users' | 'groups' | 'data' | 'configurations' | 'permissions';
  status: 'pending' | 'in_progress' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  startedAt: string;
  completedAt?: string;
  initiatedBy: string;
  parameters: any;
  results?: {
    successCount: number;
    failureCount: number;
    warnings: string[];
    errors: string[];
  };
  downloadUrl?: string;
  // Legacy fields for backward compatibility
  targetGroupId?: string;
  userIds?: string[];
  data?: any;
  createdBy?: string;
  createdAt?: string;
  error?: string;
}

// Permission categories
export const PERMISSION_CATEGORIES = {
  map: {
    name: 'Map Operations',
    permissions: [
      'map_view',
      'map_edit',
      'distance_measurement',
      'polygon_drawing',
      'elevation_analysis'
    ]
  },
  regions: {
    name: 'Region Management',
    permissions: [
      'region_view',
      'region_assign',
      'region_edit',
      'geofencing_manage'
    ]
  },
  users: {
    name: 'User Management',
    permissions: [
      'user_view',
      'user_create',
      'user_edit',
      'user_delete',
      'user_permissions'
    ]
  },
  groups: {
    name: 'Group Management',
    permissions: [
      'group_view',
      'group_create',
      'group_edit',
      'group_delete',
      'group_members'
    ]
  },
  analytics: {
    name: 'Analytics & Reports',
    permissions: [
      'analytics_view',
      'analytics_advanced',
      'reports_generate',
      'reports_export'
    ]
  },
  system: {
    name: 'System Administration',
    permissions: [
      'system_settings',
      'audit_logs',
      'backup_restore',
      'system_monitor'
    ]
  }
} as const;

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<User['role'], string[]> = {
  admin: ['all'],
  manager: ['read', 'write', 'manage_users', 'view_analytics', 'manage_equipment'],
  technician: ['read', 'write', 'manage_equipment', 'update_status'],
  viewer: ['read', 'view_basic_analytics']
};

// Manager Dashboard types
export interface UserActivityLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: string;
  duration?: number;
  location?: Coordinates;
  details?: Record<string, any>;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersPerRole: Record<User['role'], number>;
  usersPerGroup: Record<string, number>;
  usersPerState: Record<string, number>;
}

export interface ActivityStats {
  totalSessions: number;
  averageSessionDuration: number;
  mostUsedFeatures: Array<{
    feature: string;
    usage: number;
    percentage: number;
  }>;
  peakUsageHours: Array<{
    hour: number;
    usage: number;
  }>;
}

export interface SystemPerformanceMetrics {
  systemUptime: number;
  averageResponseTime: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'stat' | 'table' | 'map';
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  data: any;
  refreshInterval?: number;
}

export interface UserFilter {
  role?: User['role'][];
  status?: ('active' | 'inactive')[];
  groups?: string[];
  states?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  searchTerm?: string;
}

export interface BulkUserAction {
  type: 'activate' | 'deactivate' | 'assign_group' | 'assign_states' | 'update_permissions' | 'delete';
  userIds: string[];
  data?: any;
}

export interface UsageReport {
  id: string;
  name: string;
  type: 'user_activity' | 'feature_usage' | 'performance' | 'security';
  dateRange: {
    start: string;
    end: string;
  };
  filters: UserFilter;
  generatedAt: string;
  data: any;
}

// Data Import System types
export interface ImportFile {
  id: string;
  name: string;
  size: number;
  type: 'kml' | 'kmz' | 'csv' | 'xlsx';
  file: File;
  status: 'pending' | 'validating' | 'valid' | 'invalid' | 'processing' | 'completed' | 'error';
  error?: string;
  preview?: any;
  metadata?: {
    recordCount?: number;
    columns?: string[];
    encoding?: string;
    coordinateSystem?: string;
  };
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  dataType: 'string' | 'number' | 'date' | 'coordinate' | 'boolean';
  required: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

export interface ImportJob {
  id: string;
  name: string;
  files: ImportFile[];
  fieldMappings: Record<string, FieldMapping[]>;
  settings: ImportSettings;
  status: 'preparing' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: {
    total: number;
    processed: number;
    percentage: number;
    currentFile?: string;
    errors: ImportError[];
    warnings: ImportWarning[];
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
}

export interface ImportSettings {
  batchSize: number;
  skipInvalidRecords: boolean;
  createBackup: boolean;
  overwriteExisting: boolean;
  coordinateSystem: 'WGS84' | 'UTM' | 'Indian1975';
  defaultLayer?: string;
  preserveAttributes: boolean;
  validateGeometry: boolean;
}

export interface ImportError {
  id: string;
  type: 'validation' | 'parsing' | 'processing' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: string;
  file?: string;
  line?: number;
  column?: string;
  timestamp: string;
}

export interface ImportWarning {
  id: string;
  type: 'data_quality' | 'coordinate' | 'attribute' | 'format';
  message: string;
  details?: string;
  file?: string;
  line?: number;
  suggestions?: string[];
  timestamp: string;
}

export interface GeospatialData {
  id: string;
  name: string;
  type: 'point' | 'line' | 'polygon' | 'multipoint' | 'multiline' | 'multipolygon';
  coordinates: number[] | number[][] | number[][][];
  properties: Record<string, any>;
  style?: {
    color?: string;
    fillColor?: string;
    weight?: number;
    opacity?: number;
    fillOpacity?: number;
  };
  metadata?: {
    source: string;
    importedAt: string;
    importedBy: string;
    layer?: string;
  };
}

export interface ImportTemplate {
  id: string;
  name: string;
  description: string;
  fileType: 'csv' | 'xlsx';
  fieldMappings: FieldMapping[];
  settings: ImportSettings;
  isBuiltIn: boolean;
  createdBy: string;
  createdAt: string;
  usageCount: number;
}

export interface DataLayer {
  id: string;
  name: string;
  description?: string;
  type: 'imported' | 'system' | 'user';
  features: GeospatialData[];
  style: {
    defaultStyle: any;
    styleRules?: Array<{
      condition: string;
      style: any;
    }>;
  };
  metadata: {
    source?: string;
    importedAt?: string;
    recordCount: number;
    bounds?: BoundingBox;
  };
  isVisible: boolean;
  isEditable: boolean;
  permissions: string[];
}

// Infrastructure Data Management types
export interface InfrastructureItem {
  id: string;
  name: string;
  category: InfrastructureCategory;
  subCategory?: string;
  description?: string;
  coordinates: Coordinates;
  address?: string;
  customAttributes: Record<string, any>;
  status: 'active' | 'inactive' | 'maintenance' | 'planned' | 'decommissioned';
  priority: 'low' | 'medium' | 'high' | 'critical';
  owner: string;
  assignedTo?: string;
  installationDate?: string;
  maintenanceSchedule?: string;
  warrantyExpiry?: string;
  cost?: number;
  vendor?: string;
  model?: string;
  serialNumber?: string;
  attachments: InfrastructureAttachment[];
  tags: string[];
  metadata: {
    createdBy: string;
    createdAt: string;
    updatedBy: string;
    updatedAt: string;
    lastInspected?: string;
    inspectedBy?: string;
    version: number;
  };
  permissions: {
    view: string[];
    edit: string[];
    delete: string[];
  };
  isVisible: boolean;
  layerId?: string;
}

export interface InfrastructureCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  subCategories: InfrastructureSubCategory[];
  requiredAttributes: string[];
  optionalAttributes: string[];
  defaultAttributes: Record<string, any>;
  permissions: string[];
  isActive: boolean;
}

export interface InfrastructureSubCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  attributes: AttributeDefinition[];
}

export interface AttributeDefinition {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'textarea' | 'url' | 'email' | 'coordinates';
  required: boolean;
  defaultValue?: any;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  unit?: string;
  description?: string;
}

export interface InfrastructureAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'video' | 'audio' | 'other';
  url: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
}

export interface InfrastructureFilter {
  categories?: string[];
  subCategories?: string[];
  status?: InfrastructureItem['status'][];
  priority?: InfrastructureItem['priority'][];
  tags?: string[];
  owner?: string[];
  assignedTo?: string[];
  region?: string;
  dateRange?: {
    field: 'createdAt' | 'updatedAt' | 'installationDate' | 'lastInspected';
    start: string;
    end: string;
  };
  customAttributes?: Record<string, any>;
  searchTerm?: string;
  bounds?: BoundingBox;
}

export interface InfrastructureExport {
  id: string;
  name: string;
  format: 'csv' | 'xlsx' | 'kml' | 'geojson' | 'pdf';
  filters: InfrastructureFilter;
  includeFields: string[];
  includeAttachments: boolean;
  includeCoordinates: boolean;
  coordinateFormat: 'decimal' | 'dms';
  createdBy: string;
  createdAt: string;
  downloadUrl?: string;
  status: 'generating' | 'ready' | 'expired' | 'failed';
  expiresAt?: string;
}

export interface InfrastructureBulkOperation {
  id: string;
  type: 'update_status' | 'update_category' | 'assign_to' | 'add_tags' | 'remove_tags' | 'delete' | 'export';
  itemIds: string[];
  data: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    total: number;
    processed: number;
    errors: string[];
  };
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

export interface InfrastructureReport {
  id: string;
  name: string;
  type: 'status_summary' | 'maintenance_schedule' | 'cost_analysis' | 'geographic_distribution' | 'custom';
  filters: InfrastructureFilter;
  generatedAt: string;
  generatedBy: string;
  data: {
    summary: Record<string, number>;
    details: any[];
    charts: ChartData[];
    totalItems: number;
    totalCost?: number;
  };
}

// Comprehensive Search System types
export interface SearchResult {
  id: string;
  type: 'address' | 'coordinate' | 'place' | 'infrastructure' | 'imported_data' | 'user' | 'group' | 'state' | 'region';
  title: string;
  subtitle?: string;
  description?: string;
  coordinates?: Coordinates;
  bounds?: BoundingBox;
  address?: string;
  metadata?: Record<string, any>;
  relevanceScore: number;
  category?: string;
  icon?: string;
  thumbnail?: string;
  actions?: SearchResultAction[];
}

export interface SearchResultAction {
  id: string;
  label: string;
  icon: string;
  action: 'view' | 'edit' | 'delete' | 'navigate' | 'share' | 'export';
  permissions?: string[];
}

export interface SearchQuery {
  query: string;
  types: SearchResult['type'][];
  filters: SearchFilters;
  spatialSearch?: SpatialSearch;
  limit: number;
  offset: number;
}

export interface SearchFilters {
  categories?: string[];
  states?: string[];
  dateRange?: {
    start: string;
    end: string;
    field: string;
  };
  status?: string[];
  priority?: string[];
  owner?: string[];
  tags?: string[];
  customAttributes?: Record<string, any>;
  bounds?: BoundingBox;
}

export interface SpatialSearch {
  center: Coordinates;
  radius?: number; // in km
  shape?: 'circle' | 'rectangle' | 'polygon';
  bounds?: BoundingBox;
  polygon?: Coordinates[];
  units: 'km' | 'miles' | 'meters';
}

export interface SearchHistory {
  id: string;
  query: string;
  type: SearchResult['type'] | 'mixed';
  timestamp: string;
  userId: string;
  resultsCount: number;
  filters?: SearchFilters;
  spatialSearch?: SpatialSearch;
  selected?: SearchResult;
}

export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  query: SearchQuery;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  tags: string[];
  notifications: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
    conditions: string[];
  };
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: SearchResult['type'];
  frequency: number;
  category?: string;
  icon?: string;
  coordinates?: Coordinates;
}

export interface GeocodeResult {
  address: string;
  coordinates: Coordinates;
  bounds?: BoundingBox;
  components: {
    streetNumber?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    district?: string;
  };
  accuracy: 'exact' | 'interpolated' | 'range' | 'center';
  source: 'google' | 'osm' | 'local';
}

export interface AddressSearchResult extends SearchResult {
  geocode: GeocodeResult;
  type: 'address';
}

export interface PlaceSearchResult extends SearchResult {
  type: 'place';
  placeType: 'landmark' | 'business' | 'government' | 'education' | 'hospital' | 'transport' | 'other';
  contact?: {
    phone?: string;
    website?: string;
    email?: string;
  };
  hours?: string;
  rating?: number;
}

export interface CoordinateSearchResult extends SearchResult {
  type: 'coordinate';
  format: 'decimal' | 'dms' | 'utm' | 'mgrs';
  elevation?: number;
  timezone?: string;
  nearbyPlaces?: PlaceSearchResult[];
}

export interface SearchIndex {
  id: string;
  content: string;
  type: SearchResult['type'];
  category?: string;
  tags: string[];
  coordinates?: Coordinates;
  bounds?: BoundingBox;
  metadata: Record<string, any>;
  lastUpdated: string;
  weight: number;
}

export interface SearchAnalytics {
  totalSearches: number;
  uniqueUsers: number;
  topQueries: Array<{
    query: string;
    count: number;
    averageResultsCount: number;
  }>;
  popularTypes: Array<{
    type: SearchResult['type'];
    count: number;
    percentage: number;
  }>;
  spatialSearchUsage: {
    radiusSearches: number;
    boundingBoxSearches: number;
    polygonSearches: number;
  };
  averageResponseTime: number;
  failureRate: number;
}

// UI/UX Enhancement types
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      linear: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
}

export interface AccessibilityConfig {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  focusVisible: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
}

export interface KeyboardShortcut {
  id: string;
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
  category: 'navigation' | 'search' | 'tools' | 'data' | 'general';
  enabled: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  message?: string;
  type: 'spinner' | 'progress' | 'skeleton' | 'dots';
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
  fallbackComponent?: React.ComponentType<any>;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary';
  }>;
  dismissible?: boolean;
  persistent?: boolean;
}

export interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: string;
  type: 'fade' | 'slide' | 'scale' | 'bounce' | 'elastic';
  direction?: 'up' | 'down' | 'left' | 'right' | 'in' | 'out';
}

export interface ResponsiveBreakpoints {
  xs: number; // 0px
  sm: number; // 640px
  md: number; // 768px
  lg: number; // 1024px
  xl: number; // 1280px
  '2xl': number; // 1536px
}

export interface UIState {
  theme: ThemeConfig;
  accessibility: AccessibilityConfig;
  shortcuts: KeyboardShortcut[];
  notifications: ToastNotification[];
  loadingStates: Record<string, LoadingState>;
  sidebarCollapsed: boolean;
  fullscreenMode: boolean;
  currentBreakpoint: keyof ResponsiveBreakpoints;
}

// Data Management System Types
export interface SavedDataItem {
  id: string;
  name: string;
  description?: string;
  type: 'distance' | 'polygon' | 'elevation' | 'infrastructure' | 'custom';
  data: any; // Flexible data structure for different tool types
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    version: number;
    size: number; // Data size in bytes
    coordinates?: Coordinates;
    bounds?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
  permissions: DataPermissions;
  tags: string[];
  category?: string;
  isPublic: boolean;
  shareSettings: DataShareSettings;
}

export interface DataPermissions {
  owner: string;
  viewers: string[];
  editors: string[];
  canDelete: string[];
  canShare: string[];
  inheritanceRules?: {
    fromParent?: boolean;
    toChildren?: boolean;
  };
}

export interface DataShareSettings {
  isShared: boolean;
  shareType: 'public' | 'organization' | 'specific_users' | 'link';
  sharedWith: string[];
  shareUrl?: string;
  expiresAt?: string;
  allowDownload: boolean;
  allowEdit: boolean;
  allowComment: boolean;
}

export interface DataVersion {
  id: string;
  itemId: string;
  version: number;
  data: any;
  changelog: string;
  createdAt: string;
  createdBy: string;
  size: number;
}

export interface DataFolder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  path: string[];
  createdAt: string;
  createdBy: string;
  permissions: DataPermissions;
  itemCount: number;
  subfolderCount: number;
}

export interface DataBulkOperation {
  id: string;
  type: 'move' | 'copy' | 'delete' | 'share' | 'tag' | 'permission_change';
  items: string[];
  parameters: any;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  errors?: string[];
  result?: any;
}

export interface DataFilter {
  type?: ('distance' | 'polygon' | 'elevation' | 'infrastructure' | 'custom')[];
  createdBy?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  categories?: string[];
  hasPermission?: 'view' | 'edit' | 'delete' | 'share';
  isShared?: boolean;
  location?: {
    coordinates: Coordinates;
    radius: number; // in meters
  };
  sizeRange?: {
    min: number;
    max: number;
  };
}

export interface DataSort {
  field: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'type' | 'createdBy';
  direction: 'asc' | 'desc';
}

export interface DataSearchQuery {
  query: string;
  filters: DataFilter;
  sort: DataSort;
  pagination: {
    page: number;
    limit: number;
  };
}

export interface DataSearchResult {
  items: SavedDataItem[];
  totalCount: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  aggregations: {
    byType: Record<string, number>;
    byCreator: Record<string, number>;
    byTag: Record<string, number>;
    byCategory: Record<string, number>;
  };
}

export interface DataExportOptions {
  format: 'json' | 'geojson' | 'kml' | 'csv' | 'xlsx';
  includeMetadata: boolean;
  includeVersionHistory: boolean;
  compression?: 'zip' | 'gzip';
  projection?: string; // For geospatial formats
}

export interface DataImportOptions {
  format: 'json' | 'geojson' | 'kml' | 'csv' | 'xlsx';
  mergeBehavior: 'skip' | 'overwrite' | 'create_new';
  preserveMetadata: boolean;
  assignToFolder?: string;
  defaultPermissions?: Partial<DataPermissions>;
}

export interface DataSyncStatus {
  isOnline: boolean;
  lastSyncAt?: string;
  pendingChanges: number;
  conflictCount: number;
  syncInProgress: boolean;
}

export interface DataComment {
  id: string;
  itemId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  parentId?: string; // For replies
  isResolved: boolean;
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
}

export interface DataAnalytics {
  itemId: string;
  views: number;
  downloads: number;
  shares: number;
  comments: number;
  lastAccessed: string;
  accessHistory: {
    userId: string;
    timestamp: string;
    action: 'view' | 'edit' | 'download' | 'share';
  }[];
}

// Analytics System Types
export interface UsageStatistics {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  averageSessionDuration: number;
  totalDataItems: number;
  totalStorageUsed: number;
  period: {
    start: string;
    end: string;
  };
}

export interface UserActivity {
  userId: string;
  userName: string;
  lastLogin: string;
  sessionCount: number;
  totalTimeSpent: number;
  actionsPerformed: number;
  toolsUsed: string[];
  dataCreated: number;
  dataShared: number;
  status: 'active' | 'idle' | 'inactive';
}

export interface ToolMetrics {
  toolName: string;
  toolType: 'distance' | 'polygon' | 'elevation' | 'infrastructure' | 'search' | 'admin' | 'data';
  usageCount: number;
  uniqueUsers: number;
  averageUsageTime: number;
  successRate: number;
  errorCount: number;
  lastUsed: string;
  popularityRank: number;
  growthRate: number;
}

export interface DataCreationAnalytics {
  period: string;
  totalCreated: number;
  byType: Record<string, number>;
  byUser: Record<string, number>;
  byRegion: Record<string, number>;
  avgFileSize: number;
  storageGrowth: number;
  sharedItems: number;
  publicItems: number;
}

export interface SystemHealthMetrics {
  cpu: {
    usage: number;
    cores: number;
    load: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  storage: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    latency: number;
    throughput: number;
    errors: number;
  };
  database: {
    connections: number;
    queryTime: number;
    errorRate: number;
  };
  uptime: number;
  lastCheck: string;
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  renderTime: number;
  errorRate: number;
  crashRate: number;
  userSatisfactionScore: number;
  bottlenecks: Array<{
    component: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    impact: string;
    suggestion: string;
  }>;
}

export interface UsageTrend {
  date: string;
  users: number;
  sessions: number;
  dataCreated: number;
  toolUsage: Record<string, number>;
  errors: number;
  performance: number;
}

export interface AnalyticsReport {
  id: string;
  title: string;
  type: 'usage_summary' | 'usage' | 'performance' | 'user_activity' | 'data_analytics' | 'system_health' | 'tool_metrics' | 'custom';
  period: {
    start: string;
    end: string;
  };
  data: any;
  generatedBy: string;
  generatedAt: string;
  format: 'json' | 'csv' | 'pdf' | 'xlsx';
  status: 'generating' | 'ready' | 'failed';
  downloadUrl?: string;
  expiresAt?: string;
}

export interface AnalyticsFilter {
  dateRange: {
    start: string;
    end: string;
  };
  users?: string[];
  tools?: string[];
  regions?: string[];
  dataTypes?: string[];
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

export interface AnalyticsDashboardConfig {
  widgets: Array<{
    id: string;
    type: 'chart' | 'metric' | 'table' | 'map';
    title: string;
    dataSource: string;
    position: { x: number; y: number; w: number; h: number };
    config: any;
  }>;
  refreshInterval: number;
  autoRefresh: boolean;
  theme: 'light' | 'dark';
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'above' | 'below' | 'equals';
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
  channels: ('email' | 'sms' | 'push' | 'webhook')[];
  recipients: string[];
  lastTriggered?: string;
  triggerCount: number;
}

export interface AnalyticsInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'alert';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  category: 'usage' | 'performance' | 'security' | 'optimization';
  data: any;
  actionable: boolean;
  suggestedActions?: string[];
  generatedAt: string;
  confidence: number;
}

// Configuration types
export interface SystemConfig {
  mapSettings: {
    defaultCenter: Coordinates;
    defaultZoom: number;
    maxZoom: number;
    minZoom: number;
    enableClustering: boolean;
  };
  authSettings: {
    sessionTimeout: number;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
  };
  notificationSettings: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
  };
}

// Advanced Admin System Types
export interface SystemConfiguration {
  id: string;
  category: 'security' | 'performance' | 'features' | 'integrations' | 'storage';
  key: string;
  value: any;
  description: string;
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'array';
  defaultValue: any;
  isEditable: boolean;
  requiresRestart: boolean;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
  lastModified: string;
  modifiedBy: string;
  environment: 'development' | 'staging' | 'production' | 'all';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import' | 'config_change' | 'permission_change';
  resource: string;
  resourceId?: string;
  resourceType: 'user' | 'group' | 'data' | 'system' | 'configuration' | 'permission' | 'backup';
  details: any;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  outcome: 'success' | 'failure' | 'partial';
  risk: 'low' | 'medium' | 'high' | 'critical';
  metadata?: any;
}

export interface AdvancedPermission {
  id: string;
  name: string;
  description: string;
  category: string;
  scope: 'global' | 'resource' | 'conditional';
  conditions?: {
    timeRestriction?: {
      startTime: string;
      endTime: string;
      daysOfWeek: number[];
    };
    ipRestriction?: string[];
    locationRestriction?: {
      allowedRegions: string[];
      allowedCountries: string[];
    };
    resourceRestriction?: {
      resourceTypes: string[];
      resourceIds: string[];
    };
  };
  inheritance: 'allow' | 'deny' | 'inherit';
  priority: number;
  expiresAt?: string;
  grantedBy: string;
  grantedAt: string;
  lastUsed?: string;
}

export interface UserActivitySession {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    region: string;
    city: string;
    coordinates?: { lat: number; lng: number };
  };
  actions: Array<{
    timestamp: string;
    action: string;
    resource: string;
    details: any;
  }>;
  status: 'active' | 'ended' | 'expired' | 'terminated';
  risk: 'low' | 'medium' | 'high';
  anomalies?: string[];
}


export interface SystemMaintenanceTask {
  id: string;
  name: string;
  description: string;
  type: 'backup' | 'cleanup' | 'optimization' | 'migration' | 'health_check' | 'security_scan';
  schedule?: {
    frequency: 'manual' | 'daily' | 'weekly' | 'monthly';
    time?: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  lastRun?: string;
  nextRun?: string;
  duration?: number;
  results?: {
    success: boolean;
    message: string;
    details: any;
    metrics?: any;
  };
  notifications: {
    onSuccess: boolean;
    onFailure: boolean;
    recipients: string[];
  };
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
  };
}

export interface BackupRecord {
  id: string;
  name: string;
  description?: string;
  type: 'full' | 'incremental' | 'differential';
  scope: 'users' | 'data' | 'configurations' | 'full_system';
  size: number;
  createdAt: string;
  createdBy: string;
  location: string;
  checksum: string;
  isEncrypted: boolean;
  retention: {
    expiresAt: string;
    autoDelete: boolean;
  };
  status: 'creating' | 'available' | 'restoring' | 'expired' | 'corrupted';
  metadata: {
    version: string;
    userCount?: number;
    dataItemCount?: number;
    configCount?: number;
    compressedSize: number;
  };
}

export interface AdminSystemHealth {
  timestamp: string;
  overall: 'healthy' | 'warning' | 'critical' | 'unknown';
  components: Array<{
    name: string;
    status: 'healthy' | 'warning' | 'critical' | 'unknown';
    message?: string;
    metrics?: any;
    lastCheck: string;
  }>;
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    uptime: number;
  };
  resources: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  };
  security: {
    lastSecurityScan?: string;
    vulnerabilities: number;
    securityScore: number;
  };
  alerts: Array<{
    id: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: string;
    acknowledged: boolean;
  }>;
}

// Base Map System Types
export interface BaseMapConfig {
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  mapTypeId?: google.maps.MapTypeId;
  restrictToIndia?: boolean;
  enableClickHandler?: boolean;
  showControls?: boolean;
  showCoordinates?: boolean;
  enableClustering?: boolean;
  styles?: google.maps.MapTypeStyle[];
}

export interface BaseMapMarkerConfig {
  position: google.maps.LatLngLiteral;
  title?: string;
  icon?: string | google.maps.Icon | google.maps.Symbol;
  draggable?: boolean;
  animation?: google.maps.Animation;
  onClick?: () => void;
  infoWindow?: {
    content: string;
    autoOpen?: boolean;
  };
}

export interface BaseMapOverlay {
  id: string;
  type: 'marker' | 'polygon' | 'polyline' | 'circle' | 'info_window' | 'data_layer';
  instance: google.maps.MVCObject;
  data?: any;
  visible: boolean;
  interactive: boolean;
}

export interface BaseMapState {
  map: google.maps.Map | null;
  isReady: boolean;
  center: google.maps.LatLngLiteral;
  zoom: number;
  mapType: string;
  bounds?: google.maps.LatLngBounds;
  markers: google.maps.Marker[];
  overlays: BaseMapOverlay[];
  clickedLocations: Coordinates[];
}

export interface BaseMapEvent {
  type: 'click' | 'right_click' | 'zoom_changed' | 'center_changed' | 'bounds_changed' | 'map_type_changed';
  data: any;
  timestamp: string;
}

export interface BaseMapProvider {
  config: BaseMapConfig;
  state: BaseMapState;
  actions: {
    setMapInstance: (map: google.maps.Map) => void;
    updateCenter: (center: google.maps.LatLngLiteral) => void;
    updateZoom: (zoom: number) => void;
    updateMapType: (mapType: string) => void;
    addMarker: (config: BaseMapMarkerConfig) => google.maps.Marker;
    removeMarker: (marker: google.maps.Marker) => void;
    clearMarkers: () => void;
    addOverlay: (overlay: BaseMapOverlay) => void;
    removeOverlay: (overlayId: string) => void;
    clearOverlays: () => void;
    panTo: (coordinates: Coordinates) => void;
    fitBounds: (bounds: google.maps.LatLngBounds) => void;
    focusOnIndia: () => void;
  };
  utils: {
    geocodeAddress: (address: string) => Promise<google.maps.LatLngLiteral | null>;
    reverseGeocode: (coordinates: Coordinates) => Promise<string | null>;
    calculateDistance: (point1: Coordinates, point2: Coordinates) => number;
    isInIndiaBounds: (coordinates: Coordinates) => boolean;
    formatCoordinates: (coordinates: Coordinates, format: 'decimal' | 'dms') => string;
  };
}