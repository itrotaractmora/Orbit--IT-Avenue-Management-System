export const UserRole = {
  PRESIDENT: 'PRESIDENT',
  SENIOR_DIRECTOR: 'SENIOR_DIRECTOR',
  CO_DIRECTOR: 'CO_DIRECTOR',
  TEAM_LEAD: 'TEAM_LEAD',
  MEMBER: 'MEMBER'
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
} as const;
export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

export const ProjectStatus = {
  ACTIVE: 'ACTIVE',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED'
} as const;
export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
} as const;
export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];

export const TaskStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED'
} as const;
export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export const ApprovalDecision = {
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;
export type ApprovalDecision = typeof ApprovalDecision[keyof typeof ApprovalDecision];

export const JoinRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;
export type JoinRequestStatus = typeof JoinRequestStatus[keyof typeof JoinRequestStatus];

export const NotificationType = {
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  APPROVAL_NEEDED: 'APPROVAL_NEEDED',
  TASK_REJECTED: 'TASK_REJECTED',
  TASK_OVERDUE: 'TASK_OVERDUE'
} as const;
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];
