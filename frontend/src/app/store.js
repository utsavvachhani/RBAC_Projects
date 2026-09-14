import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../slices/authSlice';
import organizationReducer from '../slices/organizationSlice';
import memberReducer from '../slices/memberSlice';
import roleReducer from '../slices/roleSlice';
import departmentReducer from '../slices/departmentSlice';
import postReducer from '../slices/postSlice';
import invitationReducer from '../slices/invitationSlice';
import auditLogReducer from '../slices/auditLogSlice';
import uiReducer from '../slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    organization: organizationReducer,
    members: memberReducer,
    roles: roleReducer,
    departments: departmentReducer,
    posts: postReducer,
    invitations: invitationReducer,
    auditLogs: auditLogReducer,
    ui: uiReducer
  }
});

export default store;
