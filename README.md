# OmniRBAC — Multi-Organization RBAC Collaboration Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-v18-blue.svg)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-v6+-brightgreen.svg)](https://www.mongodb.com)
[![Redux Toolkit](https://img.shields.io/badge/Redux%20Toolkit-v2-purple.svg)](https://redux-toolkit.js.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-ready, SaaS-style multi-tenant collaboration and access-control platform built using the MERN stack. Designed with strict tenant isolation, granular action-based permissions, resource-level scopes (organization, department, and personal), immutable audit trails, and dynamic workspace switching.

---

## 1. Project Overview

Modern collaboration platforms require users to participate in multiple organizations concurrently while maintaining completely isolated security profiles in each tenant. **OmniRBAC** solves this through a decoupled membership and permission engine:

```text
User
 ├── Organization A (Acme Innovations) ── Role: Owner (Full Root Access)
 └── Organization B (Nexus Labs)       ── Role: Admin (Operations & Management)
```

Authorization is never resolved from global user attributes. Instead, every backend API query and frontend permission check dynamically evaluates:

$$\text{User} + \text{Organization} + \text{Membership} + \text{Role} + \text{Permissions} + \text{Department} + \text{Resource Ownership}$$

---

## 2. Key Features

- **Multi-Tenant Isolation:** Complete logical tenant separation. No queries leak data between organizations.
- **Dynamic Organization Switcher:** Seamless switching between multiple organizations with instant workspace context reload.
- **Action-Based Permission Engine:** Granular permissions (`member.create`, `role.assign`, `post.delete`, `audit.read`, etc.) rather than rigid hardcoded role checks.
- **Resource Scoping:** Permissions and internal announcements support three distinct visibility and execution scopes:
  - `organization` (Accessible across the entire organization)
  - `department` (Scoped strictly to the member's assigned department)
  - `personal` (Visible only to the author/creator)
- **Predefined System Roles & Role Builder:**
  - Auto-seeded roles for every newly created organization: **Owner**, **Admin**, **Department Manager**, and **Member**.
  - Interactive Custom Role Builder with a granular permission matrix and scope selector.
- **Privilege Escalation Protection:**
  - Non-owners cannot assign the Owner role or remove the Owner.
  - Department Managers cannot manage other departments or escalate roles.
  - Active roles cannot be deleted while assigned to members.
- **Member & Invitation Lifecycle:** Direct creation, cryptographically secure invitation tokens (`/invite/:token`), resend/revoke options, role updates, and suspension toggles.
- **Departmental Scoping:** Department-level management and manager allocations.
- **Immutable Audit Logging:** System-wide recording of authentication, membership shifts, role reassignments, and content lifecycle.
- **Login Activity Tracking:** User-agent, IP, device, and browser tracking.

---

## 3. Technology Stack

### Frontend
- **Framework:** React 18 with Vite
- **State Management:** Redux Toolkit (Slices: `auth`, `organization`, `members`, `roles`, `departments`, `posts`, `invitations`, `auditLogs`, `ui`)
- **Routing:** React Router v6 with `<ProtectedRoute>` and `<Can>` permission guards
- **HTTP Client:** Axios with dynamic `x-organization-id` header injection and token interceptors
- **Icons:** Lucide React
- **Design System:** Custom CSS tokens, glassmorphism, responsive navigation, dark tech aesthetic

### Backend
- **Runtime:** Node.js & Express.js
- **Database & ODM:** MongoDB with Mongoose
- **Authentication:** JWT (JSON Web Tokens) with HTTP-only cookies and Bearer header fallback
- **Password Security:** `bcryptjs` (salt rounds: 10)
- **Security Middlewares:** `helmet`, `cors`, `express-rate-limit`, `cookie-parser`, `express-validator`
- **Audit System:** Immutable audit logs with pre-hook guards preventing deletion/mutation

---

## 4. Architecture

```text
                               ┌──────────────────────┐
                               │        CLIENT        │
                               │ Vite / React / Redux │
                               └──────────┬───────────┘
                                          │
                  ┌───────────────────────┴────────────────────────┐
                  ▼                                                ▼
     [Authorization: Bearer <JWT>]                   [x-organization-id: <OrgId>]
                  │                                                │
                  ▼                                                ▼
     ┌────────────────────────┐                       ┌────────────────────────┐
     │   auth.js Middleware   │                       │ organization.js Middle │
     │ Validates JWT & User   │                       │ Enforces Tenant Bounds │
     └────────────┬───────────┘                       └────────────┬───────────┘
                  │                                                │
                  └───────────────────────┬────────────────────────┘
                                          │
                                          ▼
                             ┌────────────────────────┐
                             │   rbac.js Middleware   │
                             │ Permission & Scope Chk │
                             └────────────┬───────────┘
                                          │
                                          ▼
                             ┌────────────────────────┐
                             │       Controller       │
                             └────────────┬───────────┘
                                          │
                                          ▼
                             ┌────────────────────────┐
                             │        Service         │
                             └────────────┬───────────┘
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
             ┌─────────────────────┐             ┌─────────────────────┐
             │   MongoDB Models    │             │   Audit Log Engine  │
             └─────────────────────┘             └─────────────────────┘
```

---

## 5. Folder Structure

```text
RBAC_Projects/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and environment configs
│   │   ├── constants/       # Permissions, roles, and audit actions constants
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, Organization isolation, and RBAC middlewares
│   │   ├── models/          # 10 Mongoose schemas
│   │   ├── routes/          # Express API route definitions
│   │   ├── seeds/           # Database reset and multi-org seed script
│   │   ├── services/        # Business logic layer
│   │   ├── tests/           # Automated verification test suite
│   │   ├── utils/           # JWT, hashing, and response formatters
│   │   └── app.js           # Express application setup
│   ├── server.js            # Backend entrypoint
│   ├── .env.example         # Template environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/             # Redux store configuration
│   │   ├── components/      # Common UI, layout (Sidebar, Header), and auth guards
│   │   ├── pages/           # Dashboard, Members, Roles, Posts, Invitations, Audit
│   │   ├── permissions/     # usePermission hook and Can component
│   │   ├── services/        # Axios API client with interceptors
│   │   ├── slices/          # Redux Toolkit feature slices
│   │   ├── App.jsx          # Route declarations
│   │   ├── index.css        # Design tokens & styles
│   │   └── main.jsx         # Vite entrypoint
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── package.json             # Root orchestration scripts
└── README.md
```

---

## 6. Development Credentials (Seed Data)

The development seed script populates 2 organizations, cross-tenant memberships, custom roles, departments, posts, and audit activity:

| Name | Email | Password | Org A (Acme Innovations) | Org B (Nexus Labs) |
|---|---|---|---|---|
| **Utsav Vachhani** | `utsav@example.com` | `Password123!` | **Owner** (Full Root) | **Admin** (Operations) |
| **Rahul Sharma** | `rahul@example.com` | `Password123!` | **Admin** | **Member** (Basic) |
| **Harsh Patel** | `harsh@example.com` | `Password123!` | **Department Manager** (Engineering) | *None* (Tenant isolated) |
| **Jay Dave** | `jay@example.com` | `Password123!` | **Content Manager** (Custom) | *None* |
| **Alice Johnson** | `alice@example.com` | `Password123!` | *None* | **Owner** |

---

## 7. Getting Started

### Prerequisites
- **Node.js**: v18 or higher (v20+ recommended)
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI

### 1. Backend Setup
```bash
cd backend
npm install

# Configure environment variables (a pre-configured .env is provided for local dev)
cp .env.example .env

# Run seed script to populate sample organizations, roles, and members
npm run seed

# Run automated tests to verify tenant isolation and RBAC rules
npm test

# Start backend server (Port 5000)
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Start development server (Port 5173)
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 8. Automated Test Suite

Run the end-to-end authorization and tenant isolation test suite:

```bash
cd backend
npm test
```

### Verified Scenarios:
1. **Multi-Organization Isolation:** Confirms that a member of Organization A cannot read or mutate Organization B's context.
2. **Cross-Tenant Role Divergence:** Confirms that the same user holds separate roles (e.g. Owner in Org A, Admin in Org B; Admin in Org A, Member in Org B).
3. **Privilege Escalation Prevention:** Verifies that Admins cannot assign the Owner role or remove the primary Owner.
4. **Post Visibility Filtering:** Confirms that department-scoped announcements are hidden from users outside that department, and personal notes are strictly private to the author.
5. **Departmental Scoping:** Verifies that Department Managers are prevented from publishing to unauthorized departments.

---

## 9. Security Implementations

- **Immutable Audit Trail:** Pre-hooks prevent modification or deletion of existing audit records.
- **Cross-Tenant Headers:** Validated against MongoDB membership records on every request.
- **Sanitized Outputs:** Passwords and hashes are excluded by default (`select: false`).
- **HTTP-Only Cookies & Bearer Tokens:** Prevents client-side script token exfiltration.
- **Rate Limiting:** Protects API endpoints against brute force attempts.

---

## 10. License

This project is licensed under the MIT License.
