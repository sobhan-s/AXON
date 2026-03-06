import type { Task } from "@/interfaces/Task.interface";
import type { TaskStatus } from "@/services/task.service";

export const STATUS_BADGE: Record<
  Task['status'],
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
  }
> = {
  TODO: { label: 'To Do', variant: 'outline' },
  IN_PROGRESS: {
    label: 'In Progress',
    variant: 'default',
    className: 'bg-blue-500',
  },
  REVIEW: { label: 'In Review', variant: 'default', className: 'bg-amber-500' },
  APPROVED: {
    label: 'Approved',
    variant: 'default',
    className: 'bg-emerald-500',
  },
  FAILED: { label: 'Failed', variant: 'destructive' },
  DONE: { label: 'Done', variant: 'secondary' },
};

export const PRIORITY_BADGE: Record<string, string> = {
  HIGH: 'text-red-600 bg-red-50',
  MEDIUM: 'text-amber-600 bg-amber-50',
  LOW: 'text-slate-500 bg-slate-100',
};

export const ROLES = [
  { id: 3, name: 'LEAD' },
  { id: 4, name: 'REVIEWER' },
  { id: 5, name: 'MEMBER' },
];

export const ROLE_VARIANT: Record<string, string> = {
  MANAGER: 'bg-blue-100 text-blue-700',
  LEAD: 'bg-emerald-100 text-emerald-700',
  REVIEWER: 'bg-amber-100 text-amber-700',
  MEMBER: 'bg-slate-100 text-slate-700',
};

export const STATUS_STYLE: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  TODO: {
    label: 'To Do',
    className:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  REVIEW: {
    label: 'In Review',
    className:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  APPROVED: {
    label: 'Approved',
    className:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  FAILED: {
    label: 'Failed',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    dot: 'bg-red-500',
  },
  DONE: {
    label: 'Done',
    className:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
};

export const STATUS_ORDER = ['TODO', 'IN_PROGRESS', 'REVIEW', 'APPROVED', 'DONE'];

export const PRIORITY_STYLE: Record<string, string> = {
  URGENT:
    'bg-purple-50 text-purple-600 dark:bg-purple-900/20 border border-purple-200',
  HIGH: 'bg-red-50 text-red-600 dark:bg-red-900/20 border border-red-200',
  MEDIUM:
    'bg-amber-50 text-amber-600 dark:bg-amber-900/20 border border-amber-200',
  LOW: 'bg-slate-100 text-slate-500 dark:bg-slate-800 border border-slate-200',
};

export const STATUS_TRANSITIONS: Record<string, TaskStatus[]> = {
  TODO: ['IN_PROGRESS'],
  IN_PROGRESS: ['REVIEW'],
  REVIEW: ['APPROVED', 'FAILED'],
  APPROVED: ['DONE'],
  FAILED: ['IN_PROGRESS'],
  DONE: [],
};

export const ROLE_COLORS: Record<string, string> = {
  ADMIN:
    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  MANAGER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  LEAD: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  REVIEWER:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  MEMBER: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

