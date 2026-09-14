import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Users,
  Layers,
  ShieldCheck,
  MessageSquare,
  Mail,
  History,
  Settings,
  ShieldAlert,
  Shield
} from 'lucide-react';

export const Sidebar = () => {
  const { activeOrg, activeRole, isOwner, permissions } = useSelector((state) => state.organization);

  const canAccess = (perm) => {
    if (isOwner) return true;
    if (!permissions || !Array.isArray(permissions)) return false;
    return permissions.includes(perm);
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, exact: true },
    { label: 'Members', path: '/members', icon: Users, perm: 'member.read' },
    { label: 'Departments', path: '/departments', icon: Layers, perm: 'department.read' },
    { label: 'Roles & Permissions', path: '/roles', icon: ShieldCheck, perm: 'role.read' },
    { label: 'Posts & Feed', path: '/posts', icon: MessageSquare, perm: 'post.read' },
    { label: 'Invitations', path: '/invitations', icon: Mail, perm: 'member.invite' },
    { label: 'Audit Logs', path: '/audit-logs', icon: History, perm: 'audit.read' },
    { label: 'Settings', path: '/settings', icon: Settings, perm: 'settings.read' }
  ];

  const getRoleBadgeStyle = (roleName) => {
    switch (roleName) {
      case 'Owner':
        return { background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' };
      case 'Admin':
        return { background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' };
      case 'Department Manager':
        return { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' };
      default:
        return { background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' };
    }
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px var(--primary-glow)'
          }}
        >
          <Shield size={22} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: '800', fontSize: '1.1rem', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            OmniRBAC
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: '600', letterSpacing: '0.05em' }}>
            MULTI-TENANT
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-dim)', padding: '0.5rem 0.75rem', letterSpacing: '0.06em' }}>
          PLATFORM
        </div>

        {navItems.map((item) => {
          // If permission is required and user lacks it, we can either hide or show locked
          if (item.perm && !canAccess(item.perm)) {
            return null; // Don't clutter sidebar with forbidden pages
          }

          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                color: isActive ? '#fff' : 'var(--text-muted)',
                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                fontWeight: isActive ? '600' : '500',
                fontSize: '0.875rem',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent'
              })}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Active Role Card at Bottom */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
          CURRENT TENANT ROLE
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-main)' }}>
            {activeOrg?.name ? (activeOrg.name.length > 15 ? activeOrg.name.substring(0, 15) + '...' : activeOrg.name) : 'No Organization'}
          </div>
          <span
            className="badge"
            style={getRoleBadgeStyle(activeRole?.name || 'Member')}
          >
            {activeRole?.name || 'Member'}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
