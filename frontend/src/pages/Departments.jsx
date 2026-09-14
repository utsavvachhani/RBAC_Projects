import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from '../slices/departmentSlice';
import { fetchMembers } from '../slices/memberSlice';
import { addToast } from '../slices/uiSlice';
import { Can } from '../components/auth/Can';
import { Layers, Plus, Users, User, Trash2, Edit3 } from 'lucide-react';

export const Departments = () => {
  const dispatch = useDispatch();
  const { activeOrg } = useSelector((state) => state.organization);
  const { departments, loading } = useSelector((state) => state.departments);
  const { members } = useSelector((state) => state.members);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [managerIds, setManagerIds] = useState([]);

  useEffect(() => {
    if (activeOrg?._id) {
      dispatch(fetchDepartments(activeOrg._id));
      dispatch(fetchMembers({ orgId: activeOrg._id }));
    }
  }, [activeOrg?._id, dispatch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        createDepartment({
          orgId: activeOrg._id,
          deptData: { name, description, managerIds }
        })
      ).unwrap();
      dispatch(addToast({ message: `Department '${name}' created`, type: 'success' }));
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      dispatch(addToast({ message: err || 'Failed to create department', type: 'error' }));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedDept) return;
    try {
      await dispatch(
        updateDepartment({
          orgId: activeOrg._id,
          departmentId: selectedDept._id,
          deptData: { name, description, managerIds }
        })
      ).unwrap();
      dispatch(addToast({ message: 'Department updated successfully', type: 'success' }));
      setShowEditModal(false);
      resetForm();
    } catch (err) {
      dispatch(addToast({ message: err || 'Failed to update department', type: 'error' }));
    }
  };

  const handleDelete = async (dept) => {
    if (!window.confirm(`Are you sure you want to delete department '${dept.name}'?`)) return;
    try {
      await dispatch(deleteDepartment({ orgId: activeOrg._id, departmentId: dept._id })).unwrap();
      dispatch(addToast({ message: `Department '${dept.name}' deleted`, type: 'success' }));
    } catch (err) {
      dispatch(addToast({ message: err || 'Failed to delete department', type: 'error' }));
    }
  };

  const openEditModal = (dept) => {
    setSelectedDept(dept);
    setName(dept.name);
    setDescription(dept.description || '');
    setManagerIds((dept.managerIds || []).map((m) => m._id));
    setShowEditModal(true);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setManagerIds([]);
    setSelectedDept(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Organization Departments</h2>
          <p>Organize teams, assign departmental managers, and scope access boundaries.</p>
        </div>
        <Can permission="department.create">
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            <Plus size={16} /> Create Department
          </button>
        </Can>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {departments.map((dept) => (
          <div key={dept._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(14, 165, 233, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={18} color="#0ea5e9" />
                  </div>
                  <h3 style={{ fontSize: '1.15rem' }}>{dept.name}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  <Users size={14} /> {dept.memberCount || 0} members
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>{dept.description || 'No description provided.'}</p>

              <div>
                <div style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Assigned Managers ({dept.managerIds?.length || 0})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {dept.managerIds?.length > 0 ? (
                    dept.managerIds.map((mgr) => (
                      <span
                        key={mgr._id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-subtle)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem'
                        }}
                      >
                        <User size={12} color="#0ea5e9" /> {mgr.name}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>No managers assigned</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Can permission="department.update">
                <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(dept)}>
                  <Edit3 size={14} /> Edit
                </button>
              </Can>
              <Can permission="department.delete">
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(dept)}>
                  <Trash2 size={14} />
                </button>
              </Can>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{showEditModal ? `Edit Department: ${selectedDept?.name}` : 'Create Department'}</h3>
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
            <form onSubmit={showEditModal ? handleUpdate : handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Department Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Engineering, Marketing, Finance"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Describe the department responsibilities and squad members"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assign Department Managers</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {members.map((m) => {
                      const checked = managerIds.includes(m.userId?._id);
                      return (
                        <label key={m._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setManagerIds([...managerIds, m.userId?._id]);
                              } else {
                                setManagerIds(managerIds.filter((id) => id !== m.userId?._id));
                              }
                            }}
                          />
                          <span>{m.userId?.name} ({m.roleId?.name})</span>
                        </label>
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
                  {showEditModal ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
