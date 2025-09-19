import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setLoading, loginSuccess, logout, clearLoading } from '../store/slices/authSlice';
import { useEffect } from 'react';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector((state: RootState) => state.auth);

  // Initialize auth state - ensure loading is false on startup
  useEffect(() => {
    dispatch(clearLoading());
  }, [dispatch]);

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch(setLoading(true));

    // Mock authentication
    setTimeout(() => {
      if (email === 'admin@opticonnect.com' && password === 'password') {
        dispatch(loginSuccess({
          id: '1',
          email: 'admin@opticonnect.com',
          name: 'Admin User',
          role: 'admin',
          permissions: ['all'],
          assignedStates: [], // Admin has access to all states
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
      } else if (email === 'manager@opticonnect.com' && password === 'password') {
        dispatch(loginSuccess({
          id: '2',
          email: 'manager@opticonnect.com',
          name: 'Regional Manager',
          role: 'manager',
          permissions: ['read', 'write', 'manage_users', 'view_analytics', 'manage_equipment'],
          assignedStates: ['Maharashtra', 'Gujarat'], // Manager has regional access
          department: 'Operations',
          phoneNumber: '+91-98765-43210',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
      } else if (email === 'tech@opticonnect.com' && password === 'password') {
        dispatch(loginSuccess({
          id: '3',
          email: 'tech@opticonnect.com',
          name: 'Field Technician',
          role: 'technician',
          permissions: ['read', 'write', 'manage_equipment', 'update_status'],
          assignedStates: ['Maharashtra'], // Technician has field access
          department: 'Engineering',
          phoneNumber: '+91-98765-43212',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
      } else if (email === 'user@opticonnect.com' && password === 'password') {
        dispatch(loginSuccess({
          id: '4',
          email: 'user@opticonnect.com',
          name: 'Regular User',
          role: 'viewer',
          permissions: ['read', 'view_basic_analytics'],
          assignedStates: ['Maharashtra', 'Gujarat', 'Rajasthan'], // User has limited access
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
      } else {
        dispatch(clearLoading());
      }
    }, 1000);

    return true;
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return {
    isAuthenticated,
    user,
    loading,
    login,
    logout: handleLogout,
  };
};