import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'technician' | 'viewer';
  permissions: string[];
  department: string;
  phone?: string;
  created_at: string;
  last_login?: string;
  status: 'active' | 'inactive' | 'suspended';
}

interface UserState {
  users: User[];
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  filters: {
    role?: string;
    status?: string;
    department?: string;
    search?: string;
  };
}

const initialState: UserState = {
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
  filters: {},
};

export const fetchUsers = createAsyncThunk(
  'user/fetchUsers',
  async (params: { page?: number; limit?: number; filters?: any } = {}) => {
    const queryParams = new URLSearchParams({
      page: String(params.page || 1),
      limit: String(params.limit || 10),
      ...params.filters,
    });

    const response = await fetch(`/api/users?${queryParams}`);
    return response.json();
  }
);

export const createUser = createAsyncThunk(
  'user/createUser',
  async (userData: Omit<User, 'id' | 'created_at'>) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return response.json();
  }
);

export const updateUser = createAsyncThunk(
  'user/updateUser',
  async (userData: Partial<User> & { id: string }) => {
    const response = await fetch(`/api/users/${userData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return response.json();
  }
);

export const deleteUser = createAsyncThunk(
  'user/deleteUser',
  async (userId: string) => {
    await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    return userId;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
    },
    setFilters: (state, action: PayloadAction<typeof initialState.filters>) => {
      state.filters = action.payload;
    },
    setPagination: (state, action: PayloadAction<Partial<typeof initialState.pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.pagination.total = action.payload.total;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch users';
      })
      // Create user
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create user';
      })
      // Update user
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update user';
      })
      // Delete user
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(user => user.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete user';
      });
  },
});

export const { setSelectedUser, setFilters, setPagination, clearError } = userSlice.actions;
export default userSlice.reducer;