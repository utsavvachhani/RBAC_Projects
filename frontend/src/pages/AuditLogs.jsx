import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAuditLogs } from '../slices/auditLogSlice';
import { History, Search, Shield, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export const AuditLogs = () => {
  const dispatch = useDispatch();
  const { activeOrg } = useSelector((state) => state.organization);
  const { logs, total, page, totalPages, loading } = useSelector((state) => state.auditLogs);

  const [selectedAction, setSelectedAction] = useState('');
  const [selectedResource, setSelectedResource] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (activeOrg?._id) {
      dispatch(
        fetchAuditLogs({
          orgId: activeOrg._id,
          filters: { action: selectedAction, resourceType: selectedResource },
          page: currentPage
        })
      );
    }
  }, [activeOrg?._id, selectedAction, selectedResource, currentPage, dispatch]);

  const getActionBadge = (action) => {
    if (action.includes('CREATED') || action.includes('JOINED') || action.includes('SUCCESS')) {
      return 'badge-success';
    }
    if (action.includes('UPDATED') || action.includes('ASSIGNED') || action.includes('CHANGED')) {
      return 'badge-info';
    }
    if (action.includes('DELETED') || action.includes('REMOVED') || action.includes('FAILED') || action.includes('SUSPENDED')) {
      return 'badge-danger';
    }
    return 'badge-primary';
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>Security Audit Logs</h2>
        <p>Immutable audit trail documenting authentication, authorization shifts, and sensitive tenant mutations.</p>
      </div>

      {/* Filter Header */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <select
            className="form-select"
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Action Types</option>
            <option value="ORGANIZATION_CREATED">ORGANIZATION_CREATED</option>
            <option value="MEMBER_CREATED">MEMBER_CREATED</option>
            <option value="MEMBER_INVITED">MEMBER_INVITED</option>
            <option value="MEMBER_JOINED">MEMBER_JOINED</option>
            <option value="ROLE_ASSIGNED">ROLE_ASSIGNED</option>
            <option value="ROLE_CHANGED">ROLE_CHANGED</option>
            <option value="ROLE_CREATED">ROLE_CREATED</option>
            <option value="DEPARTMENT_CREATED">DEPARTMENT_CREATED</option>
            <option value="POST_CREATED">POST_CREATED</option>
            <option value="MEMBER_SUSPENDED">MEMBER_SUSPENDED</option>
            <option value="MEMBER_REMOVED">MEMBER_REMOVED</option>
          </select>

          <select
            className="form-select"
            value={selectedResource}
            onChange={(e) => {
              setSelectedResource(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Resource Types</option>
            <option value="organization">Organization</option>
            <option value="member">Member</option>
            <option value="role">Role</option>
            <option value="department">Department</option>
            <option value="post">Post</option>
            <option value="invitation">Invitation</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Target User</th>
              <th>IP Address</th>
              <th>Event Metadata</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-dim)' }}>
                  No audit logs recorded for these filter settings.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id}>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{log.actorId?.name || 'System Actor'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{log.actorId?.email}</div>
                  </td>
                  <td>
                    <span className={`badge ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>
                    {log.resourceType}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {log.targetUserId?.name ? (
                      <div>
                        <div>{log.targetUserId.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{log.targetUserId.email}</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>-</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-dim)' }}>
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                  <td>
                    <div
                      style={{
                        maxWidth: '260px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        color: 'var(--text-muted)'
                      }}
                      title={JSON.stringify(log.metadata)}
                    >
                      {JSON.stringify(log.metadata)}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
