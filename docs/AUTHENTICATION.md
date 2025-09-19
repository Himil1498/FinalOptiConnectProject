# Opti Connect Authentication System

## Overview

The Opti Connect platform features a comprehensive authentication system built with React, Redux Toolkit, and TypeScript. It provides secure user authentication, role-based access control, and session management.

## Features

### 🔐 Authentication
- **JWT Token Management**: Secure token storage and automatic refresh
- **Session Management**: Auto-logout on expiry with session warnings
- **Password Security**: Client-side validation and secure handling
- **Remember Me**: Extended session duration option

### 👥 Role-Based Access Control (RBAC)
- **Admin**: Full system access and user management
- **Manager**: User management, analytics, and equipment oversight
- **Technician**: Equipment management and status updates
- **Viewer**: Read-only access to maps and basic analytics

### 🎨 User Interface
- **Modern Login Form**: Responsive design with gradient background
- **Real-time Validation**: Instant feedback on form inputs
- **Password Visibility Toggle**: Enhanced user experience
- **Error Handling**: Clear error messages and states

## Architecture

### Components Structure
```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx          # Main login interface
│   │   └── ProtectedRoute.tsx     # Route protection wrapper
│   └── layout/
│       └── DashboardLayout.tsx    # Main app layout with logout
├── hooks/
│   └── useAuth.ts                 # Authentication hook
├── services/
│   ├── api.ts                     # API client with interceptors
│   └── authService.ts             # Authentication service
├── store/
│   └── slices/
│       └── authSlice.ts           # Redux authentication state
└── types/
    └── index.ts                   # TypeScript definitions
```

## Quick Start

### Demo Accounts
Use these credentials to test different user roles:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin | admin@opticonnect.com | password123 | Full access |
| Manager | manager@opticonnect.com | password123 | Management + Analytics |
| Technician | tech@opticonnect.com | password123 | Equipment Management |
| Viewer | viewer@opticonnect.com | password123 | Read-only |

### Basic Usage

```tsx
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, logout, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      {hasPermission('manage_users') && (
        <UserManagement />
      )}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## API Reference

### useAuth Hook

```tsx
const {
  // State
  isAuthenticated,    // boolean: User login status
  user,              // User | null: Current user data
  token,             // string | null: JWT token
  loading,           // boolean: Auth operation in progress
  error,             // AuthError | null: Authentication errors
  sessionExpiry,     // number | null: Session expiration timestamp

  // Actions
  login,             // (email, password, rememberMe?) => Promise<boolean>
  logout,            // () => Promise<void>
  refreshToken,      // () => Promise<boolean>
  clearError,        // () => void

  // Utilities
  hasPermission,     // (permission: string) => boolean
  hasRole,           // (role: string) => boolean
  isSessionExpiring, // () => boolean
  getTimeUntilExpiry // () => number | null
} = useAuth();
```

### Protected Routes

```tsx
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Basic protection
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Role-based protection
<ProtectedRoute requiredRole="admin">
  <AdminPanel />
</ProtectedRoute>

// Permission-based protection
<ProtectedRoute requiredPermissions={['manage_users', 'view_analytics']}>
  <UserAnalytics />
</ProtectedRoute>
```

## User Roles & Permissions

### Role Hierarchy
```
Admin > Manager > Technician > Viewer
```

### Permission Matrix

| Permission | Admin | Manager | Technician | Viewer |
|------------|-------|---------|------------|--------|
| all | ✅ | ❌ | ❌ | ❌ |
| read | ✅ | ✅ | ✅ | ✅ |
| write | ✅ | ✅ | ✅ | ❌ |
| manage_users | ✅ | ✅ | ❌ | ❌ |
| view_analytics | ✅ | ✅ | ❌ | ✅ |
| manage_equipment | ✅ | ✅ | ✅ | ❌ |
| update_status | ✅ | ✅ | ✅ | ❌ |
| view_basic_analytics | ✅ | ✅ | ❌ | ✅ |

## Security Features

### Token Management
- **Automatic Refresh**: Tokens refresh 5 minutes before expiry
- **Secure Storage**: localStorage with automatic cleanup
- **Expiry Handling**: Graceful session termination

### Input Validation
- **Email Validation**: RFC-compliant email verification
- **Password Requirements**: Minimum length and complexity
- **Real-time Feedback**: Instant validation on user input

### Session Security
- **Session Monitoring**: Continuous session status checking
- **Expiry Warnings**: 10-minute advance warning
- **Auto-logout**: Automatic cleanup on token expiry

## Customization

### Adding New Roles
1. Update the `User` type in `src/types/index.ts`:
```tsx
role: 'admin' | 'manager' | 'technician' | 'viewer' | 'newrole';
```

2. Add permissions to `ROLE_PERMISSIONS`:
```tsx
export const ROLE_PERMISSIONS: Record<User['role'], string[]> = {
  // ... existing roles
  newrole: ['read', 'custom_permission']
};
```

3. Update mock users in `authSlice.ts`

### Custom Permissions
Add new permissions to the role permissions mapping:
```tsx
manager: ['read', 'write', 'manage_users', 'new_permission']
```

## Error Handling

### Common Error Types
- `USER_NOT_FOUND`: Invalid email address
- `INVALID_PASSWORD`: Incorrect password
- `ACCOUNT_DISABLED`: User account deactivated
- `TOKEN_EXPIRED`: Session expired
- `NETWORK_ERROR`: Connection issues

### Error Display
Errors are automatically displayed in the UI with appropriate styling and context.

## Testing

### Unit Testing
```bash
npm test -- --testPathPattern=auth
```

### E2E Testing
Use the demo accounts to test different user flows and permissions.

## Production Deployment

### Environment Variables
```env
REACT_APP_API_URL=https://api.opticonnect.com
REACT_APP_TOKEN_REFRESH_INTERVAL=300000
```

### Security Checklist
- [ ] Replace mock authentication with real API
- [ ] Configure HTTPS for all authentication endpoints
- [ ] Set up secure session storage
- [ ] Implement rate limiting for login attempts
- [ ] Configure CORS properly
- [ ] Set up monitoring for failed authentication attempts

## Troubleshooting

### Common Issues

**Login fails with network error**
- Check API endpoint configuration
- Verify CORS settings
- Check network connectivity

**Session expires immediately**
- Verify token format and signing
- Check server time synchronization
- Validate JWT secret configuration

**Permission denied errors**
- Verify user role assignment
- Check permission mappings
- Validate route protection setup

## Contributing

When adding new authentication features:
1. Update TypeScript types first
2. Add comprehensive error handling
3. Include unit tests
4. Update this documentation
5. Test with all user roles

## Support

For authentication-related issues:
- Check browser console for errors
- Verify network requests in DevTools
- Test with different user roles
- Review Redux state in DevTools