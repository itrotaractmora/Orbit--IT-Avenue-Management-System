# IT Avenue Task Management System

A modern, highly-performant, role-scoped task and project management system designed specifically for the IT Avenue division. It features a strict five-tier organizational hierarchy, an invite-only email onboarding system, dynamic role-based dashboards, and a robust task approval pipeline.

---

## 🌟 Key Features

### 🔐 Security & Access Control
- **Strict Role Hierarchy:** Five distinct tiers (President → Senior Director → Co-Director → Team Lead → Member).
- **Invite-Only Onboarding:** Administrators invite members directly from the dashboard. The system utilizes **Supabase Admin APIs** to dispatch secure email invitations allowing users to create their accounts safely.
- **Role-Based Dashboards:** The main dashboard intelligently filters data. Executives see division-wide analytics, Team Leads oversee their specific teams, and Members are restricted to their personal active workloads.

### 📋 Advanced Task Lifecycle
- **Task Claiming & Dropping:** Members can pull open tasks from their team's queue. If they are unable to complete it, they can drop it by providing a mandatory reason that notifies their manager.
- **Manual Reassignment:** Admins can instantly transfer tasks between employees to optimize workload.
- **Mandatory Approvals:** To ensure quality, all completed work enters a `Pending Approval` state. Assignees can *never* approve their own tasks.
- **Automated Escalations:** Includes a secure API cron-trigger (`/api/cron/escalate`) that automatically sweeps for stalled approvals and escalates them up the leadership chain.

### 🎨 Modern UI & Experience
- **Fluid & Responsive:** Built from the ground up without heavy CSS frameworks. Utilizes native CSS variables, flexbox, and grid layouts. Features a sliding mobile drawer for smaller screens.
- **Dark Mode Integration:** Native, flicker-free dark mode toggle using `next-themes` style implementations.
- **Parallel Fetching:** Dashboard data (Tasks, Projects, Users, Notifications, Audit Logs) are all fetched asynchronously using `Promise.all()`, ensuring blazing-fast initial load times.
- **Data Exporting:** Built-in "Export CSV" functionality for executives to quickly download oversight tables for meetings.

### 👤 Member Profiles
- **Shareable Portfolios:** Every user has a dedicated, shareable profile page (e.g., `/profile/[id]`) that showcases their current workload, completion stats, approval rating, and contribution history.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 16 (App Router & Server Actions)
- **Styling:** Custom Vanilla CSS with CSS Variables (Themeable)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** Supabase Auth (with Admin Service Keys for email invites)
- **Icons:** Lucide React

---

## 🚀 Getting Started

To set up the project locally for development, you must configure your environment variables and database.

### 1. Environment Setup
Copy the example file to create your `.env`:
```bash
cp .env.example .env
```
Fill in the following credentials:
- `DATABASE_URL` and `DIRECT_URL` (From your Prisma/Postgres provider)
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (From Supabase Project Settings -> API)
- `SUPABASE_SERVICE_ROLE_KEY` (Required for the invite-only onboarding flow)
- `CRON_SECRET` (A custom secure string used to authenticate the automated escalation API)

### 2. Database Initialization
```bash
npm install
npx prisma db push
npx prisma generate
```

### 3. Run the Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

---

## 📖 Additional Documentation

- For deep dives into the original business logic, rules, and schema definitions, please refer to [**`specification.md`**](./specification.md).
- For further developer contribution guidelines, refer to [**`CONTRIBUTING.md`**](./CONTRIBUTING.md).
