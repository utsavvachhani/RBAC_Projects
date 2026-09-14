const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Organization = require('../models/Organization');
const Role = require('../models/Role');
const Department = require('../models/Department');
const Membership = require('../models/Membership');
const Post = require('../models/Post');
const AuditLog = require('../models/AuditLog');
const LoginActivity = require('../models/LoginActivity');
const Permission = require('../models/Permission');

const { PERMISSION_KEYS, SYSTEM_PERMISSIONS } = require('../constants/permissions');
const { DEFAULT_ROLE_DEFINITIONS, SYSTEM_ROLE_NAMES } = require('../constants/roles');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const env = require('../config/environment');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await mongoose.connect(env.MONGO_URI);
    console.log('[Seed] Connected. Wiping existing database records...');

    // Drop database to start completely fresh in seed environment
    await mongoose.connection.db.dropDatabase();
    console.log('[Seed] Database dropped and reset.');

    console.log('[Seed] Seeding Permission catalogue...');
    await Permission.insertMany(SYSTEM_PERMISSIONS);

    console.log('[Seed] Creating seed Users...');
    const defaultPassword = 'Password123!';
    const passwordHash = await User.hashPassword(defaultPassword);

    const utsav = await User.create({
      name: 'Utsav Vachhani',
      email: 'utsav@example.com',
      passwordHash,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    });

    const rahul = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      passwordHash,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    });

    const harsh = await User.create({
      name: 'Harsh Patel',
      email: 'harsh@example.com',
      passwordHash,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
    });

    const jay = await User.create({
      name: 'Jay Dave',
      email: 'jay@example.com',
      passwordHash,
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150'
    });

    const alice = await User.create({
      name: 'Alice Johnson',
      email: 'alice@example.com',
      passwordHash,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    });

    console.log('[Seed] Creating Organizations...');
    // Org A: Acme Innovations (Owner: Utsav)
    const orgA = await Organization.create({
      name: 'Acme Innovations',
      slug: 'acme-innovations',
      description: 'Next-gen enterprise software and cloud robotics',
      ownerId: utsav._id
    });

    // Org B: Nexus Labs (Owner: Alice)
    const orgB = await Organization.create({
      name: 'Nexus Labs',
      slug: 'nexus-labs',
      description: 'Distributed AI and multi-agent infrastructure',
      ownerId: alice._id
    });

    console.log('[Seed] Seeding Roles for Organizations...');
    const seedRolesForOrg = async (orgId, ownerId) => {
      const roles = {};
      for (const def of DEFAULT_ROLE_DEFINITIONS) {
        const role = await Role.create({
          name: def.name,
          description: def.description,
          organizationId: orgId,
          permissions: def.permissions,
          scope: def.scope,
          isSystemRole: true,
          createdBy: ownerId
        });
        roles[def.name] = role;
      }
      return roles;
    };

    const rolesOrgA = await seedRolesForOrg(orgA._id, utsav._id);
    const rolesOrgB = await seedRolesForOrg(orgB._id, alice._id);

    // Custom Role in Org A: Content Manager
    const contentManagerRoleOrgA = await Role.create({
      name: 'Content Manager',
      description: 'Specialized role for internal announcements and newsletter publications',
      organizationId: orgA._id,
      permissions: [
        PERMISSION_KEYS.ORGANIZATION_READ,
        PERMISSION_KEYS.POST_CREATE,
        PERMISSION_KEYS.POST_READ,
        PERMISSION_KEYS.POST_UPDATE,
        PERMISSION_KEYS.MEMBER_READ
      ],
      scope: 'organization',
      isSystemRole: false,
      createdBy: utsav._id
    });

    // Custom Role in Org B: Compliance Auditor
    const auditorRoleOrgB = await Role.create({
      name: 'Compliance Auditor',
      description: 'Audit logs viewer with read-only inspection capabilities',
      organizationId: orgB._id,
      permissions: [
        PERMISSION_KEYS.ORGANIZATION_READ,
        PERMISSION_KEYS.AUDIT_READ,
        PERMISSION_KEYS.MEMBER_READ,
        PERMISSION_KEYS.DEPARTMENT_READ
      ],
      scope: 'organization',
      isSystemRole: false,
      createdBy: alice._id
    });

    console.log('[Seed] Seeding Departments...');
    // Departments Org A
    const deptEngineeringA = await Department.create({
      organizationId: orgA._id,
      name: 'Engineering',
      description: 'Core product engineering and platform architecture',
      managerIds: [harsh._id],
      createdBy: utsav._id
    });

    const deptMarketingA = await Department.create({
      organizationId: orgA._id,
      name: 'Marketing',
      description: 'Product marketing and brand strategy',
      managerIds: [rahul._id],
      createdBy: utsav._id
    });

    const deptHRA = await Department.create({
      organizationId: orgA._id,
      name: 'Human Resources',
      description: 'People operations, talent acquisition and culture',
      managerIds: [utsav._id],
      createdBy: utsav._id
    });

    // Departments Org B
    const deptResearchB = await Department.create({
      organizationId: orgB._id,
      name: 'AI Research',
      description: 'Fundamental frontier model research and experiments',
      managerIds: [alice._id],
      createdBy: alice._id
    });

    const deptInfrastructureB = await Department.create({
      organizationId: orgB._id,
      name: 'Cloud Infrastructure',
      description: 'High-performance GPU cluster engineering',
      managerIds: [utsav._id],
      createdBy: alice._id
    });

    console.log('[Seed] Seeding Memberships (including cross-org memberships)...');
    // Org A Memberships:
    // Utsav -> Owner
    await Membership.create({
      userId: utsav._id,
      organizationId: orgA._id,
      roleId: rolesOrgA[SYSTEM_ROLE_NAMES.OWNER]._id,
      departmentIds: [deptEngineeringA._id, deptMarketingA._id, deptHRA._id],
      status: 'active',
      joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    });

    // Rahul -> Admin
    await Membership.create({
      userId: rahul._id,
      organizationId: orgA._id,
      roleId: rolesOrgA[SYSTEM_ROLE_NAMES.ADMIN]._id,
      departmentIds: [deptMarketingA._id],
      status: 'active',
      invitedBy: utsav._id,
      joinedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
    });

    // Harsh -> Department Manager (Engineering)
    await Membership.create({
      userId: harsh._id,
      organizationId: orgA._id,
      roleId: rolesOrgA[SYSTEM_ROLE_NAMES.DEPARTMENT_MANAGER]._id,
      departmentIds: [deptEngineeringA._id],
      status: 'active',
      invitedBy: utsav._id,
      joinedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    });

    // Jay -> Custom Role (Content Manager)
    await Membership.create({
      userId: jay._id,
      organizationId: orgA._id,
      roleId: contentManagerRoleOrgA._id,
      departmentIds: [deptMarketingA._id],
      status: 'active',
      invitedBy: rahul._id,
      joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    });

    // Org B Memberships:
    // Alice -> Owner
    await Membership.create({
      userId: alice._id,
      organizationId: orgB._id,
      roleId: rolesOrgB[SYSTEM_ROLE_NAMES.OWNER]._id,
      departmentIds: [deptResearchB._id, deptInfrastructureB._id],
      status: 'active',
      joinedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
    });

    // Utsav -> Admin (Cross-organization: Owner in Org A, Admin in Org B!)
    await Membership.create({
      userId: utsav._id,
      organizationId: orgB._id,
      roleId: rolesOrgB[SYSTEM_ROLE_NAMES.ADMIN]._id,
      departmentIds: [deptInfrastructureB._id],
      status: 'active',
      invitedBy: alice._id,
      joinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    });

    // Rahul -> Member (Cross-organization: Admin in Org A, Member in Org B!)
    await Membership.create({
      userId: rahul._id,
      organizationId: orgB._id,
      roleId: rolesOrgB[SYSTEM_ROLE_NAMES.MEMBER]._id,
      departmentIds: [deptResearchB._id],
      status: 'active',
      invitedBy: alice._id,
      joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });

    console.log('[Seed] Seeding Posts with distinct visibilities...');
    // Org A Posts:
    // 1. Organization-wide post
    await Post.create({
      organizationId: orgA._id,
      authorId: utsav._id,
      title: 'Annual All-Hands Meeting & Q4 Roadmap',
      description:
        'We will be conducting our annual company gathering this Friday. We will discuss multi-tenant expansion, security protocols, and celebrate our key milestones.',
      visibility: 'organization'
    });

    // 2. Department post (Engineering)
    await Post.create({
      organizationId: orgA._id,
      departmentId: deptEngineeringA._id,
      authorId: harsh._id,
      title: 'Sprint 24: Distributed RBAC Migration',
      description:
        'All engineering squad leads please review the schema updates for the granular scope authorizer before Friday deployment.',
      visibility: 'department'
    });

    // 3. Department post (Marketing)
    await Post.create({
      organizationId: orgA._id,
      departmentId: deptMarketingA._id,
      authorId: rahul._id,
      title: 'Product Hunt Launch Plan',
      description: 'Final banner assets and copy are ready for review in the marketing drive folder.',
      visibility: 'department'
    });

    // 4. Personal post (Utsav's private notes)
    await Post.create({
      organizationId: orgA._id,
      authorId: utsav._id,
      title: 'Private Founder Notes: Investor Sync',
      description:
        'Confidential notes regarding upcoming Series A conversations. Keep focus on tenant isolation benchmarks.',
      visibility: 'personal'
    });

    // Org B Posts:
    await Post.create({
      organizationId: orgB._id,
      authorId: alice._id,
      title: 'Welcome to Nexus Labs Research Lab',
      description: 'All AI cluster resources are now accessible via SSH certificates.',
      visibility: 'organization'
    });

    console.log('[Seed] Seeding Audit Logs...');
    await AuditLog.create([
      {
        organizationId: orgA._id,
        actorId: utsav._id,
        action: AUDIT_ACTIONS.ORGANIZATION_CREATED,
        resourceType: 'organization',
        resourceId: orgA._id,
        metadata: { name: orgA.name },
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        organizationId: orgA._id,
        actorId: utsav._id,
        action: AUDIT_ACTIONS.MEMBER_INVITED,
        resourceType: 'member',
        targetUserId: rahul._id,
        metadata: { roleName: 'Admin', email: rahul.email },
        timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
      },
      {
        organizationId: orgA._id,
        actorId: utsav._id,
        action: AUDIT_ACTIONS.ROLE_ASSIGNED,
        resourceType: 'role',
        targetUserId: harsh._id,
        metadata: { oldRole: 'Member', newRole: 'Department Manager' },
        timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
      },
      {
        organizationId: orgA._id,
        actorId: harsh._id,
        action: AUDIT_ACTIONS.POST_CREATED,
        resourceType: 'post',
        metadata: { title: 'Sprint 24: Distributed RBAC Migration' },
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ]);

    console.log('[Seed] Seeding Login Activity...');
    await LoginActivity.create([
      {
        userId: utsav._id,
        organizationId: orgA._id,
        event: AUDIT_ACTIONS.LOGIN_SUCCESS,
        ipAddress: '127.0.0.1',
        device: 'MacBook Pro',
        browser: 'Chrome 128.0',
        operatingSystem: 'macOS',
        success: true,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        userId: rahul._id,
        organizationId: orgA._id,
        event: AUDIT_ACTIONS.LOGIN_SUCCESS,
        ipAddress: '127.0.0.1',
        device: 'Desktop',
        browser: 'Firefox 129.0',
        operatingSystem: 'Windows 11',
        success: true,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
      }
    ]);

    console.log('====================================================');
    console.log(' SEED COMPLETED SUCCESSFULLY!');
    console.log('====================================================');
    console.log('Default credentials for testing:');
    console.log('Password for all users: Password123!');
    console.log('');
    console.log('1. Utsav Vachhani  (Owner in Org A, Admin in Org B)   : utsav@example.com');
    console.log('2. Rahul Sharma    (Admin in Org A, Member in Org B)  : rahul@example.com');
    console.log('3. Harsh Patel     (Dept Manager in Org A - Eng)      : harsh@example.com');
    console.log('4. Jay Dave        (Custom Content Mgr in Org A)      : jay@example.com');
    console.log('5. Alice Johnson   (Owner in Org B)                   : alice@example.com');
    console.log('====================================================');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
};

seedData();
