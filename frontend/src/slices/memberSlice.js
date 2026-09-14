import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchMembers = createAsyncThunk(
  'members/fetchList',
  async ({ orgId, filters = {} }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await api.get(`/organizations/${orgId}/members?${params}`);
      return res.data.members;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createMember = createAsyncThunk(
  'members/create',
  async ({ orgId, memberData }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/organizations/${orgId}/members`, memberData);
      return res.data.member;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const assignMemberRole = createAsyncThunk(
  'members/assignRole',
  async ({ orgId, memberId, roleId }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/organizations/${orgId}/members/${memberId}/role`, { roleId });
      return res.data.member;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const assignMemberDepartments = createAsyncThunk(
  'members/assignDepartments',
  async ({ orgId, memberId, departmentIds }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/organizations/${orgId}/members/${memberId}/departments`, { departmentIds });
      return res.data.member;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateMemberStatus = createAsyncThunk(
  'members/updateStatus',
  async ({ orgId, memberId, status }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/organizations/${orgId}/members/${memberId}/status`, { status });
      return { memberId, status };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const removeMember = createAsyncThunk(
  'members/remove',
  async ({ orgId, memberId }, { rejectWithValue }) => {
    try {
      await api.delete(`/organizations/${orgId}/members/${memberId}`);
      return memberId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const memberSlice = createSlice({
  name: 'members',
  initialState: {
    members: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMembers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.members = action.payload;
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createMember.fulfilled, (state, action) => {
        state.members.unshift(action.payload);
      })
      .addCase(assignMemberRole.fulfilled, (state, action) => {
        const index = state.members.findIndex((m) => m._id === action.payload._id);
        if (index !== -1) state.members[index] = action.payload;
      })
      .addCase(assignMemberDepartments.fulfilled, (state, action) => {
        const index = state.members.findIndex((m) => m._id === action.payload._id);
        if (index !== -1) state.members[index] = action.payload;
      })
      .addCase(updateMemberStatus.fulfilled, (state, action) => {
        const member = state.members.find((m) => m._id === action.payload.memberId);
        if (member) member.status = action.payload.status;
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        state.members = state.members.filter((m) => m._id !== action.payload);
      });
  }
});

export default memberSlice.reducer;
