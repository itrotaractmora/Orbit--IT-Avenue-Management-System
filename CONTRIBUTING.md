# Contributing to IT Avenue Task Management System

Welcome! Thank you for your interest in contributing to the **IT Avenue Task Management System**. 

This guide is written specifically for newcomers, assuming you have zero prior setup on your machine. We will walk you through every step to get the project running locally, explain the codebase structure, and guide you on how to work with the database using **Prisma Studio**.

---

## Table of Contents
1. [Tech Stack Overview](#1-tech-stack-overview)
2. [Prerequisites](#2-prerequisites)
3. [Step-by-Step Setup Guide](#3-step-by-step-setup-guide)
4. [Using Prisma Studio to Manage the Database](#4-using-prisma-studio-to-manage-the-database)
5. [Understanding Roles & Permissions](#5-understanding-roles--permissions)
6. [Task Lifecycle Workflow](#6-task-lifecycle-workflow)
7. [Directory Structure](#7-directory-structure)

---

## 1. Tech Stack Overview

- **Frontend & Routing:** [Next.js](https://nextjs.org/) (App Router, Server Actions, styled with Vanilla CSS).
- **Authentication:** [Supabase Auth](https://supabase.com/) for managing sessions, signups, and password logins.
- **Database & ORM:** [PostgreSQL](https://www.postgresql.org/) database managed through [Prisma ORM](https://www.prisma.io/).

---

## 2. Prerequisites

Before starting, install the following software on your computer:
1. **Node.js (v20 or higher):** [Download Node.js here](https://nodejs.org/). This installs both Node and `npm` (Node Package Manager).
2. **PostgreSQL Database:** You need a running PostgreSQL database. You can install it locally using [PostgreSQL Installer](https://www.postgresql.org/download/) or run one online (e.g. Supabase, Neon).
3. **Git (optional but recommended):** [Download Git here](https://git-scm.com/) if you want to clone/manage branches.

---

## 3. Step-by-Step Setup Guide

### Step 1: Open Your Terminal
Open command prompt (Windows PowerShell, CMD, or macOS Terminal) and navigate to the project directory:
```bash
cd /path/to/it_mgt
```

### Step 2: Install Node Dependencies
Run the following command to download and install all libraries the application relies on:
```bash
npm install
```

### Step 3: Configure Environment Variables
You need to create a config file to tell Next.js how to connect to your database and authentication server:
1. Locate the `.env.example` file in the root folder.
2. Duplicate this file and rename the copy to `.env`.
3. Open `.env` in a text editor and fill in the values:
   - **`DATABASE_URL`:** Replace with your PostgreSQL connection URL.
     - *Format:* `postgresql://<user>:<password>@<host>:<port>/<db_name>?schema=public`
     - *Default Local PostgreSQL Example:* `postgresql://postgres:postgres@localhost:5432/it_mgt?schema=public`
   - **`NEXT_PUBLIC_SUPABASE_URL`** & **`NEXT_PUBLIC_SUPABASE_ANON_KEY`:** Get these values from your Supabase Dashboard under Project Settings -> API.
   - **`SUPABASE_SERVICE_ROLE_KEY`:** Required for the admin-only invite email system. Get this from the same API settings page. Keep this secret!
   - **`CRON_SECRET`:** Create a custom secure string for the API escalation endpoint.
### Step 4: Sync the Database Schema
Prisma needs to sync your PostgreSQL database with the project's data models. Run the following command:
```bash
npx prisma db push
```
This inspects `prisma/schema.prisma` and creates all the tables (User, Task, Project, Notification, etc.) in your PostgreSQL database automatically.

### Step 5: Start the Development Server
Run the local dev server:
```bash
npm run dev
```
Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**. The page will auto-reload as you make code edits.

---

## 4. Using Prisma Studio to Manage the Database

### What is Prisma Studio?
Prisma Studio is a beautiful visual dashboard that runs in your browser. It lets you inspect, search, add, edit, and delete records in your database tables without writing any SQL commands.

### How to Run Prisma Studio
1. Open a **new terminal window** in the project folder (leave `npm run dev` running in your first terminal).
2. Start the database editor by running:
   ```bash
   npx prisma studio
   ```
3. By default, Prisma Studio will open automatically in your browser at **[http://localhost:5555](http://localhost:5555)**.

### Common Prisma Studio Operations for Contributors:
- **Creating the First Account (Seeding Admin):**
  1. Click on the `User` model.
  2. Click **Add Record** at the top right.
  3. Fill in your name, email, and choose the `PRESIDENT` role.
  4. Click **Save Changes** (in the green top bar).
  5. Go to your local app (`http://localhost:3000/signup`), signup with the **same email address**, and your credentials will automatically sync and link your account with the database profile!
- **Modifying Roles / Statuses:**
  If you onboarded a user and want to change their role (e.g. from `MEMBER` to `CO_DIRECTOR`), you can click their record inside `User` in Prisma Studio, double click the `role` field, change the value, and save.
- **Clearing Logs / Dismissing Notifications:**
  You can view all logs under `AuditLog` or delete items in `Notification` directly from the interface.

---

## 5. Understanding Roles & Permissions

The project uses a strict five-tier role hierarchy:
1. **President:** The superuser. Can add/manage Senior Directors and Co-Directors. Oversees the entire division and holds override authority.
2. **Senior Director:** Can onboard anyone and manage all projects.
3. **Co-Director:** Manages assigned teams, onboards Team Leads and Members.
4. **Team Lead:** Creates and assigns tasks for their specific team, manages members.
5. **Team Member:** Claims, works on, and submits tasks.

*Note on Admins:* President, Senior Director, and Co-Director comprise the Admin tier. They can view all database records and audit logs across the division.

---

## 6. Task Lifecycle Workflow

A task moves through specific states in its lifecycle:

1. **`OPEN` (Gray):** Task created, awaiting someone to claim or assign.
2. **`IN_PROGRESS` (Blue):** A Member has claimed the task or been assigned.
   - *Dropping / Reassigning:* Members can drop tasks they cannot complete (notifying their Lead), and Admins/Leads can manually reassign them at any point.
3. **`PENDING_APPROVAL` (Yellow):** A Member marked the task complete. It now sits in the approver's queue.
   - *No Self-Approval Rule:* A user can never approve their own task. If an admin is the assignee, approval automatically escalates to their manager or a peer admin.
   - *Automated Escalations:* Tasks stalled here for >3 days are automatically escalated by the cron API `/api/cron/escalate`.
4. **`REJECTED` (Red):** Approver rejected the submission. A rejection comment is mandatory and displayed inline on the assignee's board. The task goes back to `IN_PROGRESS`.
5. **`COMPLETED` (Green):** Approved task. It is locked, logged in the audit trail, and counted in stats.

---

## 7. Directory Structure

```
├── prisma/
│   └── schema.prisma        # Database schema models (tables, relations, enums)
├── public/                  # Static assets (images, icons)
├── src/
│   ├── actions/             # Next.js Server Actions (database operations & business logic)
│   │   ├── authActions.ts   # Login, signup, and session sync logic
│   │   ├── userActions.ts   # Onboarding and team creation actions
│   │   ├── projectActions.ts# Project CRUD and status update actions
│   │   └── taskActions.ts   # Task lifecycle, assignment, approvals, and escalations
│   ├── app/                 # Next.js Page Routing
│   │   ├── layout.tsx       # Root layout configuration
│   │   ├── globals.css      # Design tokens and Vanilla CSS stylesheet
│   │   ├── login/           # Auth login screen
│   │   ├── signup/          # Auth signup screen
│   │   ├── dashboard/       # Main user dashboards (admin/lead/member layouts)
│   │   └── profile/[id]/    # Shareable contributor profile statistics
│   └── utils/               # Configuration utilities
│       ├── prisma.ts        # Prisma DB client initialization (with driver adapters)
│       └── supabase/        # Supabase Client and Server instances setup
```

---
If you run into any trouble, please reach out to the project administrator or create an issue in the repository. Happy coding!
