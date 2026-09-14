import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchRoles = createAsyncThunk('roles/fetchList', async (orgId, { rejectWithValue }) => {
  try {
    const res = await api.get(`/organizations/${orgId}/roles`);
    return res.data.roles;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchAvailablePermissions = createAsyncThunk(
  'roles/fetchPermissions',
  async (orgId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/organizations/${orgId}/roles/permissions`);
      return res.data.permissions;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createRole = createAsyncThunk(
  'roles/create',
  async ({ orgId, roleData }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/organizations/${orgId}/roles`, roleData);
      return res.data.role;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateRole = createAsyncThunk(
  'roles/update',
  async ({ orgId, roleId, roleData }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/organizations/${orgId}/roles/${roleId}`, roleData);
      return res.data.role;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteRole = createAsyncThunk(
  'roles/delete',
  async ({ orgId, roleId }, { rejectWithValue }) => {
    try {
      await api.delete(`/organizations/${orgId}/roles/${roleId}`);
      return roleId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const roleSlice = createSlice({
  name: 'roles',
  initialState: {
    roles: [],
    availablePermissions: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAvailablePermissions.fulfilled, (state, action) => {
        state.availablePermissions = action.payload;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.roles.push(action.payload);
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        const index = state.roles.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) state.roles[index] = action.payload;
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.roles = state.roles.filter((r) => r._id !== action.payload);
      });
  }
});

export default roleSlice.reducer;
