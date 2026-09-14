import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOrganizationContext, createOrganization } from '../../slices/organizationSlice';
import { addToast } from '../../slices/uiSlice';
import { Building2, ChevronDown, Plus, Check, Shield, User, LogOut } from 'lucide-react';
import { logoutUser } from '../../slices/authSlice';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const { user } = useSelector((state) => state.auth);
  const { organizations, activeOrg, activeRole, isOwner } = useSelector((state) => state.organization);

  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgDesc, setOrgDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOrg = (orgId) => {
    dispatch(fetchOrganizationContext(orgId));
    setIsOpen(false);
    dispatch(addToast({ message: 'Switched organization workspace', type: 'info' }));
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await dispatch(createOrganization({ name: orgName, description: orgDesc })).unwrap();
      dispatch(fetchOrganizationContext(res.organization._id));
      setShowCreateModal(false);
      setOrgName('');
      setOrgDesc('');
      dispatch(addToast({ message: 'New organization created successfully', type: 'success' }));
    } catch (err) {
      dispatch(addToast({ message: err || 'Failed to create organization', type: 'error' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <header className="header">
      {/* Organization Switcher */}
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.45rem 0.85rem',
            color: 'var(--text-main)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #4f46e5, #9333ea)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: '700'
            }}
          >
            {activeOrg?.name ? activeOrg.name.charAt(0).toUpperCase() : 'O'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ lineHeight: '1.2' }}>{activeOrg?.name || 'Select Workspace'}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: '400' }}>
              {activeRole?.name ? `${activeRole.name}` : 'Tenant'}
            </span>
          </div>
          <ChevronDown size={16} color="var(--text-muted)" />
        </button>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              width: '280px',
              background: 'var(--bg-modal)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-dropdown)',
              padding: '0.5rem',
              zIndex: 100
            }}
          >
            <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '600' }}>
              SWITCH ORGANIZATIONS
            </div>
            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {organizations.map((item) => {
                const isCurrent = item.organization?._id === activeOrg?._id;
                return (
                  <button
                    key={item.organization?._id}
                    onClick={() => handleSelectOrg(item.organization?._id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      background: isCurrent ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: isCurrent ? '#818cf8' : 'var(--text-main)',
                      marginBottom: '2px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <Building2 size={16} color={isCurrent ? '#818cf8' : 'var(--text-dim)'} />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: isCurrent ? '700' : '500' }}>
                          {item.organization?.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          Role: {item.role?.name || 'Member'}
                        </div>
                      </div>
                    </div>
                    {isCurrent && <Check size={16} color="#818cf8" />}
                  </button>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowCreateModal(true);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--primary)',
                  fontSize: '0.825rem',
                  fontWeight: '600'
                }}
              >
                <Plus size={16} /> Create New Organization
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right controls: User profile & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={18} color="var(--text-muted)" />
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', lineHeight: '1.2' }}>{user?.name || 'User'}</span>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>{user?.email}</span>
          </div>
        </div>

        <button
          className="btn-icon"
          title="Log Out"
          onClick={handleLogout}
          style={{ marginLeft: '0.5rem' }}
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Organization</h3>
              <button className="btn-icon" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateOrg}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Organization Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Acme Corporation"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Brief description of this workspace or company"
                    value={orgDesc}
                    onChange={(e) => setOrgDesc(e.target.value)}
                  />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  You will automatically become the primary <strong>Owner</strong> of this organization with full administrative permissions and default roles initialized.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
