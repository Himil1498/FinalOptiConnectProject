# Opti Connect

A comprehensive network infrastructure optimization platform designed for telecom companies to manage their infrastructure, track network assets, and optimize connectivity using advanced GIS tools and modern web technologies.

## 🚀 Features

### 🗺️ Enhanced Google Maps Integration
- **Interactive Map Interface**: Advanced Google Maps JavaScript API integration with TypeScript
- **Live Coordinate Display**: Real-time coordinates on mouse hover with decimal/DMS formats
- **Map Controls**: Custom zoom, pan, reset view, my location, and fit bounds controls
- **Map Type Switcher**: Roadmap, Satellite, Hybrid, Terrain with custom styling options
- **Region Restrictions**: Predefined regions (India, cities) with optional boundary enforcement
- **Multiple Themes**: Default, Dark mode, and Retro map styling

### 🔐 Complete Authentication System
- **JWT Token Management**: Secure authentication with automatic token refresh
- **Role-Based Access Control**: Admin, Manager, Technician, Viewer roles with granular permissions
- **Session Management**: Auto-logout on expiry with session warnings and extension
- **Modern Login UI**: Beautiful, responsive login form with real-time validation
- **Protected Routes**: Route guards with role-based restrictions and unauthorized access handling

### 🎮 Advanced Map Features
- **Drawing Tools**: Ready for polygon, polyline, circle, and marker drawing
- **Measurement Tools**: Distance and area measurement capabilities (prepared)
- **Custom Overlays**: Support for network coverage areas and infrastructure visualization
- **Performance Optimized**: Debounced updates and memoized event handlers
- **Mobile Responsive**: Touch-friendly controls and responsive design

### 🏗️ Modern Architecture
- **TypeScript**: Full type safety throughout the application
- **Redux Toolkit**: Efficient state management with proper error handling
- **Component Library**: Modular, reusable components with clean interfaces
- **Error Boundaries**: Comprehensive error handling and fallback states

## 🛠 Technology Stack

- **Frontend**: React 19 + TypeScript
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS v3
- **Mapping**: Google Maps API + React Wrapper
- **Routing**: React Router v7
- **Icons**: Heroicons v2
- **HTTP Client**: Axios
- **Authentication**: JWT + jwt-decode

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components
│   ├── map/            # Map-related components
│   ├── ui/             # Generic UI components
│   └── users/          # User management components
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API services and utilities
├── store/              # Redux store and slices
│   └── slices/         # Redux slices
├── styles/             # Global styles and CSS
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── assets/             # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd telecom-gis-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` file with your configuration:
   ```env
   REACT_APP_API_URL=http://localhost:3001/api
   REACT_APP_DEFAULT_MAP_CENTER_LAT=20.5937
   REACT_APP_DEFAULT_MAP_CENTER_LNG=78.9629
   REACT_APP_DEFAULT_MAP_ZOOM=5
   REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🧪 Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## 🔧 Configuration

### Map Settings
Configure default map settings in your environment variables:
- `REACT_APP_DEFAULT_MAP_CENTER_LAT` - Default latitude
- `REACT_APP_DEFAULT_MAP_CENTER_LNG` - Default longitude
- `REACT_APP_DEFAULT_MAP_ZOOM` - Default zoom level

### API Configuration
Set your backend API URL:
- `REACT_APP_API_URL` - Backend API base URL

### Feature Flags
Enable/disable features:
- `REACT_APP_ENABLE_ANALYTICS` - Enable analytics dashboard
- `REACT_APP_ENABLE_NOTIFICATIONS` - Enable notifications
- `REACT_APP_ENABLE_REAL_TIME_UPDATES` - Enable real-time updates

## 🏗 Architecture Overview

### Authentication Flow
1. Users log in through the authentication system
2. JWT tokens are stored in localStorage and Redux store
3. API requests automatically include the Bearer token
4. Expired tokens trigger automatic logout

### State Management
- **Auth Slice**: User authentication and session management
- **Map Slice**: Map state, towers, layers, and interactions
- **User Slice**: User management and CRUD operations

### Routing
- Protected routes require authentication
- Role-based route protection
- Automatic redirect to login for unauthorized access

## 🗺 Map Features

### Tower Management
- View telecom towers on the interactive map
- Filter by tower type (Cell, Fiber, Radio, Satellite)
- Monitor tower status (Active, Inactive, Maintenance, Critical)
- Coverage area visualization

### Layer Control
- Toggle different map layers
- Adjust layer opacity
- Switch between base maps (OpenStreetMap, Satellite)

### Drawing Tools
- Draw shapes and annotations on the map
- Measurement tools for distance and area calculations
- Custom map controls for enhanced UX

## 👥 User Roles & Permissions

- **Admin**: Full system access, user management
- **Manager**: Department-level access, reporting
- **Technician**: Field operations, equipment management
- **Viewer**: Read-only access to maps and data

## 🚀 Deployment

### Development
```bash
npm start
```
Access at `http://localhost:3000`

### Production Build
```bash
npm run build
```
Serves optimized static files from the `build/` directory

### Environment Variables for Production
Ensure all required environment variables are set:
- API endpoints
- Map configuration
- Feature flags
- External service keys (if applicable)

## 📋 API Integration

The app expects a backend API with the following endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get users list
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Towers/Infrastructure
- `GET /api/towers` - Get towers data
- `POST /api/towers` - Add new tower
- `PUT /api/towers/:id` - Update tower
- `DELETE /api/towers/:id` - Remove tower

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation for troubleshooting guides

## 📚 Documentation

- **[Authentication System](./docs/AUTHENTICATION.md)** - Complete guide to the authentication system, roles, and permissions
- **[Google Maps Integration](./docs/GOOGLE_MAPS_INTEGRATION.md)** - Comprehensive documentation for the enhanced Google Maps features

## 🔑 Demo Accounts

Access the application with these test accounts:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | admin@opticonnect.com | password123 | Full system access |
| **Manager** | manager@opticonnect.com | password123 | Management + Analytics |
| **Technician** | tech@opticonnect.com | password123 | Equipment Management |
| **Viewer** | viewer@opticonnect.com | password123 | Read-only access |

---

**✅ Enhanced Platform Complete**: Opti Connect now features a complete authentication system with JWT handling, role-based access control, and advanced Google Maps integration with live coordinate display, region restrictions, and drawing tools preparation. The platform is ready for network infrastructure optimization and management.
