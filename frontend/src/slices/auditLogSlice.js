import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchAuditLogs = createAsyncThunk(
  'auditLogs/fetchList',
  async ({ orgId, filters = {}, page = 1 }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ ...filters, page }).toString();
      const res = await api.get(`/organizations/${orgId}/audit-logs?${params}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const auditLogSlice = createSlice({
  name: 'auditLogs',
  initialState: {
    logs: [],
    total: 0,
    page: 1,
    totalPages: 1,
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditLogs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload.logs;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default auditLogSlice.reducer;
