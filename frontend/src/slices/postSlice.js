import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchPosts = createAsyncThunk(
  'posts/fetchList',
  async ({ orgId, filter = 'all' }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/organizations/${orgId}/posts?filter=${filter}`);
      return res.data.posts;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createPost = createAsyncThunk(
  'posts/create',
  async ({ orgId, postData }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/organizations/${orgId}/posts`, postData);
      return res.data.post;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updatePost = createAsyncThunk(
  'posts/update',
  async ({ orgId, postId, postData }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/organizations/${orgId}/posts/${postId}`, postData);
      return res.data.post;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deletePost = createAsyncThunk(
  'posts/delete',
  async ({ orgId, postId }, { rejectWithValue }) => {
    try {
      await api.delete(`/organizations/${orgId}/posts/${postId}`);
      return postId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const postSlice = createSlice({
  name: 'posts',
  initialState: {
    posts: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.unshift(action.payload);
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) state.posts[index] = action.payload;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((p) => p._id !== action.payload);
      });
  }
});

export default postSlice.reducer;
