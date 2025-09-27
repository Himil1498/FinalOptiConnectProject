# Backend Integration Guide for OptiConnect

This document outlines the complete process for integrating a PostgreSQL backend with the OptiConnect frontend, including data models, database schema, API endpoints, and implementation steps.

## Overview

OptiConnect is a telecom GIS platform that requires persistent storage for users, infrastructure data (towers, POP locations), regions, audit logs, analytics, and system configurations. The backend will use Node.js/Express with PostgreSQL and PostGIS for spatial data.

### Environment Modes & Data Center

The system supports multiple environment modes with a centralized **Data Center** for seamless switching between API calls and localStorage:

- **Development Mode**: Uses localStorage for data persistence, ideal for development and testing
- **Production Mode**: Uses backend APIs for full data persistence and multi-user support
- **Maintenance Mode**: Switches to read-only mode with cached data from localStorage

The **Data Center** acts as a unified interface that automatically switches data sources based on the current mode, ensuring smooth operation across different environments.

#### Data Center Architecture

The Data Center (`src/services/dataCenter.ts`) provides a unified API for all data operations:

```typescript
interface DataCenter {
  // Environment management
  setMode(mode: 'development' | 'production' | 'maintenance'): void;
  getMode(): string;

  // Data operations (automatically switches between API/localStorage)
  getInfrastructure(): Promise<Infrastructure[]>;
  createInfrastructure(data: InfrastructureData): Promise<Infrastructure>;
  updateInfrastructure(id: string, data: Partial<InfrastructureData>): Promise<Infrastructure>;
  deleteInfrastructure(id: string): Promise<void>;

  // User data operations
  getUserData(): Promise<UserData>;
  saveUserData(data: UserData): Promise<void>;

  // Configuration
  getConfig(): Promise<SystemConfig>;
  updateConfig(config: Partial<SystemConfig>): Promise<void>;
}
```

#### Environment Switching Logic

- **Development Mode**:
  - Data stored in localStorage with user-specific keys
  - No authentication required
  - Full CRUD operations available
  - Data persists across browser sessions

- **Production Mode**:
  - All data operations go through backend APIs
  - JWT authentication required
  - User-wise data isolation enforced
  - Real-time synchronization with database

- **Maintenance Mode**:
  - Read-only mode using cached localStorage data
  - Shows maintenance banner
  - Prevents data modifications
  - Graceful degradation for system updates

#### Environment Configuration

Create environment-specific configuration files:

```bash
# .env.development
REACT_APP_MODE=development
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_DEBUG=true

# .env.production
REACT_APP_MODE=production
REACT_APP_API_URL=https://api.opticonnect.com/api
REACT_APP_DEBUG=false

# .env.maintenance
REACT_APP_MODE=maintenance
REACT_APP_API_URL=https://api.opticonnect.com/api
REACT_APP_MAINTENANCE_MESSAGE="System is under maintenance. Expected downtime: 2 hours."
```

#### Data Synchronization Strategy

- **Mode Switching**: When switching from development to production, prompt user to sync local data to server
- **Conflict Resolution**: Last-write-wins strategy for conflicting data
- **Offline Support**: Automatic fallback to localStorage when API unavailable
- **Cache Management**: Local data automatically updated when API calls succeed

## Data Models and Storage Requirements

### User-Wise Data Storage

All data entities include user ownership fields (`created_by`, `owner`) to ensure users see only their own data by default. Future sharing features are supported through a separate `data_permissions` table allowing granular access control.

For detailed analysis of current frontend data storage (localStorage, React state, non-stored), see [DATA_STORAGE_ANALYSIS.md](./DATA_STORAGE_ANALYSIS.md).

### Data Permissions (for Sharing)

**Description**: Manages sharing permissions for data items between users, supporting future sharing features.

**PostgreSQL Table**: `data_permissions`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique permission identifier |
| resource_type | VARCHAR(50) | NOT NULL, CHECK (resource_type IN ('infrastructure', 'region', 'data_layer', 'analytics_report')) | Type of resource being shared |
| resource_id | INTEGER | NOT NULL | ID of the shared resource |
| owner_id | INTEGER | NOT NULL, REFERENCES users(id) | User who owns the resource |
| shared_with_user_id | INTEGER | REFERENCES users(id) | User granted access (NULL for public shares) |
| shared_with_group_id | INTEGER | REFERENCES user_groups(id) | Group granted access (NULL for individual shares) |
| permission_level | VARCHAR(20) | NOT NULL, CHECK (permission_level IN ('view', 'edit', 'delete', 'share')) | Level of access granted |
| granted_by | INTEGER | NOT NULL, REFERENCES users(id) | User who granted the permission |
| granted_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When permission was granted |
| expires_at | TIMESTAMP | | Optional expiration date |
| is_active | BOOLEAN | DEFAULT TRUE | Whether permission is active |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

### 1. Users

**Description**: Stores user accounts with authentication, roles, and profile information for role-based access control.

**PostgreSQL Table**: `users`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| name | VARCHAR(255) | NOT NULL | Full name |
| role | VARCHAR(50) | NOT NULL, CHECK (role IN ('admin', 'manager', 'technician', 'viewer')) | User role |
| permissions | JSONB | DEFAULT '[]' | Array of permission strings |
| assigned_states | JSONB | DEFAULT '[]' | Array of assigned state/region IDs |
| department | VARCHAR(255) | | Department name |
| phone_number | VARCHAR(20) | | Phone number |
| avatar | TEXT | | Avatar image URL |
| last_login | TIMESTAMP | | Last login timestamp |
| is_active | BOOLEAN | DEFAULT TRUE | Account active status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp (auto-set) |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp (auto-updated) |
| created_by | INTEGER | REFERENCES users(id) | User who created this record |
| updated_by | INTEGER | REFERENCES users(id) | User who last updated this record |
| employee_id | VARCHAR(50) | UNIQUE | Employee ID |
| gender | VARCHAR(20) | | Gender |
| address_street | TEXT | | Street address |
| address_city | VARCHAR(255) | | City |
| address_state | VARCHAR(255) | | State |
| address_pin_code | VARCHAR(10) | | PIN code |
| supervisor_name | VARCHAR(255) | | Supervisor name |
| office_location | VARCHAR(255) | | Office location |
| profile_picture | TEXT | | Profile picture URL |
| reporting_managers | JSONB | DEFAULT '[]' | Array of reporting manager IDs |

### 2. Infrastructure/Towers

**Description**: Stores telecom infrastructure data including towers, POP locations, and equipment with spatial coordinates.

**PostgreSQL Table**: `infrastructure`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique infrastructure identifier |
| name | VARCHAR(255) | NOT NULL | Infrastructure name |
| type | VARCHAR(50) | NOT NULL, CHECK (type IN ('cell', 'fiber', 'radio', 'satellite', 'pop')) | Infrastructure type |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'active', CHECK (status IN ('active', 'inactive', 'maintenance', 'critical')) | Current status |
| location | GEOMETRY(POINT, 4326) | NOT NULL | Spatial coordinates (lat/lng) using PostGIS |
| signal_strength | INTEGER | CHECK (signal_strength >= 0 AND signal_strength <= 100) | Signal strength percentage |
| coverage_radius | DECIMAL(10,2) | | Coverage radius in km |
| installed_date | DATE | | Installation date |
| last_maintenance | DATE | | Last maintenance date |
| equipment | JSONB | DEFAULT '[]' | Array of equipment objects |
| custom_attributes | JSONB | DEFAULT '{}' | Custom attributes JSON |
| priority | VARCHAR(20) | DEFAULT 'medium', CHECK (priority IN ('low', 'medium', 'high', 'critical')) | Priority level |
| owner | VARCHAR(255) | | Owner name |
| assigned_to | INTEGER | REFERENCES users(id) | Assigned user ID |
| cost | DECIMAL(15,2) | | Cost amount |
| vendor | VARCHAR(255) | | Vendor name |
| model | VARCHAR(255) | | Model name |
| serial_number | VARCHAR(255) | | Serial number |
| tags | JSONB | DEFAULT '[]' | Array of tags |
| created_by | INTEGER | REFERENCES users(id) | Creator user ID |
| updated_by | INTEGER | REFERENCES users(id) | Last updater user ID |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**PostGIS Usage**: The `location` column uses PostGIS GEOMETRY type for spatial queries, indexing, and geofencing operations.

### 3. Regions

**Description**: Defines geographic regions for geofencing and user assignments.

**PostgreSQL Table**: `regions`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique region identifier |
| name | VARCHAR(255) | NOT NULL | Region name |
| boundary | GEOMETRY(POLYGON, 4326) | NOT NULL | Geographic boundary using PostGIS |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

### 4. User Groups

**Description**: Hierarchical user groups for organization and permission management.

**PostgreSQL Table**: `user_groups`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique group identifier |
| name | VARCHAR(255) | NOT NULL | Group name |
| description | TEXT | | Group description |
| parent_id | INTEGER | REFERENCES user_groups(id) | Parent group ID |
| level | INTEGER | NOT NULL | Hierarchy level |
| path | JSONB | DEFAULT '[]' | Array of parent group IDs |
| permissions | JSONB | DEFAULT '[]' | Group permissions |
| assigned_states | JSONB | DEFAULT '[]' | Assigned regions |
| color | VARCHAR(7) | | Display color (hex) |
| icon | VARCHAR(50) | | Icon identifier |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| member_count | INTEGER | DEFAULT 0 | Number of members |
| child_groups | JSONB | DEFAULT '[]' | Child group IDs |
| created_by | INTEGER | REFERENCES users(id) | Creator user ID |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

### 5. Audit Logs

**Description**: Tracks all user actions for security and compliance.

**PostgreSQL Table**: `audit_logs`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique log identifier |
| user_id | INTEGER | REFERENCES users(id) | User who performed action |
| user_email | VARCHAR(255) | | User email at time of action |
| action | VARCHAR(100) | NOT NULL | Action performed |
| resource | VARCHAR(100) | NOT NULL | Resource type affected |
| resource_id | VARCHAR(255) | | Specific resource ID |
| timestamp | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Action timestamp |
| ip_address | INET | | Client IP address |
| user_agent | TEXT | | User agent string |
| details | JSONB | | Action details JSON |
| outcome | VARCHAR(20) | DEFAULT 'success', CHECK (outcome IN ('success', 'failure', 'partial')) | Action outcome |
| risk | VARCHAR(20) | DEFAULT 'low', CHECK (risk IN ('low', 'medium', 'high', 'critical')) | Risk level |

### 6. Analytics Data

**Description**: Stores usage statistics, performance metrics, and system health data.

**PostgreSQL Tables**:

- `analytics_usage`: Daily usage statistics
- `analytics_user_activity`: User activity logs
- `analytics_tool_metrics`: Tool usage metrics
- `analytics_reports`: Generated reports

**Example Table**: `analytics_usage`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique record identifier |
| date | DATE | NOT NULL | Date of statistics |
| total_users | INTEGER | DEFAULT 0 | Total user count |
| active_users | INTEGER | DEFAULT 0 | Active user count |
| total_sessions | INTEGER | DEFAULT 0 | Total sessions |
| avg_session_duration | INTEGER | | Average session duration (seconds) |
| total_data_items | INTEGER | DEFAULT 0 | Total data items created |
| total_storage_used | BIGINT | DEFAULT 0 | Storage used in bytes |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### 7. UI Preferences

**Description**: Stores user-specific UI preferences and settings for personalized experience.

**PostgreSQL Table**: `ui_preferences`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique preference identifier |
| user_id | INTEGER | NOT NULL, REFERENCES users(id) | User who owns the preference |
| category | VARCHAR(50) | NOT NULL | Preference category (e.g., 'layout', 'theme', 'map') |
| key | VARCHAR(255) | NOT NULL | Preference key |
| value | JSONB | | Preference value |
| data_type | VARCHAR(20) | NOT NULL, CHECK (data_type IN ('string', 'number', 'boolean', 'json', 'array')) | Value data type |
| is_active | BOOLEAN | DEFAULT TRUE | Whether preference is active |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

### 8. Workflow Presets

**Description**: Stores reusable workflow configurations and presets for common operations.

**PostgreSQL Table**: `workflow_presets`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique preset identifier |
| user_id | INTEGER | NOT NULL, REFERENCES users(id) | User who created the preset |
| name | VARCHAR(255) | NOT NULL | Preset name |
| description | TEXT | | Preset description |
| category | VARCHAR(50) | NOT NULL | Preset category (e.g., 'analysis', 'reporting', 'mapping') |
| configuration | JSONB | NOT NULL | Workflow configuration JSON |
| is_public | BOOLEAN | DEFAULT FALSE | Whether preset is shared publicly |
| tags | JSONB | DEFAULT '[]' | Array of tags for organization |
| usage_count | INTEGER | DEFAULT 0 | Number of times preset has been used |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

### 9. Search History

**Description**: Tracks user search queries and filters for improved UX and analytics.

**PostgreSQL Table**: `search_history`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique search record identifier |
| user_id | INTEGER | NOT NULL, REFERENCES users(id) | User who performed the search |
| query | TEXT | NOT NULL | Search query string |
| filters | JSONB | DEFAULT '{}' | Applied filters JSON |
| result_count | INTEGER | | Number of results returned |
| search_type | VARCHAR(50) | NOT NULL | Type of search (e.g., 'infrastructure', 'regions', 'users') |
| search_duration | INTEGER | | Search execution time in milliseconds |
| is_successful | BOOLEAN | DEFAULT TRUE | Whether search completed successfully |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Search timestamp |

### 10. System Configuration

**Description**: Stores system-wide configuration settings.

**PostgreSQL Table**: `system_config`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique config identifier |
| category | VARCHAR(50) | NOT NULL | Configuration category |
| key | VARCHAR(255) | NOT NULL | Configuration key |
| value | JSONB | | Configuration value |
| description | TEXT | | Configuration description |
| data_type | VARCHAR(20) | NOT NULL, CHECK (data_type IN ('string', 'number', 'boolean', 'json', 'array')) | Value data type |
| default_value | JSONB | | Default value |
| is_editable | BOOLEAN | DEFAULT TRUE | Whether editable via UI |
| requires_restart | BOOLEAN | DEFAULT FALSE | Requires system restart |
| validation | JSONB | | Validation rules |
| last_modified | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification |
| modified_by | INTEGER | REFERENCES users(id) | User who modified |
| environment | VARCHAR(20) | DEFAULT 'all', CHECK (environment IN ('development', 'staging', 'production', 'all')) | Applicable environment |

## Implementation Process (Priority-Based)

### Priority 1: Foundation Setup (Most Critical - Start Here)

#### 1.1 Backend Infrastructure Setup
**Dependencies:** Node.js, PostgreSQL/PostGIS
**Tasks:**
- Create `backend/` directory in project root
- Initialize Node.js project: `npm init -y`
- Install dependencies:
  ```bash
  npm install express pg bcryptjs jsonwebtoken cors dotenv helmet express-rate-limit express-validator
  npm install -D nodemon @types/node @types/express @types/pg @types/bcryptjs @types/jsonwebtoken
  ```
- Create basic server structure:
  - `backend/server.js` - Main server file
  - `backend/db.js` - Database connection
  - `backend/routes/` - API route handlers
  - `backend/models/` - Database models/queries
  - `backend/middleware/` - Authentication middleware
- Set up development environment with nodemon
- Create .env files for development/production

**Verification:**
- `npm start` runs server on port 3001
- Health check endpoint returns 200 OK
- Environment variables loaded correctly

#### 1.2 Database Setup
**Dependencies:** PostgreSQL 13+, PostGIS extension
**Tasks:**
- Install PostgreSQL locally or via Docker
- Create opticonnect database
- Enable PostGIS extension: `CREATE EXTENSION postgis;`
- Run complete schema creation from "Database Migration Scripts" section
- Create database indexes for performance
- Seed with sample data (users, infrastructure, regions)

**Verification:**
- Connect to database via psql or pgAdmin
- Verify all tables created with correct columns
- Run sample queries to confirm PostGIS functionality
- Check indexes created

#### 1.3 Basic Authentication Backend
**Dependencies:** Database setup
**Tasks:**
- Implement user model with database queries
- Create auth routes: `/api/auth/login`, `/api/auth/register`, `/api/auth/profile`
- Add JWT token generation/validation
- Implement bcrypt password hashing
- Add basic middleware for authentication

**Verification:**
- Register new user via API
- Login and receive JWT token
- Access protected `/api/auth/profile` endpoint with token
- Invalid tokens return 401

#### 1.4 Frontend API Services Implementation
**Dependencies:** Backend auth endpoints
**Tasks:**
- Create `src/services/apiService.ts` with Axios configuration
- Implement JWT token interceptors and error handling
- Create `src/services/dataCenter.ts` for environment switching
- Add retry logic and request/response interceptors

**Verification:**
- API service makes successful calls to backend
- JWT tokens automatically included in requests
- Failed requests trigger appropriate error handling

#### 1.5 Redux Store Updates
**Dependencies:** API services
**Tasks:**
- Update `src/store/slices/authSlice.ts` to use API calls instead of localStorage
- Convert `src/store/slices/userManagementSlice.ts` to use Data Center
- Add loading states and error handling to slices
- Implement optimistic updates where appropriate

**Verification:**
- Redux dev tools show API calls in action
- Loading states display during API requests
- Errors properly handled and displayed to user

### Priority 2: Core Integration (Infrastructure & Users)

#### 2.1 Infrastructure API
**Dependencies:** Basic auth backend
**Tasks:**
- Implement infrastructure CRUD (`/api/infrastructure`)
- Add PostGIS spatial queries for location data
- Implement data permissions for sharing
- Add equipment and custom attributes support
- Create spatial indexing and geofencing queries

**Verification:**
- Create/update/delete infrastructure items via API
- Spatial queries work (points within regions)
- Permission system prevents unauthorized access
- Custom attributes and equipment stored correctly

#### 2.2 User Management API
**Dependencies:** Infrastructure API
**Tasks:**
- Implement full CRUD for users (`/api/users`)
- Add role-based access control middleware
- Implement user groups and permissions
- Add user profile updates with extended fields
- Create audit logging for user actions

**Verification:**
- Admin can list/create/update/delete users
- Non-admin users cannot access user management
- User profile updates work correctly
- Audit logs record user actions

#### 2.3 Environment Mode Integration
**Dependencies:** Data Center service
**Tasks:**
- Create environment mode switcher component
- Update components to use Data Center calls
- Implement maintenance mode with read-only access
- Add offline fallback to localStorage

**Verification:**
- Environment switching works (dev/prod/maintenance)
- Components fetch data from API instead of localStorage
- Maintenance mode prevents modifications
- Offline mode falls back gracefully

### Priority 3: Advanced Features (Analytics, Security, Performance)

#### 3.1 Analytics and Reporting
**Dependencies:** Core APIs
**Tasks:**
- Implement analytics data collection
- Create reporting endpoints (`/api/analytics/*`)
- Add dashboard data aggregation
- Implement usage tracking and metrics

**Verification:**
- Analytics data collected on user actions
- Reports generated with correct metrics
- Dashboard displays real-time data

#### 3.2 Security and Audit
**Dependencies:** All APIs
**Tasks:**
- Implement comprehensive audit logging
- Add data permissions and sharing system
- Enhance security with rate limiting and validation
- Implement GDPR compliance features

**Verification:**
- All security-relevant events logged
- Permission system controls data access
- Rate limiting prevents abuse
- Data privacy features work correctly

#### 3.3 File Upload and Import System
**Dependencies:** Infrastructure API
**Tasks:**
- Add file upload endpoints for KML/CSV
- Implement data import processing
- Add bulk operations support
- Create import validation and error reporting

**Verification:**
- KML files uploaded and parsed correctly
- CSV data imported with validation
- Bulk operations complete successfully
- Errors reported for invalid data

#### 3.4 Real-time Features and Performance
**Dependencies:** All features
**Tasks:**
- Implement WebSocket server for real-time updates
- Add live infrastructure status updates
- Create notification system
- Optimize database queries and add caching

**Verification:**
- Real-time updates appear without page refresh
- Multiple users see changes simultaneously
- Performance benchmarks met
- System handles concurrent users efficiently

## Legacy Implementation Process (Original Steps)

### Step 1: Backend Setup

1. Create `backend/` directory in project root
2. Initialize Node.js project: `npm init -y`
3. Install dependencies:
   ```bash
   npm install express pg bcryptjs jsonwebtoken cors dotenv helmet express-rate-limit express-validator
   npm install -D nodemon @types/node @types/express @types/pg @types/bcryptjs @types/jsonwebtoken
   ```
4. Create basic server structure:
   - `backend/server.js` - Main server file
   - `backend/db.js` - Database connection
   - `backend/routes/` - API route handlers
   - `backend/models/` - Database models/queries
   - `backend/middleware/` - Authentication middleware

### Step 2: Database Setup

1. Install PostgreSQL and PostGIS extension
2. Create database: `createdb opticonnect`
3. Enable PostGIS: `CREATE EXTENSION postgis;`
4. Run schema creation script with all tables above
5. Create indexes for performance:
   ```sql
   CREATE INDEX idx_infrastructure_location ON infrastructure USING GIST (location);
   CREATE INDEX idx_regions_boundary ON regions USING GIST (boundary);
   CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp);
   CREATE INDEX idx_users_email ON users (email);
   ```

### Step 3: API Development

Create RESTful endpoints with user-wise data isolation (users see only their own data by default, with shared data accessible via permissions):

| Endpoint | Method | Description | Access Control |
|----------|--------|-------------|----------------|
| **Authentication** | | | |
| `/api/auth/login` | POST | User authentication | Public |
| `/api/auth/register` | POST | User registration | Admin only |
| `/api/auth/profile` | GET | Get current user profile | Authenticated user |
| `/api/auth/profile` | PUT | Update current user profile | Authenticated user |
| **Users Management** | | | |
| `/api/users` | GET | List users (paginated) | Admin only |
| `/api/users` | POST | Create user | Admin only |
| `/api/users/:id` | PUT | Update user | Admin only |
| `/api/users/:id` | DELETE | Delete user | Admin only |
| **Infrastructure** | | | |
| `/api/infrastructure` | GET | List user's infrastructure + shared items | Owner + shared users |
| `/api/infrastructure` | POST | Create infrastructure item | Authenticated user (owner) |
| `/api/infrastructure/:id` | PUT | Update infrastructure | Owner or shared with edit permission |
| `/api/infrastructure/:id` | DELETE | Delete infrastructure | Owner or shared with delete permission |
| `/api/infrastructure/:id/share` | POST | Share infrastructure with another user/group | Owner only |
| **Regions** | | | |
| `/api/regions` | GET | List user's regions + shared items | Owner + shared users |
| `/api/regions` | POST | Create region | Authenticated user (owner) |
| `/api/regions/:id` | PUT | Update region | Owner or shared with edit permission |
| `/api/regions/:id` | DELETE | Delete region | Owner or shared with delete permission |
| **Data Permissions** | | | |
| `/api/permissions` | GET | List permissions granted by/received by user | Authenticated user |
| `/api/permissions` | POST | Grant permission to share data | Resource owner |
| `/api/permissions/:id` | PUT | Update permission | Permission granter |
| `/api/permissions/:id` | DELETE | Revoke permission | Permission granter |
| **Audit Logs** | | | |
| `/api/audit` | GET | Audit logs (filtered by user permissions) | Based on user role |
| **Analytics** | | | |
| `/api/analytics/*` | GET | Analytics endpoints (user-specific data) | Based on user role |
| **UI Preferences** | | | |
| `/api/preferences` | GET | Get user's UI preferences | Authenticated user |
| `/api/preferences` | PUT | Update user's UI preferences | Authenticated user |
| `/api/preferences/:category` | GET | Get preferences for specific category | Authenticated user |
| `/api/preferences/:category/:key` | PUT | Update specific preference | Authenticated user |
| **Workflow Presets** | | | |
| `/api/presets` | GET | List user's workflow presets | Authenticated user |
| `/api/presets` | POST | Create new workflow preset | Authenticated user |
| `/api/presets/:id` | GET | Get specific preset | Owner or shared users |
| `/api/presets/:id` | PUT | Update preset | Owner |
| `/api/presets/:id` | DELETE | Delete preset | Owner |
| `/api/presets/:id/share` | POST | Share preset with another user/group | Owner |
| **Search History** | | | |
| `/api/search/history` | GET | Get user's search history | Authenticated user |
| `/api/search/history` | POST | Record new search | Authenticated user |
| `/api/search/history/:id` | DELETE | Delete specific search record | Owner |
| `/api/search/history/clear` | DELETE | Clear all search history | Authenticated user |

### Step 4: Frontend Integration

#### 4.1 Create Data Center Service

Create `src/services/dataCenter.ts` with the following implementation:

```typescript
import { apiService } from './apiService';

export type EnvironmentMode = 'development' | 'production' | 'maintenance';

export interface Infrastructure {
  id: string;
  name: string;
  type: string;
  status: string;
  location: { lat: number; lng: number };
  signal_strength?: number;
  coverage_radius?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InfrastructureData {
  name: string;
  type: string;
  status: string;
  location: { lat: number; lng: number };
  signal_strength?: number;
  coverage_radius?: number;
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  preferences: Record<string, any>;
}

export interface SystemConfig {
  theme: string;
  language: string;
  features: Record<string, boolean>;
}

class DataCenter {
  private currentMode: EnvironmentMode = 'development';
  private localStoragePrefix = 'opticonnect_';

  constructor() {
    // Initialize mode from environment variable or localStorage
    const envMode = process.env.REACT_APP_MODE as EnvironmentMode;
    if (envMode && ['development', 'production', 'maintenance'].includes(envMode)) {
      this.currentMode = envMode;
    } else {
      const savedMode = localStorage.getItem(`${this.localStoragePrefix}mode`) as EnvironmentMode;
      if (savedMode) {
        this.currentMode = savedMode;
      }
    }
  }

  // Environment management
  setMode(mode: EnvironmentMode): void {
    if (this.currentMode === 'maintenance' && mode !== 'maintenance') {
      console.warn('Cannot exit maintenance mode programmatically');
      return;
    }

    this.currentMode = mode;
    localStorage.setItem(`${this.localStoragePrefix}mode`, mode);
    window.dispatchEvent(new CustomEvent('environmentModeChanged', { detail: mode }));
  }

  getMode(): EnvironmentMode {
    return this.currentMode;
  }

  // Infrastructure operations
  async getInfrastructure(): Promise<Infrastructure[]> {
    if (this.currentMode === 'development') {
      return this.getInfrastructureFromLocalStorage();
    } else if (this.currentMode === 'maintenance') {
      return this.getInfrastructureFromLocalStorage();
    } else {
      try {
        const response = await apiService.get('/infrastructure');
        this.saveInfrastructureToLocalStorage(response.data);
        return response.data;
      } catch (error) {
        console.warn('API unavailable, falling back to localStorage');
        return this.getInfrastructureFromLocalStorage();
      }
    }
  }

  async createInfrastructure(data: InfrastructureData): Promise<Infrastructure> {
    if (this.currentMode === 'maintenance') {
      throw new Error('System is in maintenance mode - read-only access');
    }

    if (this.currentMode === 'development') {
      return this.createInfrastructureInLocalStorage(data);
    } else {
      const response = await apiService.post('/infrastructure', data);
      this.saveInfrastructureToLocalStorage([...this.getInfrastructureFromLocalStorage(), response.data]);
      return response.data;
    }
  }

  async updateInfrastructure(id: string, data: Partial<InfrastructureData>): Promise<Infrastructure> {
    if (this.currentMode === 'maintenance') {
      throw new Error('System is in maintenance mode - read-only access');
    }

    if (this.currentMode === 'development') {
      return this.updateInfrastructureInLocalStorage(id, data);
    } else {
      const response = await apiService.put(`/infrastructure/${id}`, data);
      const localData = this.getInfrastructureFromLocalStorage();
      const updatedData = localData.map(item =>
        item.id === id ? { ...item, ...response.data } : item
      );
      this.saveInfrastructureToLocalStorage(updatedData);
      return response.data;
    }
  }

  async deleteInfrastructure(id: string): Promise<void> {
    if (this.currentMode === 'maintenance') {
      throw new Error('System is in maintenance mode - read-only access');
    }

    if (this.currentMode === 'development') {
      this.deleteInfrastructureFromLocalStorage(id);
    } else {
      await apiService.delete(`/infrastructure/${id}`);
      const localData = this.getInfrastructureFromLocalStorage();
      const filteredData = localData.filter(item => item.id !== id);
      this.saveInfrastructureToLocalStorage(filteredData);
    }
  }

  // User data operations
  async getUserData(): Promise<UserData> {
    if (this.currentMode === 'development') {
      return this.getUserDataFromLocalStorage();
    } else {
      try {
        const response = await apiService.get('/auth/profile');
        this.saveUserDataToLocalStorage(response.data);
        return response.data;
      } catch (error) {
        return this.getUserDataFromLocalStorage();
      }
    }
  }

  async saveUserData(data: UserData): Promise<void> {
    if (this.currentMode === 'development') {
      this.saveUserDataToLocalStorage(data);
    } else {
      await apiService.put('/auth/profile', data);
      this.saveUserDataToLocalStorage(data);
    }
  }

  // Configuration operations
  async getConfig(): Promise<SystemConfig> {
    const key = `${this.localStoragePrefix}config`;
    const cached = localStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached);
    }

    const defaultConfig: SystemConfig = {
      theme: 'light',
      language: 'en',
      features: {
        analytics: true,
        notifications: true,
        darkMode: false
      }
    };

    this.saveConfigToLocalStorage(defaultConfig);
    return defaultConfig;
  }

  async updateConfig(config: Partial<SystemConfig>): Promise<void> {
    const currentConfig = await this.getConfig();
    const updatedConfig = { ...currentConfig, ...config };
    this.saveConfigToLocalStorage(updatedConfig);
  }

  // Local storage helpers
  private getInfrastructureFromLocalStorage(): Infrastructure[] {
    const key = `${this.localStoragePrefix}infrastructure`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private saveInfrastructureToLocalStorage(data: Infrastructure[]): void {
    const key = `${this.localStoragePrefix}infrastructure`;
    localStorage.setItem(key, JSON.stringify(data));
  }

  private createInfrastructureInLocalStorage(data: InfrastructureData): Infrastructure {
    const newItem: Infrastructure = {
      ...data,
      id: Date.now().toString(),
      created_by: 'dev-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const existing = this.getInfrastructureFromLocalStorage();
    existing.push(newItem);
    this.saveInfrastructureToLocalStorage(existing);

    return newItem;
  }

  private updateInfrastructureInLocalStorage(id: string, data: Partial<InfrastructureData>): Infrastructure {
    const existing = this.getInfrastructureFromLocalStorage();
    const index = existing.findIndex(item => item.id === id);

    if (index === -1) {
      throw new Error('Infrastructure item not found');
    }

    existing[index] = {
      ...existing[index],
      ...data,
      updated_at: new Date().toISOString()
    };

    this.saveInfrastructureToLocalStorage(existing);
    return existing[index];
  }

  private deleteInfrastructureFromLocalStorage(id: string): void {
    const existing = this.getInfrastructureFromLocalStorage();
    const filtered = existing.filter(item => item.id !== id);
    this.saveInfrastructureToLocalStorage(filtered);
  }

  private getUserDataFromLocalStorage(): UserData {
    const key = `${this.localStoragePrefix}user`;
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }

    return {
      id: 'dev-user',
      email: 'dev@example.com',
      name: 'Development User',
      role: 'admin',
      preferences: {}
    };
  }

  private saveUserDataToLocalStorage(data: UserData): void {
    const key = `${this.localStoragePrefix}user`;
    localStorage.setItem(key, JSON.stringify(data));
  }

  private saveConfigToLocalStorage(config: SystemConfig): void {
    const key = `${this.localStoragePrefix}config`;
    localStorage.setItem(key, JSON.stringify(config));
  }
}

// Export singleton instance
export const dataCenter = new DataCenter();
```

#### 4.2 Create API Service

Create `src/services/apiService.ts`:

```typescript
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('opticonnect_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, redirect to login
          localStorage.removeItem('opticonnect_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic CRUD methods
  async get<T = any>(url: string, params?: any): Promise<T> {
    const response = await this.api.get(url, { params });
    return response.data;
  }

  async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.api.post(url, data);
    return response.data;
  }

  async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.api.put(url, data);
    return response.data;
  }

  async delete<T = any>(url: string): Promise<T> {
    const response = await this.api.delete(url);
    return response.data;
  }

  // Authentication methods
  async login(credentials: { email: string; password: string }): Promise<{ token: string; user: any }> {
    const response = await this.api.post('/auth/login', credentials);
    const { token, user } = response.data;
    localStorage.setItem('opticonnect_token', token);
    return { token, user };
  }

  async logout(): Promise<void> {
    localStorage.removeItem('opticonnect_token');
    await this.api.post('/auth/logout');
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!localStorage.getItem('opticonnect_token');
  }

  getToken(): string | null {
    return localStorage.getItem('opticonnect_token');
  }
}

export const apiService = new ApiService();
```

#### 4.3 Environment Mode Switcher Component

Create `src/components/admin/EnvironmentModeSwitcher.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { dataCenter, EnvironmentMode } from '../../services/dataCenter';
import { useAuth } from '../../hooks/useAuth';

const EnvironmentModeSwitcher: React.FC = () => {
  const { user } = useAuth();
  const [currentMode, setCurrentMode] = useState<EnvironmentMode>(dataCenter.getMode());
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);

  useEffect(() => {
    const handleModeChange = (event: CustomEvent<EnvironmentMode>) => {
      setCurrentMode(event.detail);
    };

    window.addEventListener('environmentModeChanged', handleModeChange as EventListener);
    return () => window.removeEventListener('environmentModeChanged', handleModeChange as EventListener);
  }, []);

  const handleModeChange = (newMode: EnvironmentMode) => {
    if (newMode === 'maintenance') {
      setIsMaintenanceDialogOpen(true);
    } else {
      dataCenter.setMode(newMode);
    }
  };

  const confirmMaintenanceMode = () => {
    dataCenter.setMode('maintenance');
    setIsMaintenanceDialogOpen(false);
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="environment-mode-switcher">
      <h3>Environment Mode</h3>
      <div className="mode-buttons">
        <button
          className={currentMode === 'development' ? 'active' : ''}
          onClick={() => handleModeChange('development')}
        >
          Development
        </button>
        <button
          className={currentMode === 'production' ? 'active' : ''}
          onClick={() => handleModeChange('production')}
        >
          Production
        </button>
        <button
          className={currentMode === 'maintenance' ? 'active' : ''}
          onClick={() => handleModeChange('maintenance')}
        >
          Maintenance
        </button>
      </div>

      {currentMode === 'maintenance' && (
        <div className="maintenance-banner">
          ⚠️ System is in maintenance mode - Read-only access
        </div>
      )}

      {isMaintenanceDialogOpen && (
        <div className="maintenance-dialog">
          <div className="dialog-content">
            <h4>Enter Maintenance Mode</h4>
            <p>This will put the system in read-only mode. Are you sure?</p>
            <div className="dialog-actions">
              <button onClick={() => setIsMaintenanceDialogOpen(false)}>Cancel</button>
              <button onClick={confirmMaintenanceMode}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentModeSwitcher;
```

#### 4.4 Update Redux Store

Add environment slice to `src/store/slices/environmentSlice.ts`:

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EnvironmentMode } from '../../services/dataCenter';

interface EnvironmentState {
  mode: EnvironmentMode;
  isOnline: boolean;
  lastSync: string | null;
}

const initialState: EnvironmentState = {
  mode: 'development',
  isOnline: navigator.onLine,
  lastSync: null,
};

const environmentSlice = createSlice({
  name: 'environment',
  initialState,
  reducers: {
    setEnvironmentMode: (state, action: PayloadAction<EnvironmentMode>) => {
      state.mode = action.payload;
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setLastSync: (state, action: PayloadAction<string>) => {
      state.lastSync = action.payload;
    },
  },
});

export const { setEnvironmentMode, setOnlineStatus, setLastSync } = environmentSlice.actions;
export default environmentSlice.reducer;
```

#### 4.5 Update Infrastructure Slice

Modify `src/store/slices/infrastructureSlice.ts` to use Data Center:

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { dataCenter, Infrastructure, InfrastructureData } from '../../services/dataCenter';

export const fetchInfrastructure = createAsyncThunk(
  'infrastructure/fetchInfrastructure',
  async () => {
    return await dataCenter.getInfrastructure();
  }
);

export const createInfrastructure = createAsyncThunk(
  'infrastructure/createInfrastructure',
  async (data: InfrastructureData) => {
    return await dataCenter.createInfrastructure(data);
  }
);

export const updateInfrastructure = createAsyncThunk(
  'infrastructure/updateInfrastructure',
  async ({ id, data }: { id: string; data: Partial<InfrastructureData> }) => {
    return await dataCenter.updateInfrastructure(id, data);
  }
);

export const deleteInfrastructure = createAsyncThunk(
  'infrastructure/deleteInfrastructure',
  async (id: string) => {
    await dataCenter.deleteInfrastructure(id);
    return id;
  }
);

interface InfrastructureState {
  items: Infrastructure[];
  loading: boolean;
  error: string | null;
}

const initialState: InfrastructureState = {
  items: [],
  loading: false,
  error: null,
};

const infrastructureSlice = createSlice({
  name: 'infrastructure',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInfrastructure.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInfrastructure.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchInfrastructure.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch infrastructure';
      })
      .addCase(createInfrastructure.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateInfrastructure.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteInfrastructure.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  },
});

export const { clearError } = infrastructureSlice.actions;
export default infrastructureSlice.reducer;
```

#### 4.6 Update Components

Update components to use Data Center calls instead of direct API calls. For example, modify `src/components/data/EnhancedDataManager.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { dataCenter, EnvironmentMode } from '../../services/dataCenter';
import { fetchInfrastructure } from '../../store/slices/infrastructureSlice';

const EnhancedDataManager: React.FC = () => {
  const dispatch = useDispatch();
  const { items: infrastructure, loading, error } = useSelector((state: any) => state.infrastructure);
  const [currentMode, setCurrentMode] = useState<EnvironmentMode>(dataCenter.getMode());

  useEffect(() => {
    dispatch(fetchInfrastructure());
  }, [dispatch]);

  useEffect(() => {
    const handleModeChange = (event: CustomEvent<EnvironmentMode>) => {
      setCurrentMode(event.detail);
      // Refresh data when mode changes
      dispatch(fetchInfrastructure());
    };

    window.addEventListener('environmentModeChanged', handleModeChange as EventListener);
    return () => window.removeEventListener('environmentModeChanged', handleModeChange as EventListener);
  }, [dispatch]);

  return (
    <div className="enhanced-data-manager">
      <div className="mode-indicator">
        Current Mode: <strong>{currentMode}</strong>
        {currentMode === 'maintenance' && (
          <span className="maintenance-notice"> (Read-Only)</span>
        )}
      </div>

      {loading && <div className="loading-spinner">Loading...</div>}
      {error && <div className="error-message">{error}</div>}

      {/* Rest of component implementation */}
    </div>
  );
};

export default EnhancedDataManager;
```

### Step 5: Testing and Deployment

1. Test all API endpoints with Postman/curl
2. Test frontend-backend integration
3. Set up environment variables for production
4. Deploy backend and database
5. Update frontend build with production API URL

## Migration Strategy

### From Sample Data to Backend Integration

Connecting to the backend will ensure smooth website operation. The frontend is already designed for API integration with:

- Axios for HTTP requests (already installed)
- Redux Toolkit for state management with async thunks
- Error boundaries for graceful error handling
- Loading states for better UX
- JWT token management for authentication

The process will be smooth because:

- All data operations are abstracted through Redux actions
- Components expect data from props/state, not hardcoded values
- Authentication flow is already implemented for token-based auth
- Error handling is in place for network failures

Potential considerations:

- Add loading spinners during API calls
- Implement offline capabilities if needed
- Handle API rate limiting
- Add retry logic for failed requests

The website will continue to run smoothly as the backend provides the data layer the frontend expects.

#### Phase 1: Parallel Implementation
- Keep existing sample data functionality intact
- Implement Data Center alongside current data management
- Add feature flags to switch between data sources
- Test both implementations in parallel

#### Phase 2: Gradual Migration
- Start with read-only operations using Data Center
- Migrate individual components one by one
- Update Redux slices to use Data Center calls
- Maintain backward compatibility during transition

#### Phase 3: Full Migration
- Remove sample data dependencies
- Update all components to use Data Center
- Clean up unused sample data files
- Update build configurations for production

### Data Migration Script
```typescript
// src/utils/dataMigration.ts
import { dataCenter } from '../services/dataCenter';

export const migrateLocalDataToBackend = async () => {
  try {
    // Get local data
    const localInfrastructure = JSON.parse(localStorage.getItem('opticonnect_infrastructure') || '[]');

    // Migrate to backend
    for (const item of localInfrastructure) {
      await dataCenter.createInfrastructure(item);
    }

    // Clear local data after successful migration
    localStorage.removeItem('opticonnect_infrastructure');

    console.log('Data migration completed successfully');
  } catch (error) {
    console.error('Data migration failed:', error);
    throw error;
  }
};
```

## Performance Considerations

### Frontend Optimizations
- **Lazy Loading**: Implement code splitting for Data Center and API services
- **Caching Strategy**: Use React Query or SWR for intelligent caching
- **Debouncing**: Debounce API calls for search and filter operations
- **Pagination**: Implement virtual scrolling for large datasets

### Backend Performance
- **Database Indexing**: Ensure proper indexes on frequently queried columns
- **Query Optimization**: Use prepared statements and connection pooling
- **Caching Layer**: Implement Redis for frequently accessed data
- **Rate Limiting**: Protect API endpoints from abuse

### Network Optimization
- **Request Batching**: Combine multiple API calls into single requests
- **Compression**: Enable gzip compression for API responses
- **CDN**: Use CDN for static assets and API responses
- **Offline Support**: Implement service worker for offline functionality

## Security Best Practices

### Authentication & Authorization
- **JWT Token Management**: Implement secure token storage and refresh
- **Role-Based Access Control**: Enforce permissions at API and component levels
- **Session Management**: Implement proper session timeouts and invalidation
- **Password Policies**: Enforce strong password requirements

### Data Protection
- **Input Validation**: Validate all user inputs on client and server
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Protection**: Sanitize user inputs and escape HTML content
- **CSRF Protection**: Implement CSRF tokens for state-changing operations

### API Security
- **HTTPS Only**: Enforce SSL/TLS for all API communications
- **API Keys**: Use secure API key management
- **Request Signing**: Implement request signing for sensitive operations
- **Audit Logging**: Log all security-relevant events

## Monitoring and Logging

### Application Monitoring
- **Error Tracking**: Implement error boundary logging and reporting
- **Performance Monitoring**: Track API response times and user interactions
- **User Analytics**: Monitor user behavior and feature usage
- **System Health**: Track system resources and availability

### Logging Strategy
```typescript
// src/utils/logger.ts
class Logger {
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';

  debug(message: string, data?: any) {
    if (this.logLevel === 'debug') {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }

  info(message: string, data?: any) {
    console.info(`[INFO] ${message}`, data);
    // Send to logging service in production
  }

  warn(message: string, data?: any) {
    console.warn(`[WARN] ${message}`, data);
    // Send to monitoring service
  }

  error(message: string, error?: any) {
    console.error(`[ERROR] ${message}`, error);
    // Send to error tracking service
  }
}

export const logger = new Logger();
```

## Troubleshooting Guide

### Common Issues and Solutions

#### API Connection Issues
- **Problem**: Unable to connect to backend API
- **Solutions**:
  - Check REACT_APP_API_URL environment variable
  - Verify backend server is running
  - Check network connectivity and CORS settings
  - Review API endpoint URLs

#### Authentication Problems
- **Problem**: Users unable to login or access protected resources
- **Solutions**:
  - Verify JWT token is stored correctly
  - Check token expiration and refresh logic
  - Validate user roles and permissions
  - Review authentication middleware

#### Data Synchronization Issues
- **Problem**: Data not syncing between localStorage and API
- **Solutions**:
  - Check Data Center mode configuration
  - Verify API endpoints are accessible
  - Review error handling in Data Center methods
  - Check localStorage quota limits

#### Performance Issues
- **Problem**: Slow loading times or unresponsive UI
- **Solutions**:
  - Implement pagination for large datasets
  - Add loading states and skeleton screens
  - Optimize bundle size with code splitting
  - Cache frequently accessed data

### Debug Mode Configuration
```bash
# Enable debug logging
REACT_APP_DEBUG=true
REACT_APP_LOG_LEVEL=debug

# Disable caching for development
REACT_APP_DISABLE_CACHE=true
```

## Future Enhancements

### Planned Features
- **Real-time Updates**: WebSocket integration for live data updates
- **Advanced Sharing**: Granular permission system for data collaboration
- **Offline Mode**: Full offline capability with data synchronization
- **Mobile App**: React Native implementation using shared business logic
- **Analytics Dashboard**: Advanced reporting and business intelligence
- **API Versioning**: Support for multiple API versions
- **Multi-tenancy**: Support for multiple organizations

### Scalability Improvements
- **Microservices Architecture**: Break down monolithic backend into services
- **Database Sharding**: Horizontal scaling for large datasets
- **CDN Integration**: Global content delivery for better performance
- **Load Balancing**: Distribute traffic across multiple servers

## Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured for production
- [ ] Database schema created and migrated
- [ ] SSL certificates installed and configured
- [ ] DNS records updated
- [ ] CDN configured for static assets

### Backend Deployment
- [ ] Node.js dependencies installed
- [ ] Database connection tested
- [ ] Environment variables validated
- [ ] API endpoints tested with Postman
- [ ] Authentication and authorization verified

### Frontend Deployment
- [ ] Build process completed successfully
- [ ] Static assets optimized and minified
- [ ] API URLs updated for production
- [ ] Error boundaries and logging configured
- [ ] Performance monitoring enabled

### Post-deployment
- [ ] Smoke tests performed on production
- [ ] User acceptance testing completed
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery procedures tested
- [ ] Documentation updated for operations team

### Rollback Plan
- [ ] Previous version backup available
- [ ] Database backup created
- [ ] Rollback scripts prepared
- [ ] Communication plan for users
- [ ] Monitoring during rollback process

## API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Authenticate user and return JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "technician",
    "permissions": ["read", "write"]
  }
}
```

#### POST /api/auth/register
Register new user (Admin only).

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "name": "New User",
  "role": "viewer",
  "department": "Engineering"
}
```

#### GET /api/auth/profile
Get current user profile.

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "role": "technician",
  "department": "Engineering",
  "permissions": ["read", "write"],
  "last_login": "2024-01-15T10:30:00Z"
}
```

### Infrastructure Endpoints

#### GET /api/infrastructure
List user's infrastructure items with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `type`: Filter by infrastructure type
- `status`: Filter by status

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Cell Tower Alpha",
      "type": "cell",
      "status": "active",
      "location": {
        "lat": 40.7128,
        "lng": -74.0060
      },
      "signal_strength": 85,
      "coverage_radius": 2.5,
      "created_by": 1,
      "created_at": "2024-01-15T08:00:00Z",
      "updated_at": "2024-01-15T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### POST /api/infrastructure
Create new infrastructure item.

**Request Body:**
```json
{
  "name": "New Cell Tower",
  "type": "cell",
  "status": "active",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "signal_strength": 90,
  "coverage_radius": 3.0,
  "equipment": [
    {
      "type": "antenna",
      "model": "ANT-123",
      "serial_number": "SN123456"
    }
  ]
}
```

#### PUT /api/infrastructure/:id
Update infrastructure item.

#### DELETE /api/infrastructure/:id
Delete infrastructure item.

### Analytics Endpoints

#### GET /api/analytics/usage
Get usage statistics.

**Query Parameters:**
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)
- `group_by`: Group by (day/week/month)

**Response:**
```json
{
  "period": "2024-01",
  "total_users": 150,
  "active_users": 89,
  "total_sessions": 1247,
  "avg_session_duration": 1800,
  "total_data_items": 2340,
  "top_features": [
    {"feature": "map_view", "usage_count": 450},
    {"feature": "data_export", "usage_count": 234}
  ]
}
```

## Database Migration Scripts

### Initial Schema Setup
```sql
-- Create database
CREATE DATABASE opticonnect;
\c opticonnect;

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'technician', 'viewer')),
    permissions JSONB DEFAULT '[]',
    assigned_states JSONB DEFAULT '[]',
    department VARCHAR(255),
    phone_number VARCHAR(20),
    avatar TEXT,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    employee_id VARCHAR(50) UNIQUE,
    gender VARCHAR(20),
    address_street TEXT,
    address_city VARCHAR(255),
    address_state VARCHAR(255),
    address_pin_code VARCHAR(10),
    supervisor_name VARCHAR(255),
    office_location VARCHAR(255),
    profile_picture TEXT,
    reporting_managers JSONB DEFAULT '[]'
);

-- Create infrastructure table
CREATE TABLE infrastructure (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('cell', 'fiber', 'radio', 'satellite', 'pop')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'critical')),
    location GEOMETRY(POINT, 4326) NOT NULL,
    signal_strength INTEGER CHECK (signal_strength >= 0 AND signal_strength <= 100),
    coverage_radius DECIMAL(10,2),
    installed_date DATE,
    last_maintenance DATE,
    equipment JSONB DEFAULT '[]',
    custom_attributes JSONB DEFAULT '{}',
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    owner VARCHAR(255),
    assigned_to INTEGER REFERENCES users(id),
    cost DECIMAL(15,2),
    vendor VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(255),
    tags JSONB DEFAULT '[]',
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create regions table
CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    boundary GEOMETRY(POLYGON, 4326) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_groups table
CREATE TABLE user_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES user_groups(id),
    level INTEGER NOT NULL,
    path JSONB DEFAULT '[]',
    permissions JSONB DEFAULT '[]',
    assigned_states JSONB DEFAULT '[]',
    color VARCHAR(7),
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    member_count INTEGER DEFAULT 0,
    child_groups JSONB DEFAULT '[]',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    outcome VARCHAR(20) DEFAULT 'success' CHECK (outcome IN ('success', 'failure', 'partial')),
    risk VARCHAR(20) DEFAULT 'low' CHECK (risk IN ('low', 'medium', 'high', 'critical'))
);

-- Create data_permissions table
CREATE TABLE data_permissions (
    id SERIAL PRIMARY KEY,
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('infrastructure', 'region', 'data_layer', 'analytics_report')),
    resource_id INTEGER NOT NULL,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    shared_with_user_id INTEGER REFERENCES users(id),
    shared_with_group_id INTEGER REFERENCES user_groups(id),
    permission_level VARCHAR(20) NOT NULL CHECK (permission_level IN ('view', 'edit', 'delete', 'share')),
    granted_by INTEGER NOT NULL REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create analytics tables
CREATE TABLE analytics_usage (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    avg_session_duration INTEGER,
    total_data_items INTEGER DEFAULT 0,
    total_storage_used BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create system_config table
CREATE TABLE system_config (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    key VARCHAR(255) NOT NULL,
    value JSONB,
    description TEXT,
    data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'json', 'array')),
    default_value JSONB,
    is_editable BOOLEAN DEFAULT TRUE,
    requires_restart BOOLEAN DEFAULT FALSE,
    validation JSONB,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES users(id),
    environment VARCHAR(20) DEFAULT 'all' CHECK (environment IN ('development', 'staging', 'production', 'all'))
);

-- Create ui_preferences table
CREATE TABLE ui_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    category VARCHAR(50) NOT NULL,
    key VARCHAR(255) NOT NULL,
    value JSONB,
    data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'json', 'array')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category, key)
);

-- Create workflow_presets table
CREATE TABLE workflow_presets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    configuration JSONB NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    tags JSONB DEFAULT '[]',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create search_history table
CREATE TABLE search_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    query TEXT NOT NULL,
    filters JSONB DEFAULT '{}',
    result_count INTEGER,
    search_type VARCHAR(50) NOT NULL,
    search_duration INTEGER,
    is_successful BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_infrastructure_location ON infrastructure USING GIST (location);
CREATE INDEX idx_regions_boundary ON regions USING GIST (boundary);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_infrastructure_created_by ON infrastructure (created_by);
CREATE INDEX idx_data_permissions_resource ON data_permissions (resource_type, resource_id);

-- Insert default admin user
INSERT INTO users (email, password_hash, name, role, permissions, is_active)
VALUES ('admin@opticonnect.com', '$2b$10$hashedpassword', 'System Administrator', 'admin', '["*"]', true);

-- Insert default system configuration
INSERT INTO system_config (category, key, value, description, data_type, default_value, is_editable)
VALUES
('general', 'site_name', '"OptiConnect"', 'Site name', 'string', '"OptiConnect"', true),
('features', 'analytics_enabled', true, 'Enable analytics tracking', 'boolean', true, true),
('limits', 'max_upload_size', 10485760, 'Maximum file upload size in bytes', 'number', 10485760, true);
```

### Data Seeding Script
```sql
-- Insert sample regions
INSERT INTO regions (name, boundary) VALUES
('New York Metro', ST_GeomFromText('POLYGON((-74.1 40.7, -73.7 40.7, -73.7 40.8, -74.1 40.8, -74.1 40.7))', 4326)),
('Los Angeles Area', ST_GeomFromText('POLYGON((-118.5 33.9, -118.1 33.9, -118.1 34.1, -118.5 34.1, -118.5 33.9))', 4326));

-- Insert sample infrastructure
INSERT INTO infrastructure (name, type, status, location, signal_strength, coverage_radius, created_by) VALUES
('Manhattan Cell Tower 1', 'cell', 'active', ST_Point(-74.0060, 40.7128), 85, 2.5, 1),
('Brooklyn Fiber POP', 'pop', 'active', ST_Point(-73.9442, 40.6782), NULL, NULL, 1),
('Queens Radio Tower', 'radio', 'maintenance', ST_Point(-73.7949, 40.7282), 72, 1.8, 1);
```

## Testing Strategy

### Unit Testing
```typescript
// src/services/__tests__/dataCenter.test.ts
import { dataCenter } from '../dataCenter';

describe('DataCenter', () => {
  beforeEach(() => {
    localStorage.clear();
    dataCenter.setMode('development');
  });

  test('should create infrastructure in development mode', async () => {
    const testData = {
      name: 'Test Tower',
      type: 'cell',
      status: 'active',
      location: { lat: 40.7128, lng: -74.0060 }
    };

    const result = await dataCenter.createInfrastructure(testData);

    expect(result.name).toBe(testData.name);
    expect(result.id).toBeDefined();
    expect(result.created_by).toBe('dev-user');
  });

  test('should prevent operations in maintenance mode', async () => {
    dataCenter.setMode('maintenance');

    const testData = {
      name: 'Test Tower',
      type: 'cell',
      status: 'active',
      location: { lat: 40.7128, lng: -74.0060 }
    };

    await expect(dataCenter.createInfrastructure(testData))
      .rejects.toThrow('System is in maintenance mode');
  });
});
```

### Integration Testing
```typescript
// src/__tests__/infrastructureSlice.test.ts
import infrastructureReducer, { fetchInfrastructure } from '../store/slices/infrastructureSlice';

describe('Infrastructure Slice', () => {
  test('should handle fetchInfrastructure.pending', () => {
    const action = { type: fetchInfrastructure.pending.type };
    const state = infrastructureReducer({ items: [], loading: false, error: null }, action);

    expect(state.loading).toBe(true);
    expect(state.error).toBe(null);
  });

  test('should handle fetchInfrastructure.fulfilled', () => {
    const mockData = [{ id: '1', name: 'Test Tower' }];
    const action = { type: fetchInfrastructure.fulfilled.type, payload: mockData };
    const state = infrastructureReducer({ items: [], loading: true, error: null }, action);

    expect(state.loading).toBe(false);
    expect(state.items).toEqual(mockData);
  });
});
```

### API Testing with Postman
```json
{
  "info": {
    "name": "OptiConnect API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"admin@opticonnect.com\",\"password\":\"admin123\"}"
            },
            "url": {
              "raw": "{{base_url}}/auth/login",
              "host": ["{{base_url}}"],
              "path": ["auth", "login"]
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "",
                  "pm.test(\"Response has token\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('token');",
                  "});",
                  "",
                  "pm.test(\"Token is stored\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.environment.set('token', jsonData.token);",
                  "});"
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### End-to-End Testing
```typescript
// cypress/integration/backend-integration.spec.ts
describe('Backend Integration', () => {
  beforeEach(() => {
    cy.login('admin@opticonnect.com', 'admin123');
  });

  it('should create and display infrastructure', () => {
    cy.visit('/infrastructure');

    cy.get('[data-cy="add-infrastructure"]').click();
    cy.get('[data-cy="name-input"]').type('Test Tower');
    cy.get('[data-cy="type-select"]').select('cell');
    cy.get('[data-cy="submit-btn"]').click();

    cy.get('[data-cy="infrastructure-list"]').should('contain', 'Test Tower');
  });

  it('should handle API errors gracefully', () => {
    // Simulate API failure
    cy.intercept('GET', '/api/infrastructure', { statusCode: 500 });

    cy.visit('/infrastructure');

    cy.get('[data-cy="error-message"]').should('be.visible');
    cy.get('[data-cy="retry-btn"]').should('be.visible');
  });
});
```

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy OptiConnect

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:13-3.1
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/opticonnect_test

    - name: Build application
      run: npm run build

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - name: Deploy to production
      run: |
        echo "Deploy backend to production server"
        # Add your deployment commands here

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-args: '--prod'
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID}}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID}}
```

### Docker Configuration
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose for Development
```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgis/postgis:13-3.1
    environment:
      POSTGRES_DB: opticonnect
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/opticonnect
      JWT_SECRET: development-secret-key
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## Backup and Recovery

### Database Backup Strategy
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/opt/backups/opticonnect"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/opticonnect_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump -h localhost -U opticonnect -d opticonnect > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

### Automated Backup with Cron
```bash
# Add to crontab for daily backups at 2 AM
0 2 * * * /opt/opticonnect/scripts/backup.sh
```

### Recovery Procedure
```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# Stop application services
systemctl stop opticonnect-backend
systemctl stop opticonnect-frontend

# Restore database
gunzip -c $BACKUP_FILE | psql -h localhost -U opticonnect -d opticonnect

# Start services
systemctl start opticonnect-backend
systemctl start opticonnect-frontend

echo "Restore completed from $BACKUP_FILE"
```

### Point-in-Time Recovery
```sql
-- Enable WAL archiving
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'cp %p /opt/postgresql/archive/%f';

-- Create base backup
SELECT pg_start_backup('base_backup');
-- Copy data directory
SELECT pg_stop_backup();

-- For PITR, restore base backup and replay WAL files
-- up to desired timestamp
```

## Compliance and Regulations

### GDPR Compliance
- **Data Subject Rights**: Implement right to access, rectify, erase personal data
- **Data Processing**: Document all data processing activities
- **Consent Management**: Track user consent for data processing
- **Data Breach Notification**: Implement breach detection and notification
- **Data Protection Officer**: Designate DPO contact information

### Data Privacy Implementation
```typescript
// src/utils/privacy.ts
export class PrivacyManager {
  // Check if user has consented to data processing
  hasConsent(userId: string, purpose: string): boolean {
    const consents = localStorage.getItem(`consent_${userId}`);
    if (!consents) return false;

    const consentData = JSON.parse(consents);
    return consentData[purpose] === true;
  }

  // Record consent
  recordConsent(userId: string, purpose: string, consented: boolean): void {
    const key = `consent_${userId}`;
    const existing = localStorage.getItem(key);
    const consentData = existing ? JSON.parse(existing) : {};

    consentData[purpose] = consented;
    consentData[`${purpose}_timestamp`] = new Date().toISOString();

    localStorage.setItem(key, JSON.stringify(consentData));
  }

  // Anonymize personal data
  anonymizeData(data: any): any {
    const anonymized = { ...data };

    // Remove or hash personal identifiers
    if (anonymized.email) {
      anonymized.email = this.hashValue(anonymized.email);
    }
    if (anonymized.name) {
      anonymized.name = 'Anonymous';
    }

    return anonymized;
  }

  private hashValue(value: string): string {
    // Use crypto.subtle.digest for secure hashing
    return btoa(value).substring(0, 8) + '...';
  }
}
```

### Audit Trail Requirements
```sql
-- Enhanced audit logging for compliance
CREATE TABLE audit_compliance (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    action_taken VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    compliance_flags JSONB DEFAULT '{}'
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_compliance_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_compliance (
        event_type,
        user_id,
        resource_type,
        resource_id,
        action_taken,
        old_values,
        new_values
    ) VALUES (
        TG_OP,
        current_setting('app.current_user_id', true)::integer,
        TG_TABLE_NAME,
        COALESCE(NEW.id::text, OLD.id::text),
        CASE
            WHEN TG_OP = 'INSERT' THEN 'CREATE'
            WHEN TG_OP = 'UPDATE' THEN 'UPDATE'
            WHEN TG_OP = 'DELETE' THEN 'DELETE'
        END,
        CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to sensitive tables
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_compliance_trigger();

CREATE TRIGGER audit_infrastructure_trigger
    AFTER INSERT OR UPDATE OR DELETE ON infrastructure
    FOR EACH ROW EXECUTE FUNCTION audit_compliance_trigger();
```

## Cost Optimization

### Cloud Resource Optimization
- **Auto Scaling**: Configure auto-scaling based on traffic patterns
- **Reserved Instances**: Use reserved instances for predictable workloads
- **Spot Instances**: Leverage spot instances for non-critical workloads
- **CDN**: Implement CDN for global content delivery

### Database Cost Management
```sql
-- Monitor expensive queries
SELECT
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Identify unused indexes
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Storage Optimization
- **Data Archiving**: Move old data to cheaper storage tiers
- **Compression**: Enable compression for large datasets
- **Cleanup Scripts**: Remove temporary and unused files
- **Deduplication**: Implement data deduplication where possible

## Support and Maintenance

### Health Check Endpoints
```typescript
// backend/routes/health.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Basic health check
router.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        api: 'up'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'down',
        api: 'up'
      },
      error: error.message
    });
  }
});

// Detailed health check
router.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version,
    services: {}
  };

  try {
    // Database health
    const dbStart = Date.now();
    await pool.query('SELECT COUNT(*) FROM users');
    health.services.database = {
      status: 'up',
      response_time: Date.now() - dbStart
    };
  } catch (error) {
    health.services.database = {
      status: 'down',
      error: error.message
    };
    health.status = 'degraded';
  }

  // External services health
  // Add checks for Redis, external APIs, etc.

  res.json(health);
});

module.exports = router;
```

### Maintenance Procedures

#### Weekly Maintenance
- [ ] Review application logs for errors
- [ ] Check database performance metrics
- [ ] Verify backup integrity
- [ ] Update dependencies (security patches)
- [ ] Monitor disk space usage

#### Monthly Maintenance
- [ ] Full database backup verification
- [ ] Security vulnerability assessment
- [ ] Performance optimization review
- [ ] User feedback analysis
- [ ] Feature usage analytics review

#### Quarterly Maintenance
- [ ] Major version updates planning
- [ ] Infrastructure capacity planning
- [ ] Compliance audit preparation
- [ ] Disaster recovery testing
- [ ] Documentation updates

### Incident Response Plan
1. **Detection**: Monitor alerts and user reports
2. **Assessment**: Evaluate impact and severity
3. **Communication**: Notify stakeholders and users
4. **Containment**: Isolate affected systems
5. **Recovery**: Restore services from backups
6. **Analysis**: Conduct post-mortem analysis
7. **Prevention**: Implement fixes and improvements

### Support Ticketing System
```typescript
// src/components/support/SupportTicketForm.tsx
import React, { useState } from 'react';

const SupportTicketForm: React.FC = () => {
  const [formData, setFormData] = useState({
    subject: '',
    category: 'technical',
    priority: 'medium',
    description: '',
    attachments: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Support ticket created successfully');
        // Reset form
        setFormData({
          subject: '',
          category: 'technical',
          priority: 'medium',
          description: '',
          attachments: []
        });
      }
    } catch (error) {
      console.error('Error creating support ticket:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Subject:</label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData({...formData, subject: e.target.value})}
          required
        />
      </div>

      <div>
        <label>Category:</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
        >
          <option value="technical">Technical Issue</option>
          <option value="feature">Feature Request</option>
          <option value="billing">Billing</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label>Priority:</label>
        <select
          value={formData.priority}
          onChange={(e) => setFormData({...formData, priority: e.target.value})}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <div>
        <label>Description:</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={5}
          required
        />
      </div>

      <button type="submit">Submit Ticket</button>
    </form>
  );
};

export default SupportTicketForm;
```

## Implementation Roadmap

Based on a comprehensive analysis of all project files, here's a robust, phased plan to implement the backend integration and enhance both frontend and backend capabilities.

### Current Project State Analysis

**Frontend Status:**
- ✅ Complete React/TypeScript architecture with Redux Toolkit
- ✅ Authentication system (frontend-only, localStorage/JWT)
- ✅ Advanced Google Maps integration with tools and controls
- ✅ Admin panels, data management, analytics components
- ✅ Geofencing systems (partially integrated, needs completion per TODO.md)
- ❌ No API services implemented (src/services/ is empty)
- ❌ Redux slices use mock data, not API calls
- ❌ No environment mode switching (development/production/maintenance)
- ❌ Missing UI preferences, workflow presets, search history features

**Backend Status:**
- ❌ No backend code exists (only documentation)
- ❌ No database setup or schemas implemented
- ❌ No API endpoints implemented
- ❌ No authentication/authorization backend

**Key Gaps Identified:**
- src/services/ directory empty (needs dataCenter.ts, apiService.ts)
- No infrastructureSlice.ts in store/slices/
- Components reference non-existent services
- No backend/ directory or server code
- Geofencing integration incomplete (per TODO.md)
- No testing infrastructure for API integration
- Missing offline support and error boundaries integration

### Phase 1: Foundation Setup (1-2 weeks)

#### 1.1 Backend Infrastructure Setup
**Dependencies:** Node.js, PostgreSQL/PostGIS
**Tasks:**
- Create `backend/` directory with standard structure
- Initialize Node.js project with package.json
- Install core dependencies: express, pg, bcryptjs, jsonwebtoken, cors, helmet, express-rate-limit, express-validator
- Set up development environment with nodemon
- Create .env files for development/production
- Implement basic server.js with health check endpoint

**Verification:**
- `npm start` runs server on port 3001
- Health check endpoint returns 200 OK
- Environment variables loaded correctly

#### 1.2 Database Setup
**Dependencies:** PostgreSQL 13+, PostGIS extension
**Tasks:**
- Install PostgreSQL locally or via Docker
- Create opticonnect database
- Enable PostGIS extension
- Run complete schema creation from "Database Migration Scripts" section
- Create database indexes for performance
- Seed with sample data (users, infrastructure, regions)

**Verification:**
- Connect to database via psql or pgAdmin
- Verify all tables created with correct columns
- Run sample queries to confirm PostGIS functionality
- Check indexes created

#### 1.3 Basic Authentication Backend
**Dependencies:** Database setup
**Tasks:**
- Implement user model with database queries
- Create auth routes: /login, /register, /profile
- Add JWT token generation/validation
- Implement bcrypt password hashing
- Add basic middleware for authentication

**Verification:**
- Register new user via API
- Login and receive JWT token
- Access protected /profile endpoint with token
- Invalid tokens return 401

### Phase 2: Core API Development (2-3 weeks)

#### 2.1 User Management API
**Dependencies:** Authentication backend
**Tasks:**
- Implement full CRUD for users (/api/users)
- Add role-based access control middleware
- Implement user groups and permissions
- Add user profile updates
- Create audit logging for user actions

**Verification:**
- Admin can list/create/update/delete users
- Non-admin users cannot access user management
- User profile updates work correctly
- Audit logs record user actions

#### 2.2 Infrastructure API
**Dependencies:** User management
**Tasks:**
- Implement infrastructure CRUD (/api/infrastructure)
- Add PostGIS spatial queries for location data
- Implement data permissions for sharing
- Add equipment and custom attributes support
- Create spatial indexing and geofencing queries

**Verification:**
- Create/update/delete infrastructure items
- Spatial queries work (points within regions)
- Permission system prevents unauthorized access
- Custom attributes and equipment stored correctly

#### 2.3 Regions and Geofencing API
**Dependencies:** Infrastructure API
**Tasks:**
- Implement regions CRUD with PostGIS polygons
- Add geofencing validation endpoints
- Create user-region assignment system
- Implement spatial queries for region boundaries

**Verification:**
- Create regions with polygon boundaries
- Assign users to regions
- Validate points within assigned regions
- Region-based filtering works

### Phase 3: Frontend Integration (2-3 weeks)

#### 3.1 API Services Implementation
**Dependencies:** Backend API endpoints
**Tasks:**
- Create `src/services/apiService.ts` with Axios configuration
- Implement JWT token interceptors
- Add error handling and retry logic
- Create `src/services/dataCenter.ts` for environment switching

**Verification:**
- API service makes successful calls to backend
- JWT tokens automatically included in requests
- Failed requests trigger appropriate error handling

#### 3.2 Redux Store Updates
**Dependencies:** API services
**Tasks:**
- Create `src/store/slices/infrastructureSlice.ts` with async thunks
- Update existing slices to use Data Center instead of mock data
- Add loading states and error handling
- Implement optimistic updates where appropriate

**Verification:**
- Redux dev tools show API calls in action
- Loading states display during API requests
- Errors properly handled and displayed to user

#### 3.3 Component Integration
**Dependencies:** Updated Redux slices
**Tasks:**
- Update `src/components/data/EnhancedDataManager.tsx` to use Data Center
- Integrate Data Center in `src/components/admin/InfrastructureDataManagement.tsx`
- Update map components for geofencing validation
- Add environment mode switcher component

**Verification:**
- Components fetch data from API instead of localStorage
- Environment switching works (dev/prod/maintenance)
- Geofencing prevents actions outside assigned regions

### Phase 4: Advanced Features (2-3 weeks)

#### 4.1 Analytics and Reporting
**Dependencies:** Core APIs
**Tasks:**
- Implement analytics data collection
- Create reporting endpoints
- Add dashboard data aggregation
- Implement usage tracking

**Verification:**
- Analytics data collected on user actions
- Reports generated with correct metrics
- Dashboard displays real-time data

#### 4.2 File Upload and Import
**Dependencies:** Infrastructure API
**Tasks:**
- Add file upload endpoints for KML/CSV
- Implement data import processing
- Add bulk operations support
- Create import validation and error reporting

**Verification:**
- KML files uploaded and parsed correctly
- CSV data imported with validation
- Bulk operations complete successfully
- Errors reported for invalid data

#### 4.3 Real-time Features
**Dependencies:** Core APIs
**Tasks:**
- Implement WebSocket server for real-time updates
- Add live infrastructure status updates
- Create notification system
- Add collaborative editing support

**Verification:**
- Real-time updates appear without page refresh
- Multiple users see changes simultaneously
- Notifications sent for important events

### Phase 5: Security and Performance (1-2 weeks)

#### 5.1 Security Hardening
**Dependencies:** All APIs
**Tasks:**
- Implement rate limiting and DDoS protection
- Add comprehensive input validation
- Implement CSRF protection
- Add security headers and CORS configuration
- Conduct security audit

**Verification:**
- OWASP security tests pass
- Rate limiting prevents abuse
- Input validation blocks malicious data
- Security headers properly configured

#### 5.2 Performance Optimization
**Dependencies:** All features
**Tasks:**
- Implement database query optimization
- Add Redis caching layer
- Optimize API response times
- Implement pagination for large datasets
- Add compression and CDN support

**Verification:**
- API response times < 200ms
- Large datasets load efficiently
- Caching reduces database load
- Compression reduces payload sizes

### Phase 6: Testing and Deployment (1-2 weeks)

#### 6.1 Testing Implementation
**Dependencies:** All features
**Tasks:**
- Write unit tests for backend routes and models
- Create integration tests for API endpoints
- Implement E2E tests with Cypress
- Add frontend component tests
- Set up test database and fixtures

**Verification:**
- Test coverage > 80%
- All critical paths tested
- CI/CD pipeline runs tests automatically
- Manual testing confirms functionality

#### 6.2 Deployment Setup
**Dependencies:** Testing complete
**Tasks:**
- Create Docker Compose for development
- Set up production Docker configuration
- Implement CI/CD with GitHub Actions
- Configure monitoring and logging
- Set up backup and recovery procedures

**Verification:**
- Local development environment works with Docker
- Production build deploys successfully
- Monitoring alerts configured
- Backup/restore procedures tested

### Phase 7: Enhancements and Polish (1-2 weeks)

#### 7.1 UI/UX Improvements
**Dependencies:** Core functionality
**Tasks:**
- Implement UI preferences system
- Add workflow presets feature
- Create search history functionality
- Enhance mobile responsiveness
- Add accessibility improvements

**Verification:**
- UI preferences persist and apply
- Workflow presets save/load correctly
- Search history improves UX
- Mobile devices work seamlessly

#### 7.2 Documentation and Training
**Dependencies:** All phases
**Tasks:**
- Update all documentation with implementation details
- Create API documentation with Swagger/OpenAPI
- Write deployment and maintenance guides
- Create user training materials

**Verification:**
- Documentation accurate and complete
- API docs auto-generated and accessible
- New developers can onboard quickly

### Risk Mitigation and Contingency

**Technical Risks:**
- PostGIS complexity: Allocate extra time for spatial queries
- JWT token management: Implement refresh token rotation
- Real-time performance: Monitor WebSocket connection limits

**Timeline Risks:**
- Scope creep: Stick to MVP features first
- Third-party dependencies: Use stable, well-maintained packages
- Testing delays: Integrate testing early in each phase

**Resource Requirements:**
- Backend Developer: Node.js/Express/PostgreSQL experience
- Frontend Developer: React/Redux/TypeScript experience
- DevOps Engineer: Docker/Kubernetes/AWS experience
- QA Engineer: Testing automation experience

**Success Metrics:**
- All API endpoints functional and tested
- Frontend fully integrated with backend
- Performance benchmarks met
- Security audit passed
- User acceptance testing successful

### Next Steps

1. **Immediate Actions:**
   - Set up backend development environment
   - Begin Phase 1 implementation
   - Update TODO.md with backend tasks

2. **Weekly Checkpoints:**
   - End-of-week demos of completed features
   - Code reviews for security and best practices
   - Update documentation with implementation notes

3. **Milestone Reviews:**
   - Phase completion reviews
   - Integration testing at phase boundaries
   - Stakeholder feedback sessions

This roadmap provides a comprehensive, actionable plan for complete backend integration while enhancing frontend capabilities. Each phase builds on the previous one with clear verification steps to ensure quality and functionality.

This comprehensive guide provides everything needed to implement a robust backend integration with environment management, security, performance optimization, compliance, and future scalability considerations.
