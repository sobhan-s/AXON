import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2,
  CheckSquare,
  Clock,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useAuthStore } from '@/store/auth.store';
import { TASK_ENDPOINTS } from '@/lib/api-endpints';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'APPROVED' | 'FAILED' | 'DONE';
  taskType: 'MANUAL' | 'ASSET_BASED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  dueDate: string | null;
  projectId: number;
  project?: {
    id: number;
    name: string;
    slug: string;
  };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<
  Task['status'],
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
  }
> = {
  TODO: { label: 'To Do', variant: 'outline', className: '' },
  IN_PROGRESS: {
    label: 'In Progress',
    variant: 'default',
    className: 'bg-blue-500 hover:bg-blue-500/90',
  },
  REVIEW: {
    label: 'In Review',
    variant: 'default',
    className: 'bg-amber-500 hover:bg-amber-500/90',
  },
  APPROVED: {
    label: 'Approved',
    variant: 'default',
    className: 'bg-emerald-500 hover:bg-emerald-500/90',
  },
  FAILED: { label: 'Failed', variant: 'destructive', className: '' },
  DONE: { label: 'Done', variant: 'secondary', className: '' },
};

const PRIORITY_BADGE: Record<string, string> = {
  HIGH: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  MEDIUM: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  LOW: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
};

function isOverdue(dueDate: string | null, status: Task['status']) {
  if (!dueDate || status === 'DONE' || status === 'APPROVED') return false;
  return new Date(dueDate) < new Date();
}

export default function MyTasksPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(TASK_ENDPOINTS.GET_MY_TASKS, {
        credentials: 'include',
      });
      const data = await res.json();
      setTasks(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // All unique projects from tasks
  const projects = Array.from(
    new Map(
      tasks.filter((t) => t.project).map((t) => [t.projectId, t.project!]),
    ).values(),
  );

  // Filtered tasks
  const filtered = tasks.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (projectFilter !== 'ALL' && String(t.projectId) !== projectFilter)
      return false;
    return true;
  });

  // Group by project
  const grouped = filtered.reduce<
    Record<number, { project: Task['project']; tasks: Task[] }>
  >((acc, task) => {
    const pid = task.projectId;
    if (!acc[pid]) acc[pid] = { project: task.project, tasks: [] };
    acc[pid].tasks.push(task);
    return acc;
  }, {});

  const totalOverdue = tasks.filter((t) =>
    isOverdue(t.dueDate, t.status),
  ).length;

  return (
    <div className="flex flex-col gap-6 px-6 py-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground text-sm mt-1">
          All tasks assigned to you, grouped by project.
        </p>
      </div>

      {/* Summary bar */}
      {!loading && !error && (
        <div className="flex items-center gap-6 text-sm">
          <span className="flex items-center gap-1.5">
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{tasks.length}</span>
            <span className="text-muted-foreground">total</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="font-medium">
              {tasks.filter((t) => t.status === 'IN_PROGRESS').length}
            </span>
            <span className="text-muted-foreground">in progress</span>
          </span>
          {totalOverdue > 0 && (
            <span className="flex items-center gap-1.5 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">{totalOverdue}</span>
              <span>overdue</span>
            </span>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="TODO">To Do</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="REVIEW">In Review</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
          </SelectContent>
        </Select>

        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(statusFilter !== 'ALL' || projectFilter !== 'ALL') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter('ALL');
              setProjectFilter('ALL');
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <Separator />

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-center py-24 text-destructive text-sm">{error}</p>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <CheckSquare className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No tasks found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Object.values(grouped).map(({ project, tasks: projectTasks }) => (
            <div key={project?.id ?? 'unknown'}>
              {/* Project header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-sm">
                    {project?.name ?? 'Unknown Project'}
                  </h2>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {projectTasks.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => navigate(`/projects/${project?.id}/board`)}
                >
                  View board <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>

              {/* Task rows */}
              <div className="flex flex-col divide-y border rounded-xl overflow-hidden">
                {projectTasks.map((task) => {
                  const overdue = isOverdue(task.dueDate, task.status);
                  const s = STATUS_BADGE[task.status];
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 px-4 py-3 bg-background hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() =>
                        navigate(`/projects/${task.projectId}/board`)
                      }
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${overdue ? 'text-red-600' : ''}`}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {task.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {task.priority && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[task.priority]}`}
                          >
                            {task.priority}
                          </span>
                        )}

                        <Badge
                          variant={s.variant}
                          className={`text-xs ${s.className}`}
                        >
                          {s.label}
                        </Badge>

                        {overdue && (
                          <span className="flex items-center gap-1 text-[10px] text-red-600 font-medium">
                            <AlertCircle className="h-3 w-3" /> Overdue
                          </span>
                        )}

                        {task.dueDate && !overdue && (
                          <span className="text-[10px] text-muted-foreground">
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
