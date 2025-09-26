import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import mapSlice from './slices/mapSlice';
import userSlice from './slices/userSlice';
import userManagementSlice from './slices/userManagementSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    map: mapSlice,
    user: userSlice,
    userManagement: userManagementSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;