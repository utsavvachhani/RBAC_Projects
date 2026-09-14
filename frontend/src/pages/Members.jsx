import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchMembers,
  createMember,
  assignMemberRole,
  assignMemberDepartments,
  updateMemberStatus,
  removeMember
} from '../slices/memberSlice';
import { fetchRoles } from '../slices/roleSlice';
import { fetchDepartments } from '../slices/departmentSlice';
import { createInvitation } from '../slices/invitationSlice';
import { addToast } from '../slices/uiSlice';
import { Can } from '../components/auth/Can';
import {
  Users,
  Search,
  UserPlus,
  Mail,
  Shield,
  Layers,
  MoreVertical,
  AlertTriangle,
  UserCheck,
  UserX,
  Trash2
} from 'lucide-react';

export const Members = () => {
  const dispatch = useDispatch();
  const { activeOrg, activeRole, isOwner } = useSelector((state) => state.organization);
  const { members, loading } = useSelector((state) => state.members);
  const { roles } = useSelector((state) => state.roles);
  const { departments } = useSelector((state) => state.departments);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [inviteDeptIds, setInviteDeptIds] = useState([]);

  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('Password123!');
  const [createRoleId, setCreateRoleId] = useState('');
  const [createDeptIds, setCreateDeptIds] = useState([]);

  const [newRoleId, setNewRoleId] = useState('');
  const [targetDeptIds, setTargetDeptIds] = useState([]);

  useEffect(() => {
    if (activeOrg?._id) {
      dispatch(fetchMembers({
        orgId: activeOrg._id,
        filters: {
          search: searchTerm,
          roleId: selectedRole,
          departmentId: selectedDept,
          status: selectedStatus
        }
      }));
      dispatch(fetchRoles(activeOrg._id));
      dispatch(fetchDepartments(activeOrg._id));
    }
  }, [activeOrg?._id, searchTerm, selectedRole, selectedDept, selectedStatus, dispatch]);

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        createInvitation({
          orgId: activeOrg._id,
          inviteData: { email: inviteEmail, roleId: inviteRoleId, departmentIds: inviteDeptIds }
        })
      ).unwrap();
      dispatch(addToast({ message: 'Invitation sent successfully', type: 'success' }));
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRoleId('');
      setInviteDeptIds([]);
    } catch (err) {
      dispatch(addToast({ message: err || 'Failed to send invitation', type: 'error' }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        createMember({
          orgId: activeOrg._id,
          memberData: {
            name: createName,
            email: createEmail,
            password: createPassword,
            roleId: createRoleId,
            departmentIds: createDeptIds
          }
        })
      ).unwrap();
      dispatch(addToast({ message: 'Member created successfully', type: 'success' }));
      setShowCreateModal(false);
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('Password123!');
      setCreateRoleId('');
      setCreateDeptIds([]);
    } catch (err) {
      dispatch(addToast({ message: err || 'Failed to create member', type: 'error' }));
    }
  };

  const handleRoleChange = async (e) => {
    e.preventDefault();
    if (!selectedMember || !newRoleId) return;
    try {
      await dispatch(
        assignMemberRole({
          orgId: activeOrg._id,
          memberId: selectedMember._id,
          roleId: newRoleId
        })
      ).unwrap();
      dispatch(addToast({ message: 'Member role updated successfully', type: 'success' }));
      setShowRoleModal(false);
      setSelectedMember(null);
    } catch (err) {
      dispatch(addToast({ message: err || 'Failed to change role', type: 'error' }));
    }
  };

  const handleDeptChange = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      await dispatch(
        assignMemberDepartments({
          orgId: activeOrg._id,
          memberId: selectedMember._id,
          departmentIds: targetDeptIds
        })
      ).unwrap();
      dispatch(addToast({ message: 'Member departments updated', type: 'success' }));
      setShowDeptModal(false);
      setSelectedMember(null);
    } catch (err) {
      dispatch(addToast({ message: err || 'Failed to change departments', type: 'error' }));
    }
  };

  const handleToggleStatus = async (member) => {
    const nextStatus = member.status === 'active' ? 'suspended' : 'active';
    try {
      await dispatch(
        updateMemberStatus({
          orgId: activeOrg._id,
          memberId: member._id,
          status: nextStatus
        })
      ).unwrap();
      dispatch(addToast({ message: `Member marked as ${nextStatus}`, type: 'info' }));
    } catch (err) {
      dispatch(addToast({ message: err || 'Status update failed', type: 'error' }));
    }
  };

  const handleRemove = async (member) => {
    if (!window.confirm(`Are you sure you want to remove ${member.userId?.name} from this organization?`)) {
      return;
    }
    try {
      await dispatch(removeMember({ orgId: activeOrg._id, memberId: member._id })).unwrap();
      dispatch(addToast({ message: 'Member removed from organization', type: 'success' }));
    } catch (err) {
      dispatch(addToast({ message: err || 'Failed to remove member', type: 'error' }));
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Organization Members</h2>
          <p>Manage members, assign scoped roles, and allocate departmental resources.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Can permission="member.invite">
            <button className="btn btn-secondary" onClick={() => setShowInviteModal(true)}>
              <Mail size={16} /> Invite Member
            </button>
          </Can>
          <Can permission="member.create">
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <UserPlus size={16} /> Create Member
            </button>
          </Can>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '12px' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.2rem' }}
            />
          </div>

          <select
            className="form-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>

          <select
            className="form-select"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>

          <select
            className="form-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Assigned Role</th>
              <th>Departments</th>
              <th>Status</th>
              <th>Joined Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-dim)' }}>
                  No members matched the filter criteria.
                </td>
              </tr>
            ) : (
              members.map((m) => {
                const isMemberOwner = m.roleId?.name === 'Owner';
                return (
                  <tr key={m._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            fontSize: '0.85rem',
                            fontWeight: '700'
                          }}
                        >
                          {m.userId?.avatar ? (
                            <img src={m.userId.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            m.userId?.name?.charAt(0) || 'U'
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{m.userId?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{m.userId?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${isMemberOwner ? 'badge-primary' : 'badge-info'}`}>
                        {m.roleId?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {m.departmentIds?.length > 0 ? (
                          m.departmentIds.map((dept) => (
                            <span
                              key={dept._id}
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                padding: '0.15rem 0.45rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.725rem'
                              }}
                            >
                              {dept.name}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>None</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${m.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {new Date(m.joinedAt || m.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        {/* Change Role Button */}
                        <Can permission="role.assign">
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Change Role"
                            onClick={() => {
                              setSelectedMember(m);
                              setNewRoleId(m.roleId?._id || '');
                              setShowRoleModal(true);
                            }}
                          >
                            <Shield size={14} /> Role
                          </button>
                        </Can>

                        {/* Change Departments Button */}
                        <Can permission="member.update">
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Assign Departments"
                            onClick={() => {
                              setSelectedMember(m);
                              setTargetDeptIds((m.departmentIds || []).map((d) => d._id));
                              setShowDeptModal(true);
                            }}
                          >
                            <Layers size={14} /> Depts
                          </button>
                        </Can>

                        {/* Suspend / Activate */}
                        <Can permission="member.update">
                          {!isMemberOwner && (
                            <button
                              className="btn btn-secondary btn-sm"
                              title={m.status === 'active' ? 'Suspend Member' : 'Activate Member'}
                              onClick={() => handleToggleStatus(m)}
                            >
                              {m.status === 'active' ? <UserX size={14} color="#f87171" /> : <UserCheck size={14} color="#34d399" />}
                            </button>
                          )}
                        </Can>

                        {/* Remove Member */}
                        <Can permission="member.remove">
                          {!isMemberOwner && (
                            <button
                              className="btn btn-danger btn-sm"
                              title="Remove from Organization"
                              onClick={() => handleRemove(m)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </Can>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Invite Member to {activeOrg.name}</h3>
              <button className="btn-icon" onClick={() => setShowInviteModal(false)}>✕</button>
            </div>
            <form onSubmit={handleInvite}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="invitee@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Role *</label>
                  <select
                    className="form-select"
                    value={inviteRoleId}
                    onChange={(e) => setInviteRoleId(e.target.value)}
                    required
                  >
                    <option value="">Select Role</option>
                    {roles
                      .filter((r) => isOwner || r.name !== 'Owner')
                      .map((r) => (
                        <option key={r._id} value={r._id}>{r.name} ({r.scope})</option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assign Departments (optional)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {departments.map((dept) => (
                      <label key={dept._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={inviteDeptIds.includes(dept._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setInviteDeptIds([...inviteDeptIds, dept._id]);
                            } else {
                              setInviteDeptIds(inviteDeptIds.filter((id) => id !== dept._id));
                            }
                          }}
                        />
                        {dept.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Member Modal (Direct Creation) */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Member Account</h3>
              <button className="btn-icon" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rahul Sharma"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="user@example.com"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select
                    className="form-select"
                    value={createRoleId}
                    onChange={(e) => setCreateRoleId(e.target.value)}
                    required
                  >
                    <option value="">Select Role</option>
                    {roles
                      .filter((r) => isOwner || r.name !== 'Owner')
                      .map((r) => (
                        <option key={r._id} value={r._id}>{r.name} ({r.scope})</option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Departments</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {departments.map((dept) => (
                      <label key={dept._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={createDeptIds.includes(dept._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateDeptIds([...createDeptIds, dept._id]);
                            } else {
                              setCreateDeptIds(createDeptIds.filter((id) => id !== dept._id));
                            }
                          }}
                        />
                        {dept.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showRoleModal && selectedMember && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Change Role for {selectedMember.userId?.name}</h3>
              <button className="btn-icon" onClick={() => setShowRoleModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRoleChange}>
              <div className="modal-body">
                <p style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                  Current role: <strong>{selectedMember.roleId?.name}</strong>
                </p>
                <div className="form-group">
                  <label className="form-label">Select New Role</label>
                  <select
                    className="form-select"
                    value={newRoleId}
                    onChange={(e) => setNewRoleId(e.target.value)}
                    required
                  >
                    <option value="">Select Role</option>
                    {roles
                      .filter((r) => isOwner || r.name !== 'Owner')
                      .map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.name} ({r.scope} scope)
                        </option>
                      ))}
                  </select>
                </div>
                {!isOwner && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>
                    Note: Only the organization primary Owner can assign the Owner role.
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Departments Modal */}
      {showDeptModal && selectedMember && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Assign Departments for {selectedMember.userId?.name}</h3>
              <button className="btn-icon" onClick={() => setShowDeptModal(false)}>✕</button>
            </div>
            <form onSubmit={handleDeptChange}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {departments.map((dept) => (
                    <label
                      key={dept._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.65rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={targetDeptIds.includes(dept._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTargetDeptIds([...targetDeptIds, dept._id]);
                          } else {
                            setTargetDeptIds(targetDeptIds.filter((id) => id !== dept._id));
                          }
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{dept.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{dept.description || 'Department'}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeptModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Departments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
