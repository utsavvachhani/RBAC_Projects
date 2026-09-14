# MASTER PROMPT — Multi-Organization RBAC Collaboration Platform

You are a senior full-stack software architect and engineer.

Build a **production-ready multi-organization collaboration and access-control web application** using:

### Technology Stack

#### Frontend
- Vite
- React.js
- JavaScript/TypeScript
- Redux Toolkit
- React Redux
- React Router
- Axios
- Tailwind CSS or a clean component-based CSS architecture
- Form validation
- Responsive UI

#### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT authentication
- bcrypt/password hashing
- HTTP-only secure cookies where appropriate
- REST APIs
- Role-Based Access Control (RBAC)
- Organization/Department/Resource-level authorization
- Audit logging

The application must be designed with a **clean, scalable, modular architecture** suitable for future expansion.

---

# 1. CORE CONCEPT

The application is a **multi-organization RBAC platform**.

One user can belong to:

- One organization
- Multiple organizations
- Many organizations simultaneously

Each organization has its **own users, departments, roles, permissions, posts, invitations, and audit logs**.

Example:

```text
User A
 ├── Organization A
 │    ├── Owner
 │    ├── Admin
 │    ├── Department Manager
 │    └── Member
 │
 ├── Organization B
 │    ├── Admin
 │    └── Member
 │
 └── Organization C
      ├── Department Manager
      └── Member
```

The same user may have completely different roles in different organizations.

For example:

```text
Utsav
 ├── Company A → Owner
 ├── Company B → Admin
 ├── College Organization → Department Manager
 └── Community Organization → Member
```

**Never assume that a user's global role determines their access.**

Authorization must always be evaluated using:

```text
User
+
Organization
+
Membership
+
Role
+
Permissions
+
Department
+
Resource
```

---

# 2. ORGANIZATION MODEL

Every organization should be an isolated tenant.

Example:

```text
Organization
 ├── Basic Information
 ├── Members
 ├── Departments
 ├── Roles
 ├── Posts
 ├── Invitations
 └── Audit Logs
```

Organization data must never leak between organizations.

Every organization-specific resource must contain:

```text
organizationId
```

Examples:

```text
Department.organizationId
Membership.organizationId
Role.organizationId
Post.organizationId
Invitation.organizationId
AuditLog.organizationId
```

All backend queries must enforce organization isolation.

---

# 3. DEFAULT ORGANIZATION ROLES

Every newly created organization must automatically receive these predefined roles:

### OWNER

Full organization access.

Permissions should include:

```text
organization.read
organization.update
organization.delete

member.create
member.read
member.update
member.delete
member.invite
member.remove

department.create
department.read
department.update
department.delete

role.create
role.read
role.update
role.delete
role.assign

post.create
post.read
post.update
post.delete

audit.read

settings.read
settings.update
```

The Owner is the highest authority inside the organization.

---

# 4. ADMIN ROLE

Admin should have broad organization-management permissions but should not automatically have owner-level destructive access.

Example:

```text
organization.read
organization.update

member.create
member.read
member.update
member.invite
member.remove

department.create
department.read
department.update

role.read
role.assign

post.create
post.read
post.update
post.delete

audit.read
```

Prevent Admin from:

```text
deleting organization
changing organization owner
removing owner
assigning owner role
```

unless explicitly authorized by the system design.

---

# 5. DEPARTMENT MANAGER ROLE

Department Manager operates primarily within their assigned department.

Example permissions:

```text
department.read
department.update

member.read
member.create
member.invite

post.create
post.read
post.update
post.delete

team.read
team.manage
```

However, the Department Manager should generally NOT be able to:

```text
manage other departments
delete organization
manage organization-wide roles
change owner
view unrelated department private information
```

Department-level permissions must be scoped to the manager's assigned department.

---

# 6. MEMBER ROLE

Normal organization member.

Example:

```text
organization.read

member.read

department.read

post.create
post.read
post.update
post.delete
```

But posts must still respect their visibility:

```text
ORGANIZATION
DEPARTMENT
PERSONAL
```

Members cannot manage organization-wide RBAC unless specifically granted permission through a custom role.

---

# 7. CUSTOM ROLES

Organizations must be able to create custom roles.

Example:

```text
Role:
    Content Manager

Organization:
    Organization A

Permissions:
    post.create
    post.read
    post.update

Scope:
    department
```

Another example:

```text
Role:
    HR Manager

Permissions:
    member.read
    member.invite
    department.read
    post.read

Scope:
    organization
```

Custom roles belong to a specific organization.

Therefore:

```text
Role.organizationId
```

must always exist for organization-specific roles.

A custom role created in Organization A must NOT automatically exist in Organization B.

---

# 8. ROLE DESIGN

Do not hardcode authorization logic everywhere.

Create a centralized permission system.

Recommended structure:

```text
Permission
 ├── resource
 ├── action
 └── key
```

Examples:

```text
member.read
member.create
member.update
member.delete

department.read
department.create
department.update
department.delete

post.read
post.create
post.update
post.delete

role.read
role.create
role.update
role.delete
role.assign

audit.read
```

Role:

```text
Role
 ├── name
 ├── description
 ├── organizationId
 ├── permissions[]
 ├── scope
 ├── isSystemRole
 └── createdBy
```

---

# 9. ROLE SCOPE

Support different permission scopes.

At minimum:

```text
organization
department
personal
```

Example:

```text
post.read
scope = organization
```

means the user can read organization-wide posts.

Example:

```text
post.read
scope = department
```

means the user can only read posts belonging to their department.

Example:

```text
post.read
scope = personal
```

means the user can only read their own posts.

Authorization should therefore evaluate:

```text
permission
+
scope
+
organization
+
department
+
resource ownership
```

---

# 10. MEMBERSHIP SYSTEM

Do NOT store organization membership only inside the User document.

Create a dedicated Membership model.

Example:

```text
Membership
{
    userId,
    organizationId,
    roleId,
    departmentIds[],
    status,
    joinedAt,
    invitedBy,
    createdAt,
    updatedAt
}
```

Possible statuses:

```text
active
pending
suspended
removed
```

This allows one user to have different roles in different organizations.

Example:

```text
User A
 ├── Membership → Organization A → Owner
 ├── Membership → Organization B → Admin
 └── Membership → Organization C → Member
```

---

# 11. MULTIPLE DEPARTMENTS

A member can belong to one or multiple departments if the organization allows it.

Example:

```text
User
 ├── Organization A
 │    ├── Engineering
 │    └── Product
```

Membership should support:

```text
departmentIds[]
```

Department model:

```text
Department
{
    organizationId,
    name,
    description,
    managerIds[],
    createdBy,
    createdAt,
    updatedAt
}
```

---

# 12. INVITATION SYSTEM

Authorized users should be able to invite new members.

Example flow:

```text
Owner/Admin/Authorized Manager
        ↓
Enter email
        ↓
Select organization
        ↓
Select role
        ↓
Select department
        ↓
Create invitation
        ↓
Send invitation
        ↓
User accepts
        ↓
Membership created
```

Invitation model:

```text
Invitation
{
    organizationId,
    email,
    roleId,
    departmentIds[],
    invitedBy,
    token,
    status,
    expiresAt,
    acceptedAt,
    createdAt
}
```

Statuses:

```text
pending
accepted
expired
revoked
```

Invitation tokens must be securely generated and hashed where appropriate.

---

# 13. MEMBER CREATION

Authorized users should be able to:

```text
Create member
Invite member
Assign role
Assign department
Change role
Change department
Suspend member
Remove member
```

But every operation must go through the centralized authorization middleware.

Never rely only on frontend checks.

Frontend checks are for UI.

Backend checks are the actual security boundary.

---

# 14. ROLE ASSIGNMENT

A user with appropriate permission should be able to change another member's role.

Example:

```text
Owner
 ↓
Select Member
 ↓
Change Role
 ↓
Admin
```

Before allowing the operation, backend must verify:

```text
Requester belongs to organization
Requester has role.assign permission
Target user belongs to organization
Target role belongs to same organization
Requester is allowed to assign target role
```

Prevent privilege escalation.

For example:

```text
Admin → cannot assign Owner
Department Manager → cannot assign Admin
Member → cannot assign roles
```

unless explicitly configured through an authorized permission model.

---

# 15. POST / ANNOUNCEMENT SYSTEM

Create a simple internal post system.

A post contains:

```text
Post
{
    organizationId,
    departmentId,
    authorId,
    title,
    description,
    visibility,
    createdAt,
    updatedAt
}
```

Visibility has exactly three primary types:

```text
organization
department
personal
```

---

# 16. ORGANIZATION POST

Example:

```text
Title:
Annual Meeting

Description:
The annual organization meeting will be held on Friday.
```

Visibility:

```text
organization
```

This post is visible to eligible members across the organization.

---

# 17. DEPARTMENT POST

Example:

```text
Title:
Engineering Sprint Planning

Description:
Sprint planning will happen tomorrow.
```

Visibility:

```text
department
```

and:

```text
departmentId = Engineering
```

Only authorized members of that department should see it.

---

# 18. PERSONAL POST

Example:

```text
Title:
My Personal Reminder

Description:
Complete documentation.
```

Visibility:

```text
personal
```

Only the author should see it.

Do NOT simply return all posts to the frontend and hide them with JavaScript.

The backend must filter posts based on:

```text
organization
+
department membership
+
author ownership
+
permissions
```

---

# 19. POST ACCESS LOGIC

Implement logic similar to:

```text
If visibility = organization
    → user must belong to organization

If visibility = department
    → user must belong to organization
    → user must belong to post.department

If visibility = personal
    → user.id must equal post.authorId
```

Then additionally evaluate:

```text
post.read
```

permission.

---

# 20. AUDIT LOGGING

The application must maintain detailed audit logs.

Log important actions including:

### Authentication

```text
LOGIN_SUCCESS
LOGIN_FAILED
LOGOUT
PASSWORD_CHANGED
PASSWORD_RESET
```

### Organization

```text
ORGANIZATION_CREATED
ORGANIZATION_UPDATED
ORGANIZATION_DELETED
```

### Members

```text
MEMBER_CREATED
MEMBER_INVITED
MEMBER_JOINED
MEMBER_UPDATED
MEMBER_SUSPENDED
MEMBER_REMOVED
```

### Roles

```text
ROLE_CREATED
ROLE_UPDATED
ROLE_DELETED
ROLE_ASSIGNED
ROLE_CHANGED
```

### Departments

```text
DEPARTMENT_CREATED
DEPARTMENT_UPDATED
DEPARTMENT_DELETED
MANAGER_ASSIGNED
```

### Posts

```text
POST_CREATED
POST_UPDATED
POST_DELETED
POST_VIEWED
```

---

# 21. AUDIT LOG MODEL

Use something similar to:

```text
AuditLog
{
    organizationId,
    actorId,
    action,
    resourceType,
    resourceId,
    targetUserId,
    departmentId,
    metadata,
    ipAddress,
    userAgent,
    timestamp
}
```

Example:

```text
{
    action: "ROLE_ASSIGNED",
    actorId: "user123",
    targetUserId: "user456",
    organizationId: "org123",
    metadata: {
        oldRole: "member",
        newRole: "department_manager"
    }
}
```

Audit logs should be immutable.

Normal users must never be able to modify audit logs.

Only authorized users should be able to view them.

---

# 22. LOGIN ACTIVITY

Store login-related activity.

Example:

```text
LoginActivity
{
    userId,
    organizationId,
    event,
    ipAddress,
    userAgent,
    device,
    browser,
    operatingSystem,
    location,
    success,
    timestamp
}
```

Track:

```text
Successful login
Failed login
Logout
Password reset
Token refresh
```

Do not store plaintext passwords or sensitive authentication secrets in logs.

---

# 23. AUTHENTICATION ARCHITECTURE

Implement secure authentication.

Flow:

```text
Register
   ↓
Login
   ↓
Validate credentials
   ↓
Generate access/session authentication
   ↓
Authenticated request
   ↓
Load current user
   ↓
Load organization membership
   ↓
Resolve role
   ↓
Resolve permissions
   ↓
Authorize request
```

JWT payload should contain only minimal information.

Do not blindly trust role/permission information permanently stored inside JWTs.

For organization switching, resolve the selected organization and verify membership server-side.

---

# 24. ORGANIZATION SWITCHING

A user may belong to multiple organizations.

Create an organization switcher.

Example:

```text
Current Organization
--------------------
Organization A ✓

Switch Organization
--------------------
Organization B
Organization C
Organization D
```

When organization changes:

```text
GET /api/organizations/:organizationId/context
```

Backend verifies:

```text
user is member of organization
```

Then returns:

```text
organization
membership
role
permissions
departments
```

The frontend updates the active organization state.

---

# 25. REDUX TOOLKIT ARCHITECTURE

Use Redux Toolkit properly.

Recommended slices:

```text
authSlice
organizationSlice
membershipSlice
roleSlice
permissionSlice
departmentSlice
postSlice
invitationSlice
auditLogSlice
uiSlice
```

Example:

```text
store/
 ├── index.js
 └── slices/
      ├── authSlice.js
      ├── organizationSlice.js
      ├── membershipSlice.js
      ├── roleSlice.js
      ├── permissionSlice.js
      ├── departmentSlice.js
      ├── postSlice.js
      ├── invitationSlice.js
      ├── auditLogSlice.js
      └── uiSlice.js
```

Use async thunks or RTK Query where appropriate.

Avoid putting every API response manually into random component state.

---

# 26. FRONTEND ARCHITECTURE

Use a scalable feature-based architecture.

Recommended:

```text
src/
├── app/
│   ├── store.js
│   └── router.jsx
│
├── assets/
│
├── components/
│   ├── common/
│   ├── layout/
│   ├── forms/
│   ├── tables/
│   └── modals/
│
├── features/
│   ├── auth/
│   ├── organizations/
│   ├── members/
│   ├── roles/
│   ├── departments/
│   ├── posts/
│   ├── invitations/
│   └── auditLogs/
│
├── hooks/
├── layouts/
├── pages/
├── routes/
├── services/
├── utils/
├── permissions/
└── main.jsx
```

---

# 27. BACKEND ARCHITECTURE

Use modular backend architecture.

Recommended:

```text
server/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── environment.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Organization.js
│   │   ├── Membership.js
│   │   ├── Role.js
│   │   ├── Department.js
│   │   ├── Permission.js
│   │   ├── Invitation.js
│   │   ├── Post.js
│   │   ├── AuditLog.js
│   │   └── LoginActivity.js
│   │
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── routes/
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── rbac.js
│   │   ├── organization.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   │
│   ├── validators/
│   ├── utils/
│   ├── constants/
│   ├── seeds/
│   └── app.js
│
└── server.js
```

Use:

```text
Route
 ↓
Authentication Middleware
 ↓
Organization Context Middleware
 ↓
Authorization/RBAC Middleware
 ↓
Controller
 ↓
Service
 ↓
Repository/Model
 ↓
MongoDB
```

Do not place business logic directly inside routes.

---

# 28. CENTRALIZED RBAC MIDDLEWARE

Create reusable authorization functions.

Example conceptual API:

```text
authorize("member.create")
authorize("role.assign")
authorize("post.create")
authorize("audit.read")
```

Support scope:

```text
authorize("post.read", {
    scope: "department"
})
```

The middleware should determine:

```text
currentUser
currentOrganization
membership
role
permissions
department membership
resource ownership
```

before allowing access.

---

# 29. RESOURCE-LEVEL AUTHORIZATION

RBAC alone is not enough.

Implement RBAC + resource-level authorization.

Example:

A user may have:

```text
post.update
```

but they should not automatically be allowed to edit every post.

Evaluate:

```text
Can update post?
    ↓
Does user have post.update?
    ↓
What is the scope?
    ↓
Organization?
Department?
Personal?
    ↓
Does resource belong to permitted scope?
```

---

# 30. ORGANIZATION CREATION

Authenticated users should be able to create an organization.

Flow:

```text
Create Organization
       ↓
Create Organization
       ↓
Create Owner Membership
       ↓
Create default roles
       ↓
Assign Owner role
       ↓
Create default departments if configured
```

The creator automatically becomes:

```text
OWNER
```

---

# 31. DEFAULT ROLE SEEDING

Whenever a new organization is created, automatically create:

```text
Owner
Admin
Department Manager
Member
```

Mark them:

```text
isSystemRole: true
```

System roles should have restrictions on deletion.

For example:

```text
Owner → cannot delete
Member → cannot delete
```

Depending on implementation, allow organizations to customize permissions of predefined roles only if safe.

Custom roles:

```text
isSystemRole: false
```

can be created and managed according to permissions.

---

# 32. UI STRUCTURE

Create a professional dashboard.

Main layout:

```text
------------------------------------------------
| Sidebar                 | Header             |
|                         | Organization       |
| Dashboard               | Switcher           |
| Members                 | User Profile      |
| Departments             |                    |
| Roles & Permissions     |                    |
| Posts                   |                    |
| Invitations             |                    |
| Audit Logs              |                    |
| Settings                |                    |
------------------------------------------------
```

Show navigation based on permissions.

For example:

```text
Owner
→ sees everything

Admin
→ sees most management sections

Department Manager
→ sees department/team features

Member
→ sees normal member features
```

However:

**Frontend visibility is NOT security.**

Every API must independently verify permissions.

---

# 33. DASHBOARD

Create dashboard cards:

```text
Total Members
Active Members
Departments
Roles
Pending Invitations
Recent Posts
Recent Activity
```

Display information according to the current organization.

Do not expose information from other organizations.

---

# 34. MEMBER MANAGEMENT PAGE

Create:

```text
Members
```

with:

```text
Search
Filter by role
Filter by department
Filter by status
Invite Member
Create Member
```

Member table:

```text
Name
Email
Role
Departments
Status
Joined
Actions
```

Actions should be permission-aware:

```text
View
Edit
Change Role
Change Department
Suspend
Remove
```

---

# 35. ROLE MANAGEMENT PAGE

Display:

```text
Role Name
Description
Type
Permissions
Members Count
Scope
Actions
```

Example:

```text
Owner
System Role
Full Access

Admin
System Role
Organization Management

Department Manager
System Role
Department Management

Member
System Role
Basic Access

Content Manager
Custom Role
Post Management
```

Create a role builder.

Example:

```text
Role Name
Description

Permissions

☐ Member
   ☐ Read
   ☐ Create
   ☐ Update
   ☐ Delete
   ☐ Invite

☐ Department
   ☐ Read
   ☐ Create
   ☐ Update
   ☐ Delete

☐ Post
   ☐ Read
   ☐ Create
   ☐ Update
   ☐ Delete

Scope
○ Organization
○ Department
○ Personal
```

---

# 36. DEPARTMENT MANAGEMENT

Create:

```text
Departments
```

Features:

```text
Create Department
Edit Department
Delete Department
Assign Manager
Add Members
Remove Members
```

Department page:

```text
Department Name
Description
Manager
Members
Department Posts
```

Department Manager should see only authorized department information.

---

# 37. INVITATION MANAGEMENT

Create:

```text
Invitations
```

Show:

```text
Email
Role
Department
Invited By
Status
Expiration
Actions
```

Actions:

```text
Resend
Revoke
```

---

# 38. POSTS PAGE

Create a simple post feed.

Tabs:

```text
All
Organization
My Department
Personal
```

Each post:

```text
Title
Description
Author
Department
Visibility
Created At
Actions
```

Create Post form:

```text
Title
Description
Visibility

Organization
Department
Personal
```

If:

```text
visibility = department
```

then show:

```text
Select Department
```

---

# 39. AUDIT LOG UI

Create an audit log page.

Filters:

```text
Action
User
Resource
Department
Date
```

Table:

```text
Timestamp
Actor
Action
Resource
Target
IP
Details
```

Example:

```text
14 Sep 2026 20:32
Utsav
ROLE_ASSIGNED
Member: Rahul
Member → Department Manager
```

---

# 40. SECURITY REQUIREMENTS

Implement strong security practices.

Must include:

```text
Password hashing with bcrypt
JWT/session security
HTTP-only cookies where applicable
CORS configuration
Helmet
Rate limiting
Input validation
Request sanitization
MongoDB query safety
Centralized error handling
Environment variables
No secrets in source code
```

Never expose:

```text
password
passwordHash
JWT secrets
database credentials
private tokens
```

in API responses.

---

# 41. API RESPONSE FORMAT

Use a consistent response format.

Success:

```json
{
  "success": true,
  "message": "Member created successfully",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "You do not have permission to perform this action",
  "code": "FORBIDDEN"
}
```

Use appropriate HTTP status codes:

```text
200
201
400
401
403
404
409
422
429
500
```

---

# 42. API STRUCTURE

Create APIs similar to:

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Organizations

```text
GET    /api/organizations
POST   /api/organizations
GET    /api/organizations/:organizationId
PATCH  /api/organizations/:organizationId
DELETE /api/organizations/:organizationId
GET    /api/organizations/:organizationId/context
```

### Members

```text
GET    /api/organizations/:organizationId/members
POST   /api/organizations/:organizationId/members
GET    /api/organizations/:organizationId/members/:memberId
PATCH  /api/organizations/:organizationId/members/:memberId
DELETE /api/organizations/:organizationId/members/:memberId
PATCH  /api/organizations/:organizationId/members/:memberId/role
PATCH  /api/organizations/:organizationId/members/:memberId/departments
```

### Roles

```text
GET    /api/organizations/:organizationId/roles
POST   /api/organizations/:organizationId/roles
GET    /api/organizations/:organizationId/roles/:roleId
PATCH  /api/organizations/:organizationId/roles/:roleId
DELETE /api/organizations/:organizationId/roles/:roleId
POST   /api/organizations/:organizationId/roles/:roleId/assign
```

### Departments

```text
GET    /api/organizations/:organizationId/departments
POST   /api/organizations/:organizationId/departments
PATCH  /api/organizations/:organizationId/departments/:departmentId
DELETE /api/organizations/:organizationId/departments/:departmentId
POST   /api/organizations/:organizationId/departments/:departmentId/members
```

### Posts

```text
GET    /api/organizations/:organizationId/posts
POST   /api/organizations/:organizationId/posts
GET    /api/organizations/:organizationId/posts/:postId
PATCH  /api/organizations/:organizationId/posts/:postId
DELETE /api/organizations/:organizationId/posts/:postId
```

### Invitations

```text
GET  /api/organizations/:organizationId/invitations
POST /api/organizations/:organizationId/invitations
POST /api/invitations/:token/accept
POST /api/organizations/:organizationId/invitations/:id/revoke
POST /api/organizations/:organizationId/invitations/:id/resend
```

### Audit

```text
GET /api/organizations/:organizationId/audit-logs
```

---

# 43. DATABASE RELATIONSHIPS

Design MongoDB collections around:

```text
User
Organization
Membership
Role
Permission
Department
Invitation
Post
AuditLog
LoginActivity
```

Relationship:

```text
User
 │
 ├── Membership ───── Organization
 │                      │
 │                      ├── Roles
 │                      ├── Departments
 │                      ├── Posts
 │                      ├── Invitations
 │                      └── AuditLogs
 │
 └── LoginActivity
```

Use MongoDB references where appropriate.

Avoid massive embedded documents that will grow without bounds.

---

# 44. DATABASE INDEXING

Create proper indexes.

Examples:

```text
User.email → unique index

Membership:
    userId + organizationId → unique compound index
    organizationId
    roleId

Department:
    organizationId + name

Role:
    organizationId + name

Post:
    organizationId + visibility
    organizationId + departmentId
    organizationId + authorId
    createdAt

Invitation:
    organizationId + email
    token
    expiresAt

AuditLog:
    organizationId + timestamp
    organizationId + actorId
    organizationId + action
```

Use TTL indexes where appropriate for expiring invitations or temporary authentication data.

---

# 45. ORGANIZATION ISOLATION

This is one of the most important requirements.

Every organization-specific request must validate:

```text
req.user
      ↓
Membership exists?
      ↓
Membership.organizationId === requestedOrganizationId?
      ↓
Allowed?
```

Never trust:

```text
organizationId
roleId
departmentId
```

coming from the client.

Validate all of them on the backend.

---

# 46. PREVENT PRIVILEGE ESCALATION

Implement explicit protection against:

```text
Member → Owner
Department Manager → Owner
Admin → Owner
Custom Role → Owner
```

unless the authenticated actor has explicit authority.

Also prevent users from:

```text
removing themselves as the only owner
deleting the organization accidentally
assigning roles outside their authority
assigning roles from another organization
accessing departments they do not belong to
accessing posts outside their scope
```

---

# 47. FRONTEND PERMISSION SYSTEM

Create reusable hooks/components.

Example:

```text
usePermission("member.create")
```

and:

```text
<Can permission="member.create">
    <CreateMemberButton />
</Can>
```

Also:

```text
useRole()
useOrganization()
useMembership()
```

Do not duplicate role conditions throughout the application.

Prefer permission checks:

```text
hasPermission("member.create")
```

instead of:

```text
role === "admin"
```

This is essential because custom roles exist.

---

# 48. ROUTE PROTECTION

Create protected routes.

Example:

```text
/Public
   /login
   /register
   /invite/:token

/Protected
   /dashboard
   /organizations
   /members
   /departments
   /roles
   /posts
   /invitations
   /audit-logs
   /settings
```

Organization-specific routes should include:

```text
/organizations/:organizationId/...
```

or use a validated active organization context.

---

# 49. ERROR AND EMPTY STATES

Every page should handle:

```text
Loading
Error
Empty
Unauthorized
Forbidden
Not Found
```

Examples:

```text
You don't have permission to view this page.

No members found.

No posts available.

This invitation has expired.
```

---

# 50. RESPONSIVE UI

Application must work on:

```text
Desktop
Laptop
Tablet
Mobile
```

Use responsive sidebar/navigation.

Create clean:

```text
cards
tables
forms
dropdowns
modals
toasts
confirmation dialogs
```

Do not make the UI unnecessarily complicated.

---

# 51. SEED DATA

Create a development seed script.

Seed:

```text
1 super test account
2–3 organizations
default roles
multiple departments
multiple members
custom roles
sample posts
sample audit logs
```

Example:

```text
Organization A
 ├── Utsav → Owner
 ├── Rahul → Admin
 ├── Harsh → Department Manager
 └── Jay → Member

Departments:
 ├── Engineering
 ├── Marketing
 └── HR

Custom Role:
 └── Content Manager
```

Also create cross-organization users.

Example:

```text
Rahul
 ├── Organization A → Admin
 └── Organization B → Member
```

This must be used to verify that the multi-organization architecture works correctly.

---

# 52. TESTING REQUIREMENTS

Create backend authorization tests for:

```text
Owner access
Admin access
Department Manager access
Member access
Custom role access
Cross-organization access
Department access
Personal post access
Organization post access
Invitation access
Role assignment
Privilege escalation prevention
```

Especially test:

```text
User belonging to Organization A
cannot access Organization B
```

and:

```text
Admin in Organization A
may have completely different permissions in Organization B
```

---

# 53. IMPORTANT AUTHORIZATION EXAMPLES

Example 1:

```text
User:
Rahul

Organization A:
Admin

Organization B:
Member
```

Request:

```text
Delete member from Organization A
```

Allowed only if Admin has permission.

Request:

```text
Delete member from Organization B
```

Must be denied.

---

Example 2:

```text
User:
Harsh

Organization A:
Department Manager

Department:
Engineering
```

Harsh requests:

```text
GET Engineering members
```

Allowed.

Harsh requests:

```text
GET Marketing members
```

Denied unless permission explicitly allows it.

---

Example 3:

```text
User:
Jay

Role:
Custom Content Manager

Permissions:
post.create
post.read
post.update
```

Jay should be able to manage posts according to the configured scope, but should not automatically gain:

```text
member.delete
role.assign
organization.delete
```

---

# 54. AUDIT EVERYTHING IMPORTANT

Whenever a sensitive operation occurs, generate an audit event.

Example:

```text
Owner changes Rahul:
Admin → Department Manager
```

Create:

```text
ROLE_CHANGED
```

with:

```text
actorId
targetUserId
organizationId
oldRole
newRole
timestamp
IP
userAgent
```

Do this consistently.

---

# 55. CODE QUALITY

Follow:

```text
SOLID principles
DRY
Separation of concerns
Reusable services
Reusable middleware
Reusable components
Clear naming
Consistent error handling
Centralized constants
Environment configuration
```

Do not create:

```text
one giant server.js
one giant React component
authorization logic duplicated everywhere
database queries directly in every controller
hardcoded roles throughout the frontend
```

---

# 56. ENVIRONMENT VARIABLES

Create:

```text
.env.example
```

Example:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=

JWT_SECRET=
JWT_EXPIRES_IN=

CLIENT_URL=

COOKIE_SECRET=
```

Never commit actual secrets.

---

# 57. README

Create a professional README containing:

```text
Project Overview
Features
Architecture
Tech Stack
Folder Structure
Authentication
RBAC Architecture
Multi-Organization Architecture
Permission System
Database Schema
API Documentation
Environment Setup
Installation
Running Frontend
Running Backend
Seed Data
Testing
Security
Future Improvements
```

Also provide example credentials for development seed accounts without using real credentials.

---

# 58. DEVELOPMENT ORDER

Build the application in this order:

### Phase 1

Project setup:

```text
Vite frontend
Node/Express backend
MongoDB connection
Environment configuration
ESLint/Prettier if appropriate
```

### Phase 2

Authentication:

```text
Register
Login
Logout
Current user
Password hashing
JWT/session
```

### Phase 3

Organization:

```text
Create organization
Organization membership
Organization switching
```

### Phase 4

RBAC:

```text
Permissions
Default roles
Custom roles
Role assignment
RBAC middleware
```

### Phase 5

Departments:

```text
Create
Update
Delete
Manager assignment
Member assignment
```

### Phase 6

Members:

```text
List
Create
Invite
Update
Role assignment
Department assignment
Suspend
Remove
```

### Phase 7

Posts:

```text
Organization posts
Department posts
Personal posts
Access control
```

### Phase 8

Audit:

```text
Audit logs
Login activity
Activity UI
```

### Phase 9

Dashboard/UI:

```text
Sidebar
Dashboard
Tables
Forms
Modals
Notifications
Responsive design
```

### Phase 10

Security + Testing:

```text
Authorization tests
Tenant isolation tests
Validation
Rate limiting
Error handling
Security review
```

---

# 59. FINAL ARCHITECTURE

The final system should conceptually operate like this:

```text
                         ┌──────────────────────┐
                         │        USER          │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   AUTHENTICATION     │
                         │ JWT / Session        │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ ORGANIZATION CONTEXT │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     MEMBERSHIP       │
                         │ User + Org           │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │        ROLE          │
                         │ System / Custom      │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     PERMISSIONS      │
                         │ CRUD + Scope         │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ RESOURCE AUTHORITY   │
                         │ Org / Dept / Personal│
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       RESOURCE       │
                         │ Members / Posts etc. │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     AUDIT LOGGER     │
                         └──────────────────────┘
```

---

# 60. MOST IMPORTANT RULE

Do NOT implement this application as a simple:

```text
user.role === "admin"
```

system.

The correct authorization model is:

```text
USER
 ↓
MEMBERSHIP
 ↓
ORGANIZATION
 ↓
ROLE
 ↓
PERMISSIONS
 ↓
SCOPE
 ↓
DEPARTMENT
 ↓
RESOURCE
 ↓
ACTION
```

The same user must be able to have different permissions in different organizations.

Example:

```text
                    UTSAV
                      │
          ┌───────────┼────────────┐
          ▼           ▼            ▼
       ORG A        ORG B        ORG C
          │           │            │
        OWNER        ADMIN       MEMBER
          │           │            │
       FULL ACL     MANAGE       BASIC ACL
```

Implement the system around this principle.

---

# 61. EXPECTED FINAL DELIVERABLE

Generate a fully working project with:

```text
/frontend
/backend
```

including:

- Complete source code
- MongoDB/Mongoose models
- Authentication
- Multi-organization support
- Membership system
- Default roles
- Custom roles
- Permission system
- Scope-based authorization
- Department management
- Member management
- Invitations
- Organization switching
- Post system
- Organization/Department/Personal visibility
- Audit logging
- Login activity
- Redux Toolkit state management
- Protected routes
- Permission-aware UI
- API validation
- Error handling
- Security middleware
- Seed data
- Tests
- `.env.example`
- README

Before considering the implementation complete, verify that:

1. A user can belong to multiple organizations.
2. The same user can have different roles in each organization.
3. Every organization has isolated data.
4. Every organization gets Owner/Admin/Department Manager/Member roles.
5. Custom roles work independently per organization.
6. Permissions are action-based rather than hardcoded role checks.
7. Permissions support organization/department/personal scope.
8. Authorized users can create and invite members.
9. Authorized users can assign roles and departments.
10. Department Managers are restricted to their allowed departments.
11. Posts support organization, department, and personal visibility.
12. Backend—not just frontend—enforces every permission.
13. Sensitive operations create audit logs.
14. Login activity is recorded.
15. Cross-organization access is rejected.
16. Privilege escalation is prevented.
17. The application follows clean frontend and backend architecture.
18. The project can be started locally using documented commands.

Build the application as a **real scalable SaaS-style multi-tenant RBAC platform**, not as a basic CRUD demo.