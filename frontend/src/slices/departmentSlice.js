import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchDepartments = createAsyncThunk(
  'departments/fetchList',
  async (orgId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/organizations/${orgId}/departments`);
      return res.data.departments;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createDepartment = createAsyncThunk(
  'departments/create',
  async ({ orgId, deptData }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/organizations/${orgId}/departments`, deptData);
      return res.data.department;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateDepartment = createAsyncThunk(
  'departments/update',
  async ({ orgId, departmentId, deptData }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/organizations/${orgId}/departments/${departmentId}`, deptData);
      return res.data.department;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  'departments/delete',
  async ({ orgId, departmentId }, { rejectWithValue }) => {
    try {
      await api.delete(`/organizations/${orgId}/departments/${departmentId}`);
      return departmentId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const departmentSlice = createSlice({
  name: 'departments',
  initialState: {
    departments: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.departments.push(action.payload);
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        const index = state.departments.findIndex((d) => d._id === action.payload._id);
        if (index !== -1) state.departments[index] = action.payload;
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.departments = state.departments.filter((d) => d._id !== action.payload);
      });
  }
});

export default departmentSlice.reducer;
