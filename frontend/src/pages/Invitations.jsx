import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchInvitations,
  revokeInvitation,
  resendInvitation
} from '../slices/invitationSlice';
import { addToast } from '../slices/uiSlice';
import { Mail, Copy, RefreshCw, XCircle, Clock } from 'lucide-react';

export const Invitations = () => {
  const dispatch = useDispatch();
  const { activeOrg } = useSelector((state) => state.organization);
  const { invitations, loading } = useSelector((state) => state.invitations);

  useEffect(() => {
    if (activeOrg?._id) {
      dispatch(fetchInvitations(activeOrg._id));
    }
  }, [activeOrg?._id, dispatch]);

  const handleCopyLink = (token) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    dispatch(addToast({ message: 'Invitation link copied to clipboard!', type: 'success' }));
  };

  const handleResend = async (invitation) => {
    try {
      await dispatch(resendInvitation({ orgId: activeOrg._id, invitationId: invitation._id })).unwrap();
      dispatch(addToast({ message: 'Invitation renewed and resent', type: 'success' }));
    } catch (err) {
      dispatch(addToast({ message: err || 'Failed to resend invitation', type: 'error' }));
    }
  };

  const handleRevoke = async (invitation) => {
    if (!window.confirm(`Revoke invitation for ${invitation.email}?`)) return;
    try {
      await dispatch(revokeInvitation({ orgId: activeOrg._id, invitationId: invitation._id })).unwrap();
      dispatch(addToast({ message: 'Invitation revoked', type: 'info' }));
    } catch (err) {
      dispatch(addToast({ message: err || 'Failed to revoke invitation', type: 'error' }));
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>Invitation Management</h2>
        <p>Monitor pending member invitations, copy direct join links, and manage validity.</p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Invitee Email</th>
              <th>Role</th>
              <th>Departments</th>
              <th>Invited By</th>
              <th>Status</th>
              <th>Expires At</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invitations.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-dim)' }}>
                  No invitations recorded for this organization.
                </td>
              </tr>
            ) : (
              invitations.map((inv) => (
                <tr key={inv._id}>
                  <td style={{ fontWeight: '600' }}>{inv.email}</td>
                  <td>
                    <span className="badge badge-primary">{inv.roleId?.name || 'Role'}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {inv.departmentIds?.length > 0 ? (
                        inv.departmentIds.map((d) => (
                          <span
                            key={d._id}
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              padding: '0.15rem 0.45rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.725rem'
                            }}
                          >
                            {d.name}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>None</span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{inv.invitedBy?.name || 'Admin'}</td>
                  <td>
                    <span
                      className={`badge ${
                        inv.status === 'accepted'
                          ? 'badge-success'
                          : inv.status === 'pending'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      {inv.status === 'pending' && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Copy Direct Link"
                            onClick={() => handleCopyLink(inv.token)}
                          >
                            <Copy size={14} /> Copy Link
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Renew / Resend"
                            onClick={() => handleResend(inv)}
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            title="Revoke Invitation"
                            onClick={() => handleRevoke(inv)}
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Invitations;
