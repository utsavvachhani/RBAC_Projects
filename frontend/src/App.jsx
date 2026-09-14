import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import AcceptInvite from './pages/AcceptInvite';

import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Departments from './pages/Departments';
import Roles from './pages/Roles';
import Posts from './pages/Posts';
import Invitations from './pages/Invitations';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/invite/:token" element={<AcceptInvite />} />

        {/* Protected Tenant Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route
            path="members"
            element={
              <ProtectedRoute requiredPermission="member.read">
                <Members />
              </ProtectedRoute>
            }
          />
          <Route
            path="departments"
            element={
              <ProtectedRoute requiredPermission="department.read">
                <Departments />
              </ProtectedRoute>
            }
          />
          <Route
            path="roles"
            element={
              <ProtectedRoute requiredPermission="role.read">
                <Roles />
              </ProtectedRoute>
            }
          />
          <Route
            path="posts"
            element={
              <ProtectedRoute requiredPermission="post.read">
                <Posts />
              </ProtectedRoute>
            }
          />
          <Route
            path="invitations"
            element={
              <ProtectedRoute requiredPermission="member.invite">
                <Invitations />
              </ProtectedRoute>
            }
          />
          <Route
            path="audit-logs"
            element={
              <ProtectedRoute requiredPermission="audit.read">
                <AuditLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute requiredPermission="settings.read">
                <Settings />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
