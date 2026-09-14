import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchInvitations = createAsyncThunk(
  'invitations/fetchList',
  async (orgId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/organizations/${orgId}/invitations`);
      return res.data.invitations;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createInvitation = createAsyncThunk(
  'invitations/create',
  async ({ orgId, inviteData }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/organizations/${orgId}/invitations`, inviteData);
      return res.data.invitation;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const revokeInvitation = createAsyncThunk(
  'invitations/revoke',
  async ({ orgId, invitationId }, { rejectWithValue }) => {
    try {
      await api.post(`/organizations/${orgId}/invitations/${invitationId}/revoke`);
      return invitationId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const resendInvitation = createAsyncThunk(
  'invitations/resend',
  async ({ orgId, invitationId }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/organizations/${orgId}/invitations/${invitationId}/resend`);
      return res.data.invitation;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const invitationSlice = createSlice({
  name: 'invitations',
  initialState: {
    invitations: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvitations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInvitations.fulfilled, (state, action) => {
        state.loading = false;
        state.invitations = action.payload;
      })
      .addCase(fetchInvitations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createInvitation.fulfilled, (state, action) => {
        state.invitations.unshift(action.payload);
      })
      .addCase(revokeInvitation.fulfilled, (state, action) => {
        const invite = state.invitations.find((i) => i._id === action.payload);
        if (invite) invite.status = 'revoked';
      })
      .addCase(resendInvitation.fulfilled, (state, action) => {
        const index = state.invitations.findIndex((i) => i._id === action.payload._id);
        if (index !== -1) state.invitations[index] = action.payload;
      });
  }
});

export default invitationSlice.reducer;
