import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { fetchOrganizationContext, fetchUserOrganizations } from '../slices/organizationSlice';
import { addToast } from '../slices/uiSlice';
import { Settings as SettingsIcon, AlertTriangle, ShieldAlert, Save } from 'lucide-react';

export const Settings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeOrg, isOwner } = useSelector((state) => state.organization);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [allowInvites, setAllowInvites] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeOrg) {
      setName(activeOrg.name || '');
      setDescription(activeOrg.description || '');
      setAllowInvites(activeOrg.settings?.allowMemberInvites ?? true);
    }
  }, [activeOrg]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/organizations/${activeOrg._id}`, {
        name,
        description,
        settings: {
          allowMemberInvites: allowInvites
        }
      });
      dispatch(fetchOrganizationContext(activeOrg._id));
      dispatch(addToast({ message: 'Organization settings updated', type: 'success' }));
    } catch (err) {
      dispatch(addToast({ message: err.message || 'Failed to update settings', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrg = async () => {
    const confirmation = window.prompt(
      `Type the organization name "${activeOrg.name}" to confirm deactivation:`
    );
    if (confirmation !== activeOrg.name) {
      dispatch(addToast({ message: 'Name did not match. Deactivation cancelled.', type: 'info' }));
      return;
    }

    try {
      await api.delete(`/organizations/${activeOrg._id}`);
      dispatch(addToast({ message: 'Organization successfully deactivated', type: 'success' }));
      localStorage.removeItem('activeOrgId');
      await dispatch(fetchUserOrganizations());
      navigate('/');
    } catch (err) {
      dispatch(addToast({ message: err.message || 'Failed to deactivate organization', type: 'error' }));
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>Organization Settings</h2>
        <p>Manage workspace identity, membership policies, and administrative lifecycle.</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Organization Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tenant Slug (Identifier)</label>
            <input
              type="text"
              className="form-input"
              value={activeOrg?.slug || ''}
              disabled
              style={{ opacity: 0.6 }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Collaboration Policies</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.25rem' }}>
              <input
                type="checkbox"
                checked={allowInvites}
                onChange={(e) => setAllowInvites(e.target.checked)}
              />
              <span>Allow authorized managers to invite external members</span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>

      {/* Danger Zone (Owner Only) */}
      {isOwner && (
        <div
          className="card"
          style={{
            borderColor: 'rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={20} color="#ef4444" />
            <h3 style={{ color: '#f87171' }}>Danger Zone</h3>
          </div>
          <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Deactivating this organization will revoke member access and terminate tenant sessions. This action can only be executed by the primary Owner.
          </p>

          <button type="button" className="btn btn-danger" onClick={handleDeleteOrg}>
            <ShieldAlert size={16} /> Deactivate Organization
          </button>
        </div>
      )}
    </div>
  );
};

export default Settings;
