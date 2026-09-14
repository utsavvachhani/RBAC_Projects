import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchRoles,
  fetchAvailablePermissions,
  createRole,
  updateRole,
  deleteRole
} from '../slices/roleSlice';
import { addToast } from '../slices/uiSlice';
import { Can } from '../components/auth/Can';
import { ShieldCheck, Plus, Shield, Check, Trash2, Edit3, Lock, Users } from 'lucide-react';

export const Roles = () => {
  const dispatch = useDispatch();
  const { activeOrg, isOwner } = useSelector((state) => state.organization);
  const { roles, availablePermissions, loading } = useSelector((state) => state.roles);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState('organization');
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  useEffect(() => {
    if (activeOrg?._id) {
      dispatch(fetchRoles(activeOrg._id));
      dispatch(fetchAvailablePermissions(activeOrg._id));
    }
  }, [activeOrg?._id, dispatch]);

  // Group permissions by resource for the builder matrix
  const permissionsByResource = availablePermissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) acc[perm.resource] = [];
    acc[perm.resource].push(perm);
    return acc;
  }, {});

  const handleTogglePermission = (permKey) => {
    if (selectedPermissions.includes(permKey)) {
      setSelectedPermissions(selectedPermissions.filter((k) => k !== permKey));
    } else {
      setSelectedPermissions([...selectedPermissions, permKey]);
    }
  };

  const handleSelectAllResource = (resource) => {
    const resourceKeys = permissionsByResource[resource].map((p) => p.key);
    const allSelected = resourceKeys.every((k) => selectedPermissions.includes(k));
    if (allSelected) {
      setSelectedPermissions(selectedPermissions.filter((k) => !resourceKeys.includes(k)));
    } else {
      const set = new Set([...selectedPermissions, ...resourceKeys]);
      setSelectedPermissions(Array.from(set));
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        createRole({
          orgId: activeOrg._id,
          roleData: { name, description, permissions: selectedPermissions, scope }
        })
      ).unwrap();
      dispatch(addToast({ message: `Role '${name}' created successfully`, type: 'success' }));
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      dispatch(addToast({ message: err || 'Failed to create role', type: 'error' }));
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!selectedRole) return;
    try {
      await dispatch(
        updateRole({
          orgId: activeOrg._id,
          roleId: selectedRole._id,
          roleData: { name, description, permissions: selectedPermissions, scope }
        })
      ).unwrap();
      dispatch(addToast({ message: 'Role updated successfully', type: 'success' }));
      setShowEditModal(false);
      resetForm();
    } catch (err) {
      dispatch(addToast({ message: err || 'Failed to update role', type: 'error' }));
    }
  };

  const handleDeleteRole = async (role) => {
    if (!window.confirm(`Are you sure you want to delete the custom role '${role.name}'?`)) return;
    try {
      await dispatch(deleteRole({ orgId: activeOrg._id, roleId: role._id })).unwrap();
      dispatch(addToast({ message: `Role '${role.name}' removed`, type: 'success' }));
    } catch (err) {
      dispatch(addToast({ message: err || 'Failed to delete role', type: 'error' }));
    }
  };

  const openEditModal = (role) => {
    setSelectedRole(role);
    setName(role.name);
    setDescription(role.description);
    setScope(role.scope);
    setSelectedPermissions(role.permissions || []);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setScope('organization');
    setSelectedPermissions([]);
    setSelectedRole(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Roles & Access Permissions</h2>
          <p>Configure fine-grained system and custom roles with scoped permissions.</p>
        </div>
        <Can permission="role.create">
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            <Plus size={16} /> Create Custom Role
          </button>
        </Can>
      </div>

      {/* Role Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {roles.map((role) => (
          <div key={role._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>{role.name}</h3>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                    <span className={`badge ${role.isSystemRole ? 'badge-primary' : 'badge-warning'}`}>
                      {role.isSystemRole ? 'System Role' : 'Custom Role'}
                    </span>
                    <span className="badge badge-info">
                      {role.scope} scope
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  <Users size={14} /> {role.memberCount || 0} members
                </div>
              </div>

              <p style={{ fontSize: '0.825rem', marginBottom: '1rem' }}>{role.description || 'No description provided.'}</p>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Granted Permissions ({role.permissions?.length || 0})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', maxHeight: '100px', overflowY: 'auto' }}>
                  {role.permissions?.map((p) => (
                    <span
                      key={p}
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.7rem',
                        fontFamily: 'monospace'
                      }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Can permission="role.update">
                <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(role)}>
                  <Edit3 size={14} /> {role.isSystemRole ? 'View / Edit' : 'Edit Role'}
                </button>
              </Can>

              {!role.isSystemRole && (
                <Can permission="role.delete">
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRole(role)}>
                    <Trash2 size={14} />
                  </button>
                </Can>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Role Builder Modal (Create & Edit) */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>{showEditModal ? `Configure Role: ${selectedRole?.name}` : 'Role Builder — Custom Role'}</h3>
              <button
                className="btn-icon"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={showEditModal ? handleUpdateRole : handleCreateRole}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Role Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Content Manager or Security Auditor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={selectedRole?.isSystemRole}
                    required
                  />
                  {selectedRole?.isSystemRole && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      System role names cannot be altered.
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Describe the operational responsibility and authority of this role"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Permission Authority Scope *</label>
                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                    {['organization', 'department', 'personal'].map((s) => (
                      <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', textTransform: 'capitalize', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="scope"
                          value={s}
                          checked={scope === s}
                          onChange={(e) => setScope(e.target.value)}
                          disabled={selectedRole?.isSystemRole}
                        />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                    Action Permissions Matrix ({selectedPermissions.length} selected)
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {Object.entries(permissionsByResource).map(([resource, perms]) => {
                      const allSelected = perms.every((p) => selectedPermissions.includes(p.key));
                      return (
                        <div
                          key={resource}
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.75rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                            <span style={{ fontWeight: '700', fontSize: '0.825rem', textTransform: 'uppercase', color: 'var(--primary)' }}>
                              {resource}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSelectAllResource(resource)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              {allSelected ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.4rem' }}>
                            {perms.map((p) => {
                              const checked = selectedPermissions.includes(p.key);
                              return (
                                <label
                                  key={p.key}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleTogglePermission(p.key)}
                                    disabled={selectedRole?.name === 'Owner'}
                                  />
                                  <span>{p.action}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {showEditModal ? 'Save Role Configuration' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;
