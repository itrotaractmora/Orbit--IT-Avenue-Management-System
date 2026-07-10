# IT Avenue Task Management System — Detailed Specification

## 1. Overview

A web-based task and project management system for the IT Avenue division, built around a five-tier role hierarchy with delegated user management, project/task assignment, and a mandatory approval step before any task is marked complete.

**Hierarchy:** President → Senior Director → Co-Directors (2) → Team Leads (3–5) → Team Members

---

## 2. Roles & Permissions Matrix

| Capability | President | Senior Director | Co-Director | Team Lead | Member |
|---|---|---|---|---|---|
| **Admin tier** | ✅ | ✅ | ✅ | ❌ | ❌ |
| System admin (config, roles, integrations) | ✅ | ✅ | ✅ | ❌ | ❌ |
| View all data across division | ✅ | ✅ | ✅ | ❌ (own team) | ❌ |
| Add/assign Senior Director | ✅ | ✅ (peer-level) | ❌ | ❌ | ❌ |
| Add/assign Co-Director | ✅ | ✅ | ❌ | ❌ | ❌ |
| Add/assign Team Lead | ❌ | ✅ | ✅ | ❌ | ❌ |
| Add/assign Team Member | ❌ | ✅ | ✅ | ✅ | ❌ |
| Create project | ❌ | ✅ | ✅ | ❌ | ❌ |
| Create task (inside project) | ❌ | ✅ | ✅ | ✅* | ❌ |
| Create general task (no project) | ❌ | ✅ | ✅ | ✅* | ❌ |
| Assign task to member | ❌ | ✅ | ✅ | ✅ | ❌ |
| Claim/self-assign a task | ❌ | ✅ | ✅ | ✅ | ✅ |
| Mark task "done" (pending approval) | — | ✅ | ✅ | ✅ | ✅ |
| **Approve/reject a completed task** | ✅ | ✅ | ✅ | ❌ | ❌ |
| View own dashboard/contributions | ✅ | ✅ | ✅ | ✅ | ✅ |
| View/access system (audit) log | ✅ | ✅ | ✅ | ❌ | ❌ |

**Member profile pages:** every user (especially Members) gets a profile page showing their contribution history (tasks completed, approval rate, current workload). Each profile has a unique shareable link (e.g. `/profile/{user_id}`), so a Member's stats can be shared or referenced without requiring the viewer to log in and navigate the dashboard themselves. Decide whether the shared link is public-within-org (anyone with the link who's logged in can view it) or fully public — recommend restricting it to logged-in IT Avenue users for privacy.

\* Team Lead task-creation is optional — decide whether you want leads limited to *assigning* tasks created above them, or able to spin up their own team-level tasks. Recommendation: allow it, scoped to their own team only.

**Note on the admin tier:** President, Senior Director, and Co-Director are all admins — each can see across the whole division (not just their own projects) and reach system settings. What still separates them is the *assignment chain* (who can add/promote whom, per rows above) and override authority in disputes — see Section 8.

**Key rule — no self-approval:** an assignee can never approve their own task. If a Co-Director is the assignee, approval escalates to the Senior Director or President automatically.

---

## 3. Data Model

### User
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| name, email | string | |
| role | enum | president, senior_director, co_director, team_lead, member |
| team_id | FK → Team | nullable for President/Senior Director |
| manager_id | FK → User | who added/manages this user |
| status | enum | active, inactive |

### Team
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| name | string | e.g. "Network Team", "Support Team" |
| lead_id | FK → User | |
| co_director_id | FK → User | which co-director oversees this team |

### Project
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| title, description | string/text | |
| created_by | FK → User | Senior Director or Co-Director only |
| status | enum | active, on_hold, completed, archived |
| start_date, due_date | date | |

### Task
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| project_id | FK → Project | nullable — null means "general task" |
| title, description | string/text | |
| created_by | FK → User | |
| assigned_to | FK → User | nullable until claimed |
| priority | enum | low, medium, high, urgent |
| status | enum | open, in_progress, pending_approval, completed, rejected |
| due_date | date | |
| approver_id | FK → User | resolved at approval time, never the assignee |

### Approval
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| task_id | FK → Task | |
| decided_by | FK → User | |
| decision | enum | approved, rejected |
| comment | text | required if rejected |
| decided_at | timestamp | |

### AuditLog
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| entity_type, entity_id | string, UUID | polymorphic (task, project, user) |
| action | string | created, assigned, claimed, submitted, approved, rejected, reassigned |
| actor_id | FK → User | |
| timestamp | timestamp | |

### Notification
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| user_id | FK → User | recipient |
| type | enum | task_assigned, approval_needed, task_rejected, task_overdue |
| task_id | FK → Task | |
| read | boolean | |
| created_at | timestamp | |

---

## 4. Task Lifecycle (State Machine)

```
   [open] --claim--> [in_progress] --submit--> [pending_approval]
                            ^                          |
                            |                    approve | reject
                            |                          |     |
                            +------ reassign <---- [rejected] |
                                                          v
                                                    [completed]
```

**States**
1. **Open** — created, unassigned (or assigned but not yet started).
2. **In progress** — a member has claimed it or been assigned and is working on it.
3. **Pending approval** — member marked it done; sitting with the resolved approver.
4. **Rejected** — approver sent it back with a required comment; returns to *in progress*, notifies the assignee.
5. **Completed** — approved; locked, timestamped, counted toward contribution metrics.

**Un-claiming:** a member can drop a task only while it's in **open** or **in_progress** (not pending_approval). Dropping requires a short reason and notifies the Team Lead so it can be reassigned rather than sitting orphaned.

**Escalation timeout:** if a task sits in `pending_approval` for more than N days (configurable, suggest 3), auto-notify the next level up as a backup approver.

---

## 5. Core Workflows

**Onboarding a user (Email Invitation Flow)**
- The system is strict invite-only. A user with appropriate permissions (President, Senior Director, Co-Director, or Team Lead) enters the new employee's name, email, role, and team.
- The system immediately creates an underlying database record mapping their role and team.
- Supabase automatically sends a secure email invitation to the user's email address.
- The user clicks the link in the email, sets their password, and their account is fully activated.

**Creating and assigning work**
1. Senior Director or Co-Director creates a Project.
2. They (or the relevant Team Lead) add Tasks inside it, or post a standalone general Task.
3. Task is either pre-assigned to a Member, or left open for claiming.
4. Member claims it → status `in_progress`.

**Completing work**
1. Member finishes → clicks "Submit for approval" → status `pending_approval`, `approver_id` resolved to the Co-Director overseeing that project/team (Senior Director or President if the assignee is themselves an admin, to avoid self-approval).
2. Approver reviews:
   - **Approve** → status `completed`, logged, counts toward contribution stats.
   - **Reject** → required comment, status → `in_progress`, assignee notified.

**Reassignment**
- Team Lead or Co-Director can reassign an open/in-progress task manually; the audit log records the change and reason.

---

## 6. Dashboards (role-based views)

| Dashboard | President / Senior Director / Co-Director | Team Lead | Member |
|---|---|---|---|
| Scope | Entire division (all three are admin-tier) | Own team | Own tasks |
| Widgets | Division-wide completion rate, overdue tasks, team comparison, pending approvals | Team task board, member workload, tasks awaiting approval (view-only) | My tasks, my contribution history, open tasks I can claim |
| Actions | Create projects/tasks, approve, reassign; President/Senior Director can also override approvals | Assign members, monitor progress (cannot approve) | Claim, submit, drop |

---

## 7. Notifications

Trigger a notification (in-app + optional email) on:
- Task assigned to you
- Task submitted and awaiting your approval
- Task you submitted was rejected (with comment)
- Task approaching due date / overdue
- Approval pending too long → escalated to backup approver

---

## 8. Edge Cases Addressed

- **No self-approval** — approver is resolved server-side, excluding the assignee.
- **Stalled approvals** — timeout-based escalation to the next role up.
- **Orphaned tasks** — dropping a claim notifies the Team Lead automatically.
- **Rejection loop** — explicit `rejected` state with mandatory comment, distinct from simply reopening.
- **Admin overlap (President / Senior Director / Co-Director)** — all three see division-wide data and can create/approve. Recommend keeping the President as the sole true superuser (can override/reassign anything, resolve disputes between other admins), while Senior Director and Co-Director have equal day-to-day admin rights but no override authority over each other.
- **Audit trail** — every state change and role-management action is logged for accountability.

---

## 9. Suggested Build Approach

- **Stack:** any standard web stack works (e.g., React/Vue frontend, Node/Django/Rails backend, Postgres). Role-based access control (RBAC) middleware should check permissions against the matrix in Section 2 on every request, not just hide UI elements.
- **Phase 1 (MVP):** user roles, project/task CRUD, claim/submit/approve flow, basic dashboard per role.
- **Phase 2:** notifications, escalation timeouts, audit log, contribution analytics.
- **Phase 3:** reporting exports, cross-team comparisons, integrations (email/Slack notifications).
