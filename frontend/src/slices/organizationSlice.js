import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchUserOrganizations = createAsyncThunk(
  'organization/fetchList',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/organizations');
      return res.data.organizations;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createOrganization = createAsyncThunk(
  'organization/create',
  async (orgData, { rejectWithValue }) => {
    try {
      const res = await api.post('/organizations', orgData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchOrganizationContext = createAsyncThunk(
  'organization/fetchContext',
  async (orgId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/organizations/${orgId}/context`);
      localStorage.setItem('activeOrgId', orgId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  organizations: [],
  activeOrg: null,
  activeMembership: null,
  activeRole: null,
  permissions: [],
  departments: [],
  isOwner: false,
  loading: false,
  error: null
};

const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    clearActiveOrg: (state) => {
      state.activeOrg = null;
      state.activeMembership = null;
      state.activeRole = null;
      state.permissions = [];
      localStorage.removeItem('activeOrgId');
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch List
      .addCase(fetchUserOrganizations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserOrganizations.fulfilled, (state, action) => {
        state.loading = false;
        state.organizations = action.payload;
      })
      .addCase(fetchUserOrganizations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Org
      .addCase(createOrganization.fulfilled, (state, action) => {
        state.organizations.unshift({
          organization: action.payload.organization,
          role: action.payload.roles[0],
          membershipId: action.payload.membership._id
        });
      })
      // Fetch Context
      .addCase(fetchOrganizationContext.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrganizationContext.fulfilled, (state, action) => {
        state.loading = false;
        state.activeOrg = action.payload.organization;
        state.activeMembership = action.payload.membership;
        state.activeRole = action.payload.role;
        state.permissions = action.payload.permissions || [];
        state.departments = action.payload.departments || [];
        state.isOwner = action.payload.isOwner;
      })
      .addCase(fetchOrganizationContext.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearActiveOrg } = organizationSlice.actions;
export default organizationSlice.reducer;
