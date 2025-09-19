# 🛠 Development Guide - Telecom GIS Platform

## 🚀 Quick Start for Developers

### ⚡ Immediate Setup (5 minutes)

```bash
# Clone and setup
git clone <repository-url>
cd telecom-gis-platform
npm install
npm start

# Access at http://localhost:3000
# Login: admin@opticonnect.com / password
```

### 🎯 Key Commands

```bash
# Development
npm start              # Start dev server
npm run build         # Production build
npm test              # Run tests
npm run typecheck     # TypeScript validation

# Debug
npm run analyze       # Bundle analysis
npm run lint          # Code linting (if configured)
```

---

## 🏗 Component Development Patterns

### 🧩 Creating New Components

#### 1. Basic Component Template
```typescript
// src/components/example/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
  variant?: 'primary' | 'secondary';
  children?: React.ReactNode;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  variant = 'primary',
  children
}) => {
  return (
    <div className={`
      p-4 rounded-lg transition-all duration-200
      ${variant === 'primary'
        ? 'bg-blue-500 text-white'
        : 'bg-gray-200 text-gray-900'
      }
      dark:bg-gray-800 dark:text-gray-100
    `}>
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      {children}
    </div>
  );
};
```

#### 2. Hook-Based Component with State
```typescript
// src/components/interactive/InteractiveComponent.tsx
import React, { useState, useCallback } from 'react';
import { useTheme } from '../../hooks/useTheme';

interface InteractiveComponentProps {
  onAction: (data: any) => void;
}

export const InteractiveComponent: React.FC<InteractiveComponentProps> = ({
  onAction
}) => {
  const [isActive, setIsActive] = useState(false);
  const { addNotification } = useTheme();

  const handleToggle = useCallback(() => {
    setIsActive(prev => !prev);
    addNotification({
      type: 'success',
      title: 'Status Changed',
      message: `Component is now ${!isActive ? 'active' : 'inactive'}`
    });
    onAction({ active: !isActive });
  }, [isActive, onAction, addNotification]);

  return (
    <button
      onClick={handleToggle}
      className={`
        px-4 py-2 rounded-lg transition-all duration-200
        ${isActive
          ? 'bg-green-500 text-white shadow-lg scale-105'
          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
        }
        dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600
      `}
      aria-pressed={isActive}
    >
      {isActive ? 'Active' : 'Inactive'}
    </button>
  );
};
```

### 🎨 Dark Mode Implementation

#### Required Pattern for All Components
```typescript
// Always include dark mode variants
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  <input className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
  <button className="bg-blue-500 hover:bg-blue-600 text-white">Click</button>
</div>
```

#### Color Palette Reference
```css
/* Light Mode */
bg-white text-gray-900
bg-gray-50 text-gray-800
border-gray-200 border-gray-300

/* Dark Mode */
dark:bg-gray-900 dark:text-gray-100
dark:bg-gray-800 dark:text-gray-200
dark:border-gray-700 dark:border-gray-600
```

---

## 🔧 Advanced Development

### 🗂 Adding New Pages

#### 1. Create Page Component
```typescript
// src/pages/MyNewPage.tsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';

export const MyNewPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          My New Page
        </h1>
        {/* Page content */}
      </div>
    </div>
  );
};
```

#### 2. Add Route to AppRouter
```typescript
// src/AppRouter.tsx
import { MyNewPage } from './pages/MyNewPage';

// Add route in Routes component
<Route
  path="/my-new-page"
  element={
    isAuthenticated ? <MyNewPage /> : <Navigate to="/login" replace />
  }
/>
```

#### 3. Add Navigation Link
```typescript
// src/pages/Dashboard.tsx or relevant component
<Link
  to="/my-new-page"
  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
>
  <NewPageIcon className="h-4 w-4 mr-2" />
  My New Page
</Link>
```

### 🎯 Custom Hooks Development

#### Example: Map Tool Hook
```typescript
// src/hooks/useMapTool.ts
import { useState, useCallback } from 'react';

type ToolType = 'distance' | 'polygon' | 'elevation';

interface ToolState {
  activeTool: ToolType | null;
  isProcessing: boolean;
}

export const useMapTool = () => {
  const [toolState, setToolState] = useState<ToolState>({
    activeTool: null,
    isProcessing: false
  });

  const activateTool = useCallback((tool: ToolType) => {
    setToolState(prev => ({
      ...prev,
      activeTool: prev.activeTool === tool ? null : tool
    }));
  }, []);

  const setProcessing = useCallback((processing: boolean) => {
    setToolState(prev => ({ ...prev, isProcessing: processing }));
  }, []);

  const resetTools = useCallback(() => {
    setToolState({ activeTool: null, isProcessing: false });
  }, []);

  return {
    activeTool: toolState.activeTool,
    isProcessing: toolState.isProcessing,
    activateTool,
    setProcessing,
    resetTools
  };
};
```

### 🔄 State Management with Redux

#### Adding New Slice
```typescript
// src/store/slices/myFeatureSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MyFeatureState {
  data: any[];
  loading: boolean;
  error: string | null;
}

const initialState: MyFeatureState = {
  data: [],
  loading: false,
  error: null
};

export const myFeatureSlice = createSlice({
  name: 'myFeature',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setData: (state, action: PayloadAction<any[]>) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

export const { setLoading, setData, setError } = myFeatureSlice.actions;
export default myFeatureSlice.reducer;
```

---

## 🧪 Testing Guidelines

### 🔬 Component Testing

#### Basic Component Test
```typescript
// src/components/__tests__/MyComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders title correctly', () => {
    render(<MyComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const mockOnClick = jest.fn();
    render(<MyComponent title="Test" onClick={mockOnClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('applies correct CSS classes', () => {
    render(<MyComponent title="Test" variant="primary" />);
    const component = screen.getByTestId('my-component');
    expect(component).toHaveClass('bg-blue-500');
  });
});
```

#### Hook Testing
```typescript
// src/hooks/__tests__/useMapTool.test.ts
import { renderHook, act } from '@testing-library/react';
import { useMapTool } from '../useMapTool';

describe('useMapTool', () => {
  it('should activate tool correctly', () => {
    const { result } = renderHook(() => useMapTool());

    act(() => {
      result.current.activateTool('distance');
    });

    expect(result.current.activeTool).toBe('distance');
  });

  it('should toggle tool when activated twice', () => {
    const { result } = renderHook(() => useMapTool());

    act(() => {
      result.current.activateTool('distance');
    });

    act(() => {
      result.current.activateTool('distance');
    });

    expect(result.current.activeTool).toBe(null);
  });
});
```

### 🎭 Integration Testing

```typescript
// src/__tests__/integration/AuthFlow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../../store';
import { AppRouter } from '../../AppRouter';

describe('Authentication Flow', () => {
  it('should navigate to dashboard after login', async () => {
    render(
      <Provider store={store}>
        <AppRouter />
      </Provider>
    );

    // Fill login form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@opticonnect.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for navigation
    await waitFor(() => {
      expect(screen.getByText(/opti connect dashboard/i)).toBeInTheDocument();
    });
  });
});
```

---

## 🚀 Performance Optimization

### 📦 Code Splitting

```typescript
// Lazy load heavy components
import { lazy, Suspense } from 'react';

const AdminPage = lazy(() =>
  import('./pages/AdminPage').then(module => ({ default: module.AdminPage }))
);

// Use with Suspense
<Suspense fallback={<div>Loading...</div>}>
  <AdminPage />
</Suspense>
```

### 🧠 Memoization

```typescript
// Expensive computations
const expensiveValue = useMemo(() => {
  return complexCalculation(largeDataSet);
}, [largeDataSet]);

// Callback optimization
const optimizedCallback = useCallback((id: string) => {
  handleItemClick(id);
}, [handleItemClick]);

// Component memoization
const MemoizedComponent = React.memo(MyComponent, (prevProps, nextProps) => {
  return prevProps.data === nextProps.data;
});
```

### 📊 Bundle Analysis

```bash
# Analyze bundle size
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

---

## 🔍 Debugging Techniques

### 🛠 React DevTools

```typescript
// Add debugging helpers
const DebugComponent = () => {
  const [count, setCount] = useState(0);

  // Debug effect
  useEffect(() => {
    console.log('Component mounted/updated:', { count });
  }, [count]);

  // Performance markers
  performance.mark('render-start');
  // Component rendering logic
  performance.mark('render-end');
  performance.measure('render-time', 'render-start', 'render-end');

  return <div>Count: {count}</div>;
};
```

### 🕵️ State Debugging

```typescript
// Redux DevTools integration
const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production'
});

// Custom middleware for debugging
const loggerMiddleware: Middleware = (store) => (next) => (action) => {
  console.group(`Action: ${action.type}`);
  console.log('Previous state:', store.getState());
  console.log('Action:', action);
  const result = next(action);
  console.log('Next state:', store.getState());
  console.groupEnd();
  return result;
};
```

---

## 📦 Deployment Guide

### 🏗 Build Process

```bash
# Production build
npm run build

# Test build locally
npx serve -s build -p 5000

# Environment-specific builds
REACT_APP_ENV=staging npm run build
REACT_APP_ENV=production npm run build
```

### 🌐 Environment Configuration

```bash
# .env.local (development)
REACT_APP_API_BASE_URL=http://localhost:3001
REACT_APP_MAP_API_KEY=dev_api_key
REACT_APP_DEBUG=true

# .env.production
REACT_APP_API_BASE_URL=https://api.production.com
REACT_APP_MAP_API_KEY=prod_api_key
REACT_APP_DEBUG=false
```

### ☁️ Deployment Checklist

- [ ] Run `npm run build` successfully
- [ ] Test build with `npx serve -s build`
- [ ] Verify environment variables
- [ ] Check browser console for errors
- [ ] Test authentication flow
- [ ] Verify dark/light mode switching
- [ ] Test mobile responsiveness
- [ ] Validate accessibility features
- [ ] Performance audit (Lighthouse)

---

## 🔧 Maintenance Tasks

### 📅 Weekly Tasks

```bash
# Dependency updates
npm outdated
npm update

# Security audit
npm audit
npm audit fix

# Code quality checks
npm run lint
npm run typecheck
npm test
```

### 🔄 Monthly Tasks

- Review and update documentation
- Performance monitoring and optimization
- Bundle size analysis
- Security vulnerability assessment
- User feedback review and feature planning

### 📊 Monitoring

```typescript
// Performance monitoring
const trackUserAction = (action: string, metadata?: any) => {
  // Analytics tracking
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      custom_parameter: metadata,
      timestamp: Date.now()
    });
  }
};

// Error boundary for crash reporting
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report to error tracking service
    console.error('Application error:', error, errorInfo);
  }
}
```

---

## 🎯 Next Steps for New Developers

### 🚀 First Week Goals

1. **Setup Environment**: Get local development running
2. **Explore Codebase**: Understand component hierarchy
3. **Make Small Change**: Update a component style or text
4. **Run Tests**: Understand testing patterns
5. **Read Documentation**: Familiarize with architecture

### 📚 Learning Resources

- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### 🤝 Getting Help

1. **Code Comments**: Check inline documentation
2. **GitHub Issues**: Search existing issues
3. **Type Definitions**: Check `src/types/index.ts`
4. **Component Examples**: Look at similar components
5. **Ask Questions**: Create detailed GitHub issues

---

**Happy Coding! 🚀**

> Remember: Always test your changes, maintain TypeScript types, and implement dark mode support for new components.