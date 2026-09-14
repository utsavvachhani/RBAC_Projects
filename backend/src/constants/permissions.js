const PERMISSION_KEYS = {
  ORGANIZATION_READ: 'organization.read',
  ORGANIZATION_UPDATE: 'organization.update',
  ORGANIZATION_DELETE: 'organization.delete',

  MEMBER_CREATE: 'member.create',
  MEMBER_READ: 'member.read',
  MEMBER_UPDATE: 'member.update',
  MEMBER_DELETE: 'member.delete',
  MEMBER_INVITE: 'member.invite',
  MEMBER_REMOVE: 'member.remove',

  DEPARTMENT_CREATE: 'department.create',
  DEPARTMENT_READ: 'department.read',
  DEPARTMENT_UPDATE: 'department.update',
  DEPARTMENT_DELETE: 'department.delete',

  ROLE_CREATE: 'role.create',
  ROLE_READ: 'role.read',
  ROLE_UPDATE: 'role.update',
  ROLE_DELETE: 'role.delete',
  ROLE_ASSIGN: 'role.assign',

  POST_CREATE: 'post.create',
  POST_READ: 'post.read',
  POST_UPDATE: 'post.update',
  POST_DELETE: 'post.delete',

  AUDIT_READ: 'audit.read',

  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update'
};

const SYSTEM_PERMISSIONS = [
  // Organization
  { resource: 'organization', action: 'read', key: 'organization.read', description: 'View organization details' },
  { resource: 'organization', action: 'update', key: 'organization.update', description: 'Update organization settings' },
  { resource: 'organization', action: 'delete', key: 'organization.delete', description: 'Delete organization' },

  // Member
  { resource: 'member', action: 'create', key: 'member.create', description: 'Directly create new members' },
  { resource: 'member', action: 'read', key: 'member.read', description: 'View member listings and profiles' },
  { resource: 'member', action: 'update', key: 'member.update', description: 'Update member status and info' },
  { resource: 'member', action: 'delete', key: 'member.delete', description: 'Permanently remove members' },
  { resource: 'member', action: 'invite', key: 'member.invite', description: 'Send invitations to new members' },
  { resource: 'member', action: 'remove', key: 'member.remove', description: 'Remove members from organization' },

  // Department
  { resource: 'department', action: 'create', key: 'department.create', description: 'Create new departments' },
  { resource: 'department', action: 'read', key: 'department.read', description: 'View department details and teams' },
  { resource: 'department', action: 'update', key: 'department.update', description: 'Update department info and managers' },
  { resource: 'department', action: 'delete', key: 'department.delete', description: 'Delete departments' },

  // Role
  { resource: 'role', action: 'create', key: 'role.create', description: 'Create custom roles' },
  { resource: 'role', action: 'read', key: 'role.read', description: 'View available roles and permissions' },
  { resource: 'role', action: 'update', key: 'role.update', description: 'Modify custom role definitions' },
  { resource: 'role', action: 'delete', key: 'role.delete', description: 'Delete custom roles' },
  { resource: 'role', action: 'assign', key: 'role.assign', description: 'Assign roles to members' },

  // Post
  { resource: 'post', action: 'create', key: 'post.create', description: 'Create posts and announcements' },
  { resource: 'post', action: 'read', key: 'post.read', description: 'Read posts' },
  { resource: 'post', action: 'update', key: 'post.update', description: 'Edit existing posts' },
  { resource: 'post', action: 'delete', key: 'post.delete', description: 'Delete posts' },

  // Audit
  { resource: 'audit', action: 'read', key: 'audit.read', description: 'View organization audit logs' },

  // Settings
  { resource: 'settings', action: 'read', key: 'settings.read', description: 'View organization settings' },
  { resource: 'settings', action: 'update', key: 'settings.update', description: 'Modify organization settings' }
];

module.exports = {
  PERMISSION_KEYS,
  SYSTEM_PERMISSIONS
};
