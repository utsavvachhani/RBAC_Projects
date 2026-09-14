import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../services/api';
import { fetchOrganizationContext } from '../slices/organizationSlice';
import { fetchCurrentUser } from '../slices/authSlice';
import { addToast } from '../slices/uiSlice';
import { Shield, ArrowRight } from 'lucide-react';

export const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleAccept = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post(`/invitations/${token}/accept`, { name, password });
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
      }
      if (res.data?.organization?._id) {
        localStorage.setItem('activeOrgId', res.data.organization._id);
        await dispatch(fetchCurrentUser());
        await dispatch(fetchOrganizationContext(res.data.organization._id));
      }
      dispatch(addToast({ message: 'Welcome! You have joined the organization', type: 'success' }));
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid or expired invitation token');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #0a0d14 70%)',
        padding: '1.5rem'
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--primary-gradient)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 25px var(--primary-glow)',
              marginBottom: '1rem'
            }}
          >
            <Shield size={32} color="#fff" />
          </div>
          <h2>Join Organization</h2>
          <p style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>
            You have been invited to collaborate in OmniRBAC
          </p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: '1.25rem'
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleAccept}>
            <div className="form-group">
              <label className="form-label">Your Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Set Account Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            >
              {submitting ? 'Joining...' : 'Accept & Enter Workspace'} <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvite;
