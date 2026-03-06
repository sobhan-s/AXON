import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

import { TASK_ENDPOINTS } from '@/lib/api-endpints';
import type { Task } from '@/interfaces/Task.interface';
import { PRIORITY_BADGE, STATUS_BADGE } from '@/constants/statusType';

function isOverdue(dueDate: string | null, status: Task['status']) {
  if (!dueDate || status === 'DONE' || status === 'APPROVED') return false;
  return new Date(dueDate) < new Date();
}

export default function MyTasksPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(TASK_ENDPOINTS.GET_MY_TASKS(Number(projectId)), {
        credentials: 'include',
      });

      const data = await res.json();

      setTasks(Array.isArray(data?.data) ? data.data : []);
    } catch {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks =
    statusFilter === 'ALL'
      ? tasks
      : tasks.filter((t) => t.status === statusFilter);

  const totalOverdue = tasks.filter((t) =>
    isOverdue(t.dueDate, t.status),
  ).length;

  return (
    <div className="flex flex-col gap-6 px-6 py-6 w-full max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tasks assigned to you in this project.
        </p>
      </div>

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

      <div className="flex items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="TODO">To Do</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="REVIEW">Review</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
          </SelectContent>
        </Select>

        <span className="px-[819px]">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground "
            onClick={() => navigate(`/projects/${projectId}/board`)}
          >
            View board <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </span>

        {statusFilter !== 'ALL' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter('ALL')}
          >
            Clear
          </Button>
        )}
      </div>

      <Separator />

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-center py-24 text-destructive text-sm">{error}</p>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <CheckSquare className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No tasks found.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y border rounded-xl overflow-hidden">
          {filteredTasks.map((task) => {
            const overdue = isOverdue(task.dueDate, task.status);
            const s = STATUS_BADGE[task.status];

            return (
              <div
                key={task.id}
                className="flex items-center gap-3 px-4 py-3 bg-background hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => navigate(`/projects/${task.projectId}/board`)}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      overdue ? 'text-red-600' : ''
                    }`}
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
                    className={`text-xs ${s.className ?? ''}`}
                  >
                    {s.label}
                  </Badge>

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
      )}
    </div>
  );
}
