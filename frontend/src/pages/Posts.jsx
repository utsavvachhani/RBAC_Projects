import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchPosts, createPost, updatePost, deletePost } from '../slices/postSlice';
import { fetchDepartments } from '../slices/departmentSlice';
import { addToast } from '../slices/uiSlice';
import { Can } from '../components/auth/Can';
import { MessageSquare, Plus, Globe, Building, Lock, Trash2, Edit3, User } from 'lucide-react';

export const Posts = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { activeOrg, activeRole, isOwner } = useSelector((state) => state.organization);
  const { posts, loading } = useSelector((state) => state.posts);
  const { departments } = useSelector((state) => state.departments);

  const [activeTab, setActiveTab] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('organization');
  const [departmentId, setDepartmentId] = useState('');

  useEffect(() => {
    if (activeOrg?._id) {
      dispatch(fetchPosts({ orgId: activeOrg._id, filter: activeTab }));
      dispatch(fetchDepartments(activeOrg._id));
    }
  }, [activeOrg?._id, activeTab, dispatch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        createPost({
          orgId: activeOrg._id,
          postData: {
            title,
            description,
            visibility,
            departmentId: visibility === 'department' ? departmentId : null
          }
        })
      ).unwrap();
      dispatch(addToast({ message: 'Announcement published successfully', type: 'success' }));
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      dispatch(addToast({ message: err || 'Failed to publish post', type: 'error' }));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedPost) return;
    try {
      await dispatch(
        updatePost({
          orgId: activeOrg._id,
          postId: selectedPost._id,
          postData: {
            title,
            description,
            visibility,
            departmentId: visibility === 'department' ? departmentId : null
          }
        })
      ).unwrap();
      dispatch(addToast({ message: 'Post updated successfully', type: 'success' }));
      setShowEditModal(false);
      resetForm();
    } catch (err) {
      dispatch(addToast({ message: err || 'Failed to update post', type: 'error' }));
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm(`Are you sure you want to delete '${post.title}'?`)) return;
    try {
      await dispatch(deletePost({ orgId: activeOrg._id, postId: post._id })).unwrap();
      dispatch(addToast({ message: 'Post deleted', type: 'success' }));
    } catch (err) {
      dispatch(addToast({ message: err || 'Failed to delete post', type: 'error' }));
    }
  };

  const openEditModal = (post) => {
    setSelectedPost(post);
    setTitle(post.title);
    setDescription(post.description);
    setVisibility(post.visibility);
    setDepartmentId(post.departmentId?._id || '');
    setShowEditModal(true);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setVisibility('organization');
    setDepartmentId('');
    setSelectedPost(null);
  };

  const canModifyPost = (post) => {
    if (isOwner) return true;
    if (post.authorId?._id === user?._id) return true;
    if (activeRole?.name === 'Admin') return true;
    return false;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Posts & Internal Announcements</h2>
          <p>Multi-scope internal communications filtered strictly by your role and department authority.</p>
        </div>
        <Can permission="post.create">
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            <Plus size={16} /> Publish Post
          </button>
        </Can>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-item ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Permitted Posts
        </button>
        <button
          className={`tab-item ${activeTab === 'organization' ? 'active' : ''}`}
          onClick={() => setActiveTab('organization')}
        >
          Organization-Wide
        </button>
        <button
          className={`tab-item ${activeTab === 'department' ? 'active' : ''}`}
          onClick={() => setActiveTab('department')}
        >
          My Department
        </button>
        <button
          className={`tab-item ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          Personal Notes
        </button>
      </div>

      {/* Posts Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {posts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <MessageSquare size={40} color="var(--text-dim)" style={{ marginBottom: '1rem' }} />
            <h3>No Posts Found</h3>
            <p style={{ marginTop: '0.5rem' }}>
              No announcements match this visibility category for your current permissions.
            </p>
          </div>
        ) : (
          posts.map((post) => {
            const isPersonal = post.visibility === 'personal';
            const isDept = post.visibility === 'department';
            const isOrg = post.visibility === 'organization';

            return (
              <div key={post._id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>{post.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className={`badge ${isOrg ? 'badge-primary' : isDept ? 'badge-info' : 'badge-warning'}`}>
                        {isOrg && <Globe size={12} />}
                        {isDept && <Building size={12} />}
                        {isPersonal && <Lock size={12} />}
                        {post.visibility}
                      </span>
                      {isDept && post.departmentId && (
                        <span className="badge badge-secondary" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          Dept: {post.departmentId.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {canModifyPost(post) && (
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <Can permission="post.update">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(post)}>
                          <Edit3 size={14} />
                        </button>
                      </Can>
                      <Can permission="post.delete">
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(post)}>
                          <Trash2 size={14} />
                        </button>
                      </Can>
                    </div>
                  )}
                </div>

                <p style={{ fontSize: '0.925rem', whiteSpace: 'pre-wrap', marginBottom: '1rem', color: '#cbd5e1' }}>
                  {post.description}
                </p>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={12} />
                    </div>
                    <span>{post.authorId?.name || 'Unknown Author'}</span>
                  </div>
                  <div>{new Date(post.createdAt).toLocaleString()}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Post Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{showEditModal ? 'Edit Post' : 'Publish New Post'}</h3>
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
                  <label className="form-label">Post Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Q4 Sprint Planning"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Content / Description *</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Write announcement details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ minHeight: '120px' }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Target Visibility *</label>
                  <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.35rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="visibility"
                        value="organization"
                        checked={visibility === 'organization'}
                        onChange={(e) => setVisibility(e.target.value)}
                      />
                      Organization
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="visibility"
                        value="department"
                        checked={visibility === 'department'}
                        onChange={(e) => setVisibility(e.target.value)}
                      />
                      Department
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="visibility"
                        value="personal"
                        checked={visibility === 'personal'}
                        onChange={(e) => setVisibility(e.target.value)}
                      />
                      Personal
                    </label>
                  </div>
                </div>

                {visibility === 'department' && (
                  <div className="form-group">
                    <label className="form-label">Select Target Department *</label>
                    <select
                      className="form-select"
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                )}
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
                  {showEditModal ? 'Save Post' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Posts;
