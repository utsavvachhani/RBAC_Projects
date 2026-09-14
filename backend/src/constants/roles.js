const { PERMISSION_KEYS } = require('./permissions');

const SYSTEM_ROLE_NAMES = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  DEPARTMENT_MANAGER: 'Department Manager',
  MEMBER: 'Member'
};

const DEFAULT_ROLE_DEFINITIONS = [
  {
    name: SYSTEM_ROLE_NAMES.OWNER,
    description: 'Full organization access and highest administrative authority',
    isSystemRole: true,
    scope: 'organization',
    permissions: Object.values(PERMISSION_KEYS)
  },
  {
    name: SYSTEM_ROLE_NAMES.ADMIN,
    description: 'Broad organization management capabilities excluding destructive ownership actions',
    isSystemRole: true,
    scope: 'organization',
    permissions: [
      PERMISSION_KEYS.ORGANIZATION_READ,
      PERMISSION_KEYS.ORGANIZATION_UPDATE,
      PERMISSION_KEYS.MEMBER_CREATE,
      PERMISSION_KEYS.MEMBER_READ,
      PERMISSION_KEYS.MEMBER_UPDATE,
      PERMISSION_KEYS.MEMBER_INVITE,
      PERMISSION_KEYS.MEMBER_REMOVE,
      PERMISSION_KEYS.DEPARTMENT_CREATE,
      PERMISSION_KEYS.DEPARTMENT_READ,
      PERMISSION_KEYS.DEPARTMENT_UPDATE,
      PERMISSION_KEYS.ROLE_READ,
      PERMISSION_KEYS.ROLE_ASSIGN,
      PERMISSION_KEYS.POST_CREATE,
      PERMISSION_KEYS.POST_READ,
      PERMISSION_KEYS.POST_UPDATE,
      PERMISSION_KEYS.POST_DELETE,
      PERMISSION_KEYS.AUDIT_READ,
      PERMISSION_KEYS.SETTINGS_READ
    ]
  },
  {
    name: SYSTEM_ROLE_NAMES.DEPARTMENT_MANAGER,
    description: 'Departmental management operations within assigned department scope',
    isSystemRole: true,
    scope: 'department',
    permissions: [
      PERMISSION_KEYS.ORGANIZATION_READ,
      PERMISSION_KEYS.DEPARTMENT_READ,
      PERMISSION_KEYS.DEPARTMENT_UPDATE,
      PERMISSION_KEYS.MEMBER_READ,
      PERMISSION_KEYS.MEMBER_CREATE,
      PERMISSION_KEYS.MEMBER_INVITE,
      PERMISSION_KEYS.POST_CREATE,
      PERMISSION_KEYS.POST_READ,
      PERMISSION_KEYS.POST_UPDATE,
      PERMISSION_KEYS.POST_DELETE
    ]
  },
  {
    name: SYSTEM_ROLE_NAMES.MEMBER,
    description: 'Standard member with basic reading and publishing access',
    isSystemRole: true,
    scope: 'organization',
    permissions: [
      PERMISSION_KEYS.ORGANIZATION_READ,
      PERMISSION_KEYS.MEMBER_READ,
      PERMISSION_KEYS.DEPARTMENT_READ,
      PERMISSION_KEYS.POST_CREATE,
      PERMISSION_KEYS.POST_READ,
      PERMISSION_KEYS.POST_UPDATE,
      PERMISSION_KEYS.POST_DELETE
    ]
  }
];

module.exports = {
  SYSTEM_ROLE_NAMES,
  DEFAULT_ROLE_DEFINITIONS
};
