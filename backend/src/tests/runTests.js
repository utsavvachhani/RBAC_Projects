const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Membership = require('../models/Membership');
const Role = require('../models/Role');
const Department = require('../models/Department');
const Post = require('../models/Post');
const postService = require('../services/postService');
const memberService = require('../services/memberService');
const organizationService = require('../services/organizationService');
const env = require('../config/environment');

let passedTests = 0;
let totalTests = 0;

const assert = (condition, testName) => {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
};

const assertThrows = async (fn, testName, expectedStatus = null) => {
  totalTests++;
  try {
    await fn();
    console.error(`  ✗ FAIL: ${testName} (Did not throw)`);
    throw new Error(`Expected failure but succeeded: ${testName}`);
  } catch (error) {
    if (expectedStatus && error.statusCode !== expectedStatus) {
      console.error(`  ✗ FAIL: ${testName} (Expected status ${expectedStatus}, got ${error.statusCode})`);
      throw error;
    }
    console.log(`  ✓ PASS: ${testName} (Caught expected error: ${error.message})`);
    passedTests++;
  }
};

const runSuite = async () => {
  console.log('\n======================================================');
  console.log(' RUNNING RBAC & MULTI-TENANT VERIFICATION TESTS');
  console.log('======================================================\n');

  await mongoose.connect(env.MONGO_URI);

  // 1. Fetch seed entities
  const utsav = await User.findOne({ email: 'utsav@example.com' });
  const rahul = await User.findOne({ email: 'rahul@example.com' });
  const harsh = await User.findOne({ email: 'harsh@example.com' });
  const alice = await User.findOne({ email: 'alice@example.com' });

  const orgA = await Organization.findOne({ slug: 'acme-innovations' });
  const orgB = await Organization.findOne({ slug: 'nexus-labs' });

  const deptEngA = await Department.findOne({ organizationId: orgA._id, name: 'Engineering' });
  const deptMktA = await Department.findOne({ organizationId: orgA._id, name: 'Marketing' });

  console.log('Test Group 1: Multi-Organization & Context Isolation');
  // Test 1.1: Utsav in Org A has Owner role
  const utsavContextA = await organizationService.getOrganizationContext(orgA._id, utsav._id);
  assert(utsavContextA.isOwner === true, 'Utsav is recognized as Owner in Org A');
  assert(utsavContextA.role.name === 'Owner', 'Utsav has Owner role in Org A');

  // Test 1.2: Utsav in Org B has Admin role (different role across organizations!)
  const utsavContextB = await organizationService.getOrganizationContext(orgB._id, utsav._id);
  assert(utsavContextB.isOwner === false, 'Utsav is NOT Owner in Org B');
  assert(utsavContextB.role.name === 'Admin', 'Utsav has Admin role in Org B');

  // Test 1.3: Rahul in Org A is Admin, but in Org B is Member
  const rahulContextA = await organizationService.getOrganizationContext(orgA._id, rahul._id);
  const rahulContextB = await organizationService.getOrganizationContext(orgB._id, rahul._id);
  assert(rahulContextA.role.name === 'Admin', 'Rahul is Admin in Org A');
  assert(rahulContextB.role.name === 'Member', 'Rahul is Member in Org B');

  // Test 1.4: Cross-tenant isolation - User not in Org rejected
  await assertThrows(
    async () => {
      // Harsh belongs to Org A, NOT Org B
      await organizationService.getOrganizationContext(orgB._id, harsh._id);
    },
    'Cross-tenant isolation: Harsh cannot access Org B context',
    403
  );

  console.log('\nTest Group 2: Privilege Escalation Prevention');
  // Test 2.1: Admin (Rahul) cannot assign Owner role to Harsh in Org A
  const ownerRoleOrgA = await Role.findOne({ organizationId: orgA._id, name: 'Owner' });
  const harshMembershipA = await Membership.findOne({ userId: harsh._id, organizationId: orgA._id });

  await assertThrows(
    async () => {
      await memberService.assignRole({
        orgId: orgA._id,
        memberId: harshMembershipA._id,
        newRoleId: ownerRoleOrgA._id,
        actorId: rahul._id // Rahul is Admin, not Owner
      });
    },
    'Privilege Escalation: Admin cannot assign Owner role',
    403
  );

  // Test 2.2: Cannot remove the primary organization Owner
  const utsavMembershipA = await Membership.findOne({ userId: utsav._id, organizationId: orgA._id });
  await assertThrows(
    async () => {
      await memberService.removeMember({
        orgId: orgA._id,
        memberId: utsavMembershipA._id,
        actorId: rahul._id
      });
    },
    'Safety Check: Cannot remove Organization Owner from organization',
    403
  );

  console.log('\nTest Group 3: Scoped Visibility and Post Filtering');
  // Test 3.1: Harsh (in Engineering) should see Org posts and Engineering posts, but NOT Marketing posts or Utsav private personal posts
  const harshPosts = await postService.getPosts({
    orgId: orgA._id,
    userId: harsh._id,
    membership: harshMembershipA,
    role: await Role.findById(harshMembershipA.roleId),
    isOrgOwner: false,
    filter: 'all'
  });

  const harshPostTitles = harshPosts.map((p) => p.title);
  assert(harshPostTitles.includes('Annual All-Hands Meeting & Q4 Roadmap'), 'Harsh can see Org-wide post');
  assert(harshPostTitles.includes('Sprint 24: Distributed RBAC Migration'), 'Harsh can see Engineering dept post');
  assert(!harshPostTitles.includes('Product Hunt Launch Plan'), 'Harsh CANNOT see Marketing dept post');
  assert(!harshPostTitles.includes('Private Founder Notes: Investor Sync'), 'Harsh CANNOT see Utsav private personal post');

  // Test 3.2: Utsav (Owner) sees all organization, department, and his own personal posts
  const utsavPosts = await postService.getPosts({
    orgId: orgA._id,
    userId: utsav._id,
    membership: utsavMembershipA,
    role: await Role.findById(utsavMembershipA.roleId),
    isOrgOwner: true,
    filter: 'all'
  });
  const utsavPostTitles = utsavPosts.map((p) => p.title);
  assert(utsavPostTitles.includes('Annual All-Hands Meeting & Q4 Roadmap'), 'Owner sees Org post');
  assert(utsavPostTitles.includes('Sprint 24: Distributed RBAC Migration'), 'Owner sees Engineering post');
  assert(utsavPostTitles.includes('Product Hunt Launch Plan'), 'Owner sees Marketing post');
  assert(utsavPostTitles.includes('Private Founder Notes: Investor Sync'), 'Owner sees his Personal post');

  // Test 3.3: Department Manager (Harsh) cannot create post in a department he does not belong to
  await assertThrows(
    async () => {
      await postService.createPost({
        orgId: orgA._id,
        title: 'Unauthorized Marketing Post',
        description: 'Should fail',
        visibility: 'department',
        departmentId: deptMktA._id, // Marketing, which Harsh is NOT in
        authorId: harsh._id,
        userDeptIds: harshMembershipA.departmentIds,
        isOrgOwner: false,
        role: await Role.findById(harshMembershipA.roleId)
      });
    },
    'Department Scope: Manager cannot publish to unauthorized department',
    403
  );

  console.log('\n======================================================');
  console.log(` TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('======================================================\n');

  await mongoose.disconnect();
  process.exit(0);
};

runSuite().catch((err) => {
  console.error('\nTest Suite Failed:', err);
  process.exit(1);
});
