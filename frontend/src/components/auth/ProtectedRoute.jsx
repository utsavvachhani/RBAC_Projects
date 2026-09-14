import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOrganizationContext, fetchUserOrganizations } from '../../slices/organizationSlice';
import { fetchCurrentUser } from '../../slices/authSlice';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export const ProtectedRoute = ({ children, requiredPermission = null }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, token, user } = useSelector((state) => state.auth);
  const { activeOrg, organizations, isOwner, permissions, loading } = useSelector((state) => state.organization);

  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [isAuthenticated, user, dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserOrganizations()).then((res) => {
        const orgList = res.payload || [];
        if (orgList.length > 0 && !activeOrg) {
          const savedOrgId = localStorage.getItem('activeOrgId');
          const matched = orgList.find((item) => item.organization?._id === savedOrgId);
          const targetId = matched ? savedOrgId : orgList[0].organization?._id;
          if (targetId) {
            dispatch(fetchOrganizationContext(targetId));
          }
        }
      });
    }
  }, [isAuthenticated, dispatch]);

  if (!token && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Permission check
  if (requiredPermission && !isOwner && (!permissions || !permissions.includes(requiredPermission))) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
        <ShieldAlert size={56} color="#ef4444" style={{ marginBottom: '1.25rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>Access Denied</h2>
        <p style={{ maxWidth: '420px', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
          You do not have the required permission (<code>{requiredPermission}</code>) to view or manage this section.
        </p>
        <button className="btn btn-secondary" onClick={() => window.history.back()}>
          Return to previous page
        </button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
