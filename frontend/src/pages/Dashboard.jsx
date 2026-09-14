import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMembers } from '../slices/memberSlice';
import { fetchDepartments } from '../slices/departmentSlice';
import { fetchRoles } from '../slices/roleSlice';
import { fetchPosts } from '../slices/postSlice';
import { fetchAuditLogs } from '../slices/auditLogSlice';
import {
  Users,
  Layers,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
  Shield,
  Clock,
  Sparkles
} from 'lucide-react';

export const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { activeOrg, activeRole, isOwner, permissions } = useSelector((state) => state.organization);

  const { members } = useSelector((state) => state.members);
  const { departments } = useSelector((state) => state.departments);
  const { roles } = useSelector((state) => state.roles);
  const { posts } = useSelector((state) => state.posts);
  const { logs } = useSelector((state) => state.auditLogs);

  useEffect(() => {
    if (activeOrg?._id) {
      dispatch(fetchMembers({ orgId: activeOrg._id }));
      dispatch(fetchDepartments(activeOrg._id));
      dispatch(fetchRoles(activeOrg._id));
      dispatch(fetchPosts({ orgId: activeOrg._id, filter: 'all' }));
      dispatch(fetchAuditLogs({ orgId: activeOrg._id, page: 1 }));
    }
  }, [activeOrg?._id, dispatch]);

  if (!activeOrg) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <Shield size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
        <h2>No Active Organization</h2>
        <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          Please select or create an organization workspace from the header dropdown to start collaborating.
        </p>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Members', value: members.length || 0, icon: Users, color: '#6366f1', link: '/members' },
    { title: 'Departments', value: departments.length || 0, icon: Layers, color: '#0ea5e9', link: '/departments' },
    { title: 'Configured Roles', value: roles.length || 0, icon: ShieldCheck, color: '#a855f7', link: '/roles' },
    { title: 'Active Posts', value: posts.length || 0, icon: MessageSquare, color: '#ec4899', link: '/posts' }
  ];

  return (
    <div>
      {/* Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.25)',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--primary-glow)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.75rem' }}>
              <Sparkles size={14} /> MULTI-TENANT ISOLATED WORKSPACE
            </div>
            <h1>Welcome back, {user?.name}</h1>
            <p style={{ marginTop: '0.25rem' }}>
              You are authenticated into <strong>{activeOrg.name}</strong> as{' '}
              <span className="badge badge-primary">{activeRole?.name || 'Member'}</span>
              {isOwner && <span className="badge badge-warning" style={{ marginLeft: '0.5rem' }}>Primary Owner</span>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/posts" className="btn btn-primary">
              <MessageSquare size={16} /> View Feed
            </Link>
            {isOwner && (
              <Link to="/settings" className="btn btn-secondary">
                Organization Settings
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link key={i} to={stat.link} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    background: `${stat.color}20`,
                    border: `1px solid ${stat.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon size={24} color={stat.color} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: '600' }}>{stat.title}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', lineHeight: '1.2' }}>{stat.value}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Two Column Layout: Feed & RBAC Permissions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Recent Announcements */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3>Recent Announcements</h3>
            <Link to="/posts" style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {posts.length === 0 ? (
            <p style={{ fontSize: '0.85rem' }}>No announcements published yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {posts.slice(0, 3).map((post) => (
                <div
                  key={post._id}
                  style={{
                    padding: '0.85rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <h4 style={{ fontSize: '0.9rem' }}>{post.title}</h4>
                    <span className={`badge ${post.visibility === 'organization' ? 'badge-primary' : post.visibility === 'department' ? 'badge-info' : 'badge-warning'}`}>
                      {post.visibility}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', lineHeight: '1.4', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.description}
                  </p>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                    By {post.authorId?.name || 'Member'} • {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User's Effective Permissions in Current Organization */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3>Your Effective Permissions</h3>
            <span className="badge badge-success">
              {isOwner ? 'Full Root Access' : `${permissions.length} Action Grants`}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
            Permissions evaluated dynamically from role <strong>{activeRole?.name}</strong> (Scope: <code>{activeRole?.scope || 'organization'}</code>).
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '240px', overflowY: 'auto' }}>
            {isOwner ? (
              <div style={{ padding: '0.75rem', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: 'var(--radius-md)', width: '100%' }}>
                <strong style={{ color: '#c084fc' }}>Full Organization Access:</strong> As the organization Owner, you hold unconditional rights to create, read, update, assign, and delete all resources within this tenant boundary.
              </div>
            ) : permissions.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>No direct permissions assigned.</p>
            ) : (
              permissions.map((perm) => (
                <span
                  key={perm}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.725rem',
                    fontFamily: 'monospace',
                    color: 'var(--text-muted)'
                  }}
                >
                  {perm}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Audit Timeline Preview */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3>Recent Organization Activity</h3>
          <Link to="/audit-logs" style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Full Audit Logs <ArrowRight size={14} />
          </Link>
        </div>
        {logs.length === 0 ? (
          <p style={{ fontSize: '0.85rem' }}>No recent audit activity recorded.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 5).map((log) => (
                  <tr key={log._id}>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{log.actorId?.name || 'System'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{log.actorId?.email}</div>
                    </td>
                    <td>
                      <span className="badge badge-info">{log.action}</span>
                    </td>
                    <td>{log.resourceType}</td>
                    <td style={{ fontSize: '0.85rem' }}>{log.targetUserId?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
