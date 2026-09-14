# OmniRBAC — Multi-Organization RBAC & Permission Architecture Guide

This guide provides an in-depth technical walkthrough of the Multi-Tenant Role-Based Access Control (RBAC) architecture implemented in **OmniRBAC**, detailing how tenant isolation operates, how permissions are evaluated dynamically, and how the frontend synchronizes with backend authorization rules.

---

## 1. Core Principle: Decoupled Tenant Authorization

In traditional web applications, authorization is often implemented as a simple role string stored on the user record:

```javascript
// ❌ INADEQUATE FOR MULTI-TENANCY:
if (user.role === 'admin') { ... }
```

This traditional approach breaks immediately in a collaborative multi-organization SaaS:
1. **Tenancy Divergence**: A user may be an **Owner** in Company A, an **Admin** in Company B, and a standard **Member** in Company C.
2. **Custom Roles**: Organizations can define their own custom roles (e.g., *Content Moderator*, *Security Auditor*) with specialized permission subsets.
3. **Resource Scopes**: A Department Manager may have update authority over posts, but only those belonging to their assigned department.

### The Correct Multi-Tenant Authorization Equation

$$\text{User} + \text{Organization Context} + \text{Membership} + \text{Role} + \text{Permissions} + \text{Scope} + \text{Resource Ownership}$$

---

## 2. Database Schema & Data Models

Authorization is established through relationships across five core MongoDB collections:

```text
┌──────────────┐             ┌─────────────────────┐             ┌──────────────────┐
│  User Model  │             │  Membership Model   │             │Organization Model│
├──────────────┤             ├─────────────────────┤             ├──────────────────┤
│ _id          │◄────────────┤ userId              │             │ _id              │
│ name         │             │ organizationId      ├────────────►│ name             │
│ email        │             │ roleId              │             │ slug             │
│ passwordHash │             │ departmentIds[]     │             │ ownerId          │
└──────────────┘             │ status              │             └──────────────────┘
                             └──────────┬──────────┘
                                        │
                                        ▼
                             ┌─────────────────────┐
                             │     Role Model      │
                             ├─────────────────────┤
                             │ _id                 │
                             │ organizationId      │
                             │ name                │
                             │ permissions[]       │
                             │ scope               │
                             │ isSystemRole        │
                             └─────────────────────┘
```

### 1. `User` Model
Contains global identity credentials (`name`, `email`, `passwordHash`, `avatar`). Does **not** store organization roles or tenant-specific permissions.

### 2. `Organization` Model
Represents an isolated tenant boundary (`name`, `slug`, `ownerId`, `settings`).

### 3. `Membership` Model
The junction table linking a user to an organization:
- `userId`: Reference to the User.
- `organizationId`: Reference to the Organization.
- `roleId`: Reference to the Role assigned within this specific organization.
- `departmentIds`: Array of departments the user belongs to within this organization.
- `status`: `active`, `pending`, `suspended`, or `removed`.
- **Compound Unique Index**: `{ userId: 1, organizationId: 1 }` guarantees a user has exactly one active membership profile per organization.

### 4. `Role` Model
Belongs to a specific organization (`organizationId`):
- `permissions`: Array of action strings, e.g., `["member.read", "post.create", "post.delete"]`.
- `scope`: Defines the boundary of authority:
  - `organization`: Action applies across the entire tenant.
  - `department`: Action applies only to resources in the user's assigned departments.
  - `personal`: Action applies only to resources created by the user.
- `isSystemRole`: Flags predefined roles (**Owner**, **Admin**, **Department Manager**, **Member**) to protect them from unauthorized deletion.

---

## 3. How the Backend Enforces Permissions

When an incoming request arrives at the backend (e.g., `POST /api/organizations/org123/posts`), it passes through a 3-tier middleware chain:

```text
Incoming HTTP Request
          │
          ▼
┌─────────────────────────────────┐
│ Tier 1: auth.js                 │ ➔ Validates JWT token from cookie or header
│                                 │ ➔ Populates req.user
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Tier 2: organization.js         │ ➔ Reads x-organization-id header
│                                 │ ➔ Validates active Membership in that Org
│                                 │ ➔ Attaches req.role & req.userPermissions
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Tier 3: rbac.js                 │ ➔ Evaluates authorize(permissionKey, options)
│                                 │ ➔ Verifies permission string & scope bounds
│                                 │ ➔ Prevents privilege escalation
└────────────────┬────────────────┘
                 │
                 ▼
     Controller / Business Logic
```

### Tier 1: Authentication (`src/middleware/auth.js`)
Validates the JWT token:
```javascript
const decoded = verifyToken(token);
const user = await User.findById(decoded.sub);
if (!user || !user.isActive) {
  return apiError(res, 'User account inactive or missing', 'UNAUTHORIZED', 401);
}
req.user = user;
next();
```

### Tier 2: Tenant Isolation (`src/middleware/organization.js`)
Extracts the target organization from `req.params.organizationId` or the `x-organization-id` header:
```javascript
const membership = await Membership.findOne({
  userId: req.user._id,
  organizationId: orgId,
  status: 'active'
}).populate('roleId').populate('departmentIds');

if (!membership) {
  return apiError(res, 'Access denied: You are not a member of this organization', 'FORBIDDEN', 403);
}

req.organization = organization;
req.membership = membership;
req.role = membership.roleId;
req.userPermissions = membership.roleId.permissions || [];
req.isOrgOwner = organization.ownerId.equals(req.user._id) || req.role.name === 'Owner';
next();
```

### Tier 3: Dynamic RBAC Authorization (`src/middleware/rbac.js`)
Verifies that the user's role contains the required permission action:
```javascript
const authorize = (permissionKey, options = {}) => {
  return (req, res, next) => {
    // 1. Organization primary Owner bypasses checks (Root authority)
    if (req.isOrgOwner) return next();

    // 2. Action check
    const hasPermission = req.userPermissions.includes(permissionKey);
    if (!hasPermission) {
      return apiError(res, `Missing required permission: ${permissionKey}`, 'FORBIDDEN', 403);
    }

    // 3. Scope validation (e.g., department boundary)
    if (req.role.scope === 'department') {
      const targetDeptId = req.body.departmentId || req.params.departmentId;
      const userDeptIds = (req.membership.departmentIds || []).map(d => d.toString());
      if (targetDeptId && !userDeptIds.includes(targetDeptId.toString())) {
        return apiError(res, 'Restricted to your assigned department', 'FORBIDDEN', 403);
      }
    }

    next();
  };
};
```

---

## 4. How the Frontend Knows Which Permissions the User Has

```text
User Logs In / Switches Org
           │
           ▼
Frontend calls: GET /api/organizations/:orgId/context
           │
           ▼
Backend returns:
{
  "organization": { "name": "Acme Innovations" },
  "role": { "name": "Owner", "scope": "organization" },
  "permissions": ["member.create", "member.read", "post.create", ...],
  "isOwner": true
}
           │
           ▼
Stored in Redux Store (organizationSlice)
           │
           ├──────────────────────────────┬──────────────────────────────┐
           ▼                              ▼                              ▼
  <Can permission="...">      usePermission() Hook            <ProtectedRoute>
  Shows / hides buttons       Conditional component logic     Guards URL routing
```

### Step 1: Loading Organization Context
When a user switches organizations in the Header dropdown or logs in:
```javascript
// frontend/src/slices/organizationSlice.js
export const fetchOrganizationContext = createAsyncThunk(
  'organization/fetchContext',
  async (orgId) => {
    const res = await api.get(`/organizations/${orgId}/context`);
    localStorage.setItem('activeOrgId', orgId);
    return res.data;
  }
);
```

### Step 2: Redux Store State
The permissions are saved in the central Redux store:
```javascript
state.organization = {
  activeOrg: { _id: "...", name: "Acme Innovations" },
  activeRole: { name: "Department Manager", scope: "department" },
  permissions: ["post.create", "post.read", "department.read"],
  departments: [...],
  isOwner: false
};
```

### Step 3: Declarative `<Can>` Component
Buttons and UI controls use the `<Can>` component to automatically hide elements the user cannot execute:
```jsx
// frontend/src/components/auth/Can.jsx
<Can permission="member.create">
  <button onClick={openCreateModal}>
    <UserPlus size={16} /> Create Member
  </button>
</Can>
```

### Step 4: Route-Level Protection `<ProtectedRoute>`
If a user tries to access a protected URL directly:
```jsx
// frontend/src/App.jsx
<Route
  path="roles"
  element={
    <ProtectedRoute requiredPermission="role.read">
      <Roles />
    </ProtectedRoute>
  }
/>
```
If the user lacks `role.read`, `<ProtectedRoute>` intercepts the render and displays an **Access Denied (403)** screen.

---

## 5. Privilege Escalation Prevention

To prevent unauthorized administrative takeovers, the platform implements explicit hierarchy barriers:

| Attempted Action | Actor | Allowed? | Enforcement Logic |
|---|---|---|---|
| Assign **Owner** Role | Admin | ❌ **Denied** | Only the primary Owner can assign the Owner role. |
| Assign **Admin** Role | Department Manager | ❌ **Denied** | Managers cannot grant roles higher than their own level. |
| Remove Organization Owner | Admin | ❌ **Denied** | The primary Owner can never be removed from the organization. |
| Delete System Role | Owner / Admin | ❌ **Denied** | Predefined roles (`isSystemRole: true`) cannot be deleted. |
| Delete Role in Use | Owner | ❌ **Denied** | Roles with active members assigned cannot be deleted. |
| Publish to Other Dept | Department Manager | ❌ **Denied** | Department scope checks enforce department membership. |

---

## 6. Seed Accounts Reference & Scenarios

| User | Email | Password | Org A (Acme Innovations) | Org B (Nexus Labs) |
|---|---|---|---|---|
| **Utsav Vachhani** | `utsav@example.com` | `Password123!` | **Owner** (Full Root Authority) | **Admin** (Operations Manager) |
| **Rahul Sharma** | `rahul@example.com` | `Password123!` | **Admin** (Full Management except Owner) | **Member** (Read / Basic Access) |
| **Harsh Patel** | `harsh@example.com` | `Password123!` | **Department Manager** (*Engineering*) | *None* (Tenant Isolated) |
| **Jay Dave** | `jay@example.com` | `Password123!` | **Content Manager** (Custom Role) | *None* |
| **Alice Johnson** | `alice@example.com` | `Password123!` | *None* | **Owner** (Root Authority) |

### Scenario 1: Tenant Switching
When **Utsav** switches from *Acme Innovations* to *Nexus Labs*:
- Active Org changes to `Nexus Labs`.
- Role changes from `Owner` to `Admin`.
- In Acme Innovations, Utsav can delete the organization. In Nexus Labs, the *Danger Zone: Deactivate Organization* button is completely hidden, and the backend will reject any delete attempt.

### Scenario 2: Scoped Post Visibility
- **Harsh** is assigned to *Engineering*.
- When viewing the Feed, Harsh sees:
  - Organization-wide announcements.
  - Engineering department announcements.
- Harsh **cannot** see Marketing department announcements or Utsav's private personal notes.
- The filtering happens **on the database level in the backend**, not just by hiding items with CSS.

---

## 7. Environment & Secrets Management

To ensure security, local `.env` files are ignored by Git.

### Setup Instructions:
1. **Backend**:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. **Frontend**:
   ```bash
   cp frontend/.env.example frontend/.env
   ```

### Git Protection:
The repository root `.gitignore` contains:
```gitignore
# Prevent sensitive keys from being committed
.env
**/.env
.env.local
node_modules/
**/node_modules/
dist/
**/dist/
```
Only `.env.example` templates with placeholder values are tracked in version control.
