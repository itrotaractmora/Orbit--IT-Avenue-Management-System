# IT Avenue Task Management System

A web-based, role-scoped task and project management system designed for the IT Avenue division. It features a five-tier hierarchy with delegated user administration, project and task assignment, dynamic notifications, audit logs, and an approval pipeline with strict rules such as no self-approval.

---

## Getting Started

To set up the project locally for development, copy the environment variables template and follow our step-by-step contribution guide.

- For environment setup, copy [`.env.example`](file:///D:/it_mgt/.env.example) to `.env` and fill in your database/Supabase configuration.
- Read [`CONTRIBUTING.md`](file:///D:/it_mgt/CONTRIBUTING.md) for full setup instructions, tech stack details, and how to use Prisma Studio.

---

## Tech Stack Overview

- **Frontend & Server Pages:** Next.js (App Router, Server Actions, styled with Vanilla CSS)
- **Database & ORM:** PostgreSQL managed through Prisma ORM
- **Authentication:** Supabase Auth for sessions and security checks

---

## Core Features

1. **Five-Tier Role Hierarchy:** Scoped permissions from President (Superuser) down to Team Members.
2. **Task Lifecycle State Machine:** Strict transitions: `Open` ➜ `In Progress` ➜ `Pending Approval` ➜ `Completed` / `Rejected` (with comments).
3. **No Self-Approval:** Assignees cannot approve their own submissions; approvals automatically escalate to a peer admin or manager.
4. **Escalation Sweeper:** Automates review escalation of approval requests stalled longer than 3 days.
5. **Private Contributor Profiles:** Shareable stats page displaying completed contributions, approval rating, and current workload. Accessible to logged-in members.
6. **Audit Logs & Notifications:** Dense admin audit trail alongside contextual email and in-app alerts.

For full developer instructions and database schema management details, please refer directly to [**`CONTRIBUTING.md`**](file:///D:/it_mgt/CONTRIBUTING.md).
