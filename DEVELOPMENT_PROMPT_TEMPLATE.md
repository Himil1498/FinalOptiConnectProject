# Telecom GIS Platform - Development Task Prompt Template

## Project Overview
This is a comprehensive **Telecom Geographic Information System (GIS) Platform** built with React, TypeScript, and Google Maps integration. The platform provides advanced mapping capabilities, measurement tools, administrative functions, and workflow management for telecom infrastructure management.

## Architecture & Technology Stack

### Core Technologies
- **Frontend**: React 19.1.1 + TypeScript
- **Maps**: Google Maps JavaScript API + React Wrapper
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **Build Tool**: React Scripts (Create React App)
- **Animation**: Framer Motion
- **Charts**: Chart.js + React Chart.js 2
- **UI Components**: Headless UI + Heroicons
- **HTTP Client**: Axios
- **Authentication**: JWT-based system

### Key Dependencies
- `@googlemaps/js-api-loader`: Google Maps API loading
- `@googlemaps/react-wrapper`: React integration for Google Maps
- `@reduxjs/toolkit`: State management
- `react-router-dom`: Client-side routing
- `react-draggable`: Draggable components
- `chart.js` & `react-chartjs-2`: Data visualization

## Project Structure

```
src/
├── components/
│   ├── admin/              # Administrative panels
│   │   ├── RegionAssignmentSystem.tsx
│   │   ├── UserGroupsManagement.tsx
│   │   ├── ManagerDashboard.tsx
│   │   ├── DataImportSystem.tsx
│   │   └── InfrastructureDataManagement.tsx
│   ├── common/             # Shared components
│   │   ├── LayoutManager.tsx
│   │   ├── KeyboardShortcuts.tsx
│   │   ├── NavigationBar.tsx
│   │   └── PanelManager.tsx
│   ├── data/               # Data management
│   │   └── DataManager.tsx
│   ├── map/                # Map-related components
│   │   ├── ComprehensiveGoogleMapInterface.tsx  # Main map component
│   │   ├── MapControlsPanel.tsx
│   │   ├── DistanceMeasurementTool.tsx
│   │   ├── PolygonDrawingTool.tsx
│   │   ├── ElevationTool.tsx
│   │   ├── GeofencingSystem.tsx
│   │   └── MultiToolManager.tsx
│   ├── search/             # Search functionality
│   │   └── ComprehensiveSearchSystem.tsx
│   └── workflow/           # Workflow management
│       └── WorkflowPresets.tsx
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts
│   ├── useTheme.ts
│   ├── useLayoutDimensions.ts
│   └── useGeofencing.ts
├── store/                  # Redux store configuration
├── types/                  # TypeScript type definitions
└── utils/                  # Utility functions
```

## Core Components & Features

### 1. Main Map Interface (`ComprehensiveGoogleMapInterface.tsx`)
- **Purpose**: Central hub for all map-related functionality
- **Features**:
  - Google Maps integration with multiple map types
  - Multi-tool support (distance, polygon, elevation)
  - Live coordinate display
  - Panel management system
  - Workflow integration
  - Geofencing validation

### 2. Measurement Tools
- **DistanceMeasurementTool**: Point-to-point distance calculations
- **PolygonDrawingTool**: Area measurement and polygon creation
- **ElevationTool**: Elevation profile analysis
- **MultiToolManager**: Orchestrates multiple active tools

### 3. Administrative Features
- **RegionAssignmentSystem**: User region assignments
- **UserGroupsManagement**: User group administration
- **ManagerDashboard**: Management overview
- **DataImportSystem**: Data import functionality
- **InfrastructureDataManagement**: Infrastructure data handling

### 4. Supporting Systems
- **GeofencingSystem**: Location-based access control
- **ComprehensiveSearchSystem**: Advanced search capabilities
- **WorkflowPresets**: Predefined workflow templates
- **KeyboardShortcuts**: Global keyboard shortcuts

## Development Guidelines

### Code Organization
- **Component Structure**: Use functional components with hooks
- **State Management**: Use Redux for global state, useState for local state
- **TypeScript**: Strict typing required for all new code
- **File Naming**: PascalCase for components, camelCase for utilities

### Styling Conventions
- **Tailwind CSS**: Primary styling framework
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Support for theme switching
- **Component Library**: Headless UI for complex interactions

### State Management Patterns
```typescript
// Global state (Redux)
const { user, mapSettings } = useSelector((state: RootState) => ({
  user: state.auth.user,
  mapSettings: state.map
}));

// Local state (useState)
const [isToolActive, setIsToolActive] = useState(false);
```

### API Integration
- **Google Maps API**: Required for map functionality
- **Authentication**: JWT-based with role-based access
- **Data Management**: RESTful API patterns
- **Environment Variables**: API keys in .env file

## Common Development Tasks

### 1. Adding New Map Tools
```typescript
// Pattern for new measurement tools
interface NewToolProps {
  isActive: boolean;
  onToggle: () => void;
  map: google.maps.Map | null;
  onDataChange: (hasData: boolean) => void;
}

const NewTool: React.FC<NewToolProps> = ({
  isActive,
  onToggle,
  map,
  onDataChange
}) => {
  // Tool implementation
};
```

### 2. Creating Admin Panels
```typescript
// Pattern for admin components
interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  userRole?: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  currentUserId,
  userRole = 'viewer'
}) => {
  // Admin panel implementation
};
```

### 3. Implementing Workflows
```typescript
// Pattern for workflow steps
interface WorkflowStep {
  id: string;
  title: string;
  toolId: string;
  description: string;
  requiredData?: string[];
}

interface WorkflowPreset {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}
```

### 4. Adding Search Functionality
```typescript
// Pattern for search results
interface SearchResult {
  id: string;
  title: string;
  type: 'location' | 'infrastructure' | 'user' | 'region';
  coordinates: Coordinates;
  metadata?: Record<string, any>;
}
```

## Integration Points

### 1. Google Maps API
- **API Key**: Required in environment variables
- **Libraries**: geometry, places
- **Map Types**: roadmap, satellite, hybrid, terrain
- **Events**: click, drag, zoom, bounds_changed

### 2. Authentication System
- **User Roles**: admin, manager, user, viewer
- **Region Assignment**: State-based access control
- **JWT Tokens**: Session management
- **Permissions**: Role-based feature access

### 3. Data Management
- **Import/Export**: CSV, JSON, GeoJSON support
- **Storage**: Local storage + API persistence
- **Validation**: Data integrity checks
- **Backup**: Automated data backup

## Testing Considerations

### 1. Component Testing
- **Unit Tests**: Individual component functionality
- **Integration Tests**: Component interactions
- **E2E Tests**: Full user workflows

### 2. Map Testing
- **Mock Maps**: Google Maps API mocking
- **Event Simulation**: Map events and interactions
- **Coordinate Testing**: Location-based functionality

### 3. Authentication Testing
- **Role Simulation**: Different user roles
- **Permission Testing**: Access control validation
- **Session Testing**: Authentication flow

## Performance Optimization

### 1. Map Performance
- **Lazy Loading**: Component lazy loading
- **Memoization**: React.memo and useMemo
- **Event Debouncing**: Map event handling
- **Tile Caching**: Map tile optimization

### 2. Bundle Optimization
- **Code Splitting**: Route-based splitting
- **Tree Shaking**: Unused code elimination
- **Image Optimization**: Asset optimization
- **Compression**: Gzip compression

## Deployment Considerations

### 1. Environment Setup
- **API Keys**: Secure API key management
- **Environment Variables**: Production configuration
- **Build Optimization**: Production builds
- **CDN Integration**: Static asset delivery

### 2. Monitoring & Analytics
- **Error Tracking**: Error monitoring
- **Performance Monitoring**: Core Web Vitals
- **User Analytics**: Feature usage tracking
- **Map Analytics**: Map interaction tracking

## Common Issues & Solutions

### 1. Google Maps Issues
- **API Key Problems**: Verify billing and API enablement
- **Quota Limits**: Monitor API usage
- **CORS Issues**: Domain restrictions
- **Loading Delays**: Implement loading states

### 2. State Management Issues
- **Redux DevTools**: Debug state changes
- **Action Logging**: Monitor dispatched actions
- **Memory Leaks**: Cleanup subscriptions
- **Race Conditions**: Handle async operations

### 3. Performance Issues
- **Re-renders**: Use React.memo appropriately
- **Large Datasets**: Implement pagination
- **Map Interactions**: Debounce event handlers
- **Memory Usage**: Monitor component lifecycle

## Getting Started Template

When starting a new development task, use this template:

```markdown
# Task: [Brief Description]

## Objective
[Clear description of what needs to be accomplished]

## Requirements
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

## Technical Approach
1. [Step 1 - Component/File creation or modification]
2. [Step 2 - Integration with existing systems]
3. [Step 3 - Testing and validation]

## Files to Modify/Create
- [ ] `src/components/[component]/NewComponent.tsx`
- [ ] `src/types/[type].ts`
- [ ] `src/store/[slice].ts`

## Dependencies
- [ ] New npm packages (if any)
- [ ] API endpoints (if any)
- [ ] Environment variables (if any)

## Testing Plan
- [ ] Unit tests for new functionality
- [ ] Integration tests with existing components
- [ ] Manual testing scenarios
```

## Support Resources

### Documentation
- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [React Documentation](https://react.dev)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Development Tools
- **VS Code Extensions**: ES7+, Prettier, Tailwind CSS IntelliSense
- **DevTools**: Redux DevTools, React DevTools
- **Testing**: Jest, React Testing Library
- **Linting**: ESLint, TypeScript

---

*This prompt template provides a comprehensive guide for development tasks on the Telecom GIS Platform. Use it as a reference when planning and implementing new features or modifications.*
