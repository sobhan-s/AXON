import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2,
  Plus,
  Search,
  MoreHorizontal,
  // AlertCircle,
  // Pencil,
  Trash2,
  // UserCheck,
  ArrowRightCircle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useAuthStore } from '@/store/auth.store';
import { taskService, type TaskStatus } from '@/services/task.service';
import { Checkbox } from '@/components/ui/checkbox';

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'APPROVED' | 'FAILED' | 'DONE';
  taskType: 'MANUAL' | 'ASSET_BASED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | null;
  dueDate: string | null;
  assignedTo: {
    id: number;
    username: string;
    avatarUrl: string | null;
  } | null;
  projectId: number;
  createdBy?: {
    id: number;
    username: string;
    avatarUrl: string | null;
  } | null;
  _count: {
    timeLogs: number;
    approvals: number;
  };
}

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  TODO: {
    label: 'To Do',
    className:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  REVIEW: {
    label: 'In Review',
    className:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  APPROVED: {
    label: 'Approved',
    className:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  FAILED: {
    label: 'Failed',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
  DONE: {
    label: 'Done',
    className:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  },
};

const PRIORITY_STYLE: Record<string, string> = {
  HIGH: 'bg-red-50 text-red-600 dark:bg-red-900/20',
  MEDIUM: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
  LOW: 'bg-slate-100 text-slate-500 dark:bg-slate-800',
  URGENT: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
};

const createSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0.1).max(999),
});

const updateTaskSchema = {
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional(),
  // estimatedHours: z.number().min(0.1).max(999).optional(),
};

type CreateValues = z.infer<typeof createSchema>;
type UpdateValues = z.infer<typeof updateTaskSchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}
function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
      {message}
    </p>
  );
}

export default function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const user = useAuthStore((s) => s.user);
  const role = user?.role?.name ?? 'MEMBER';
  const canCreateTask = ['ADMIN', 'MANAGER', 'LEAD'].includes(role);
  const canDeleteTask = ['ADMIN', 'MANAGER', 'LEAD'].includes(role);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [changeStatusTarget, setChangeStatusTarget] = useState<Task | null>(
    null,
  );
  const [selectedRows, setSelectedRows] = useState([]);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const tasks: Task[] = await taskService.getProjectTasks(
        Number(projectId),
      );
      setTasks(tasks);
    } catch {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filtered = tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const form = useForm<CreateValues>({ resolver: zodResolver(createSchema) });

  const onCreateTask = async (values: CreateValues) => {
    console.log('CREATE TASK PAYLOAD:', values);
    if (!projectId) return;

    try {
      await taskService.createTask(Number(projectId), values);
      setCreateOpen(false);
      form.reset();
      fetchTasks();
    } catch {
      form.setError('root', { message: 'Failed to create task' });
    }
  };

  const onDeleteTask = async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    try {
      await taskService.deleteTask(deleteTarget.id);
      setDeleteTarget(null);
      fetchTasks();
    } finally {
      setDeleteLoading(false);
    }
  };

  // const onEditTask = async () => {
  //   if(!projectId)  return;
  //   if()
  // }

  const onChangeStatus = async (task: Task, status: Task['status']) => {
    if (!projectId) return;

    await taskService.changeStatus(
      Number(projectId),
      task.id,
      status as TaskStatus,
    );

    setChangeStatusTarget(null);
    fetchTasks();
  };

  const counts = tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6 px-6 py-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Board</h1>
          <p className="text-muted-foreground text-sm mt-1">
            All tasks in this project.
          </p>
        </div>
        {canCreateTask && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Task
          </Button>
        )}
      </div>

      {!loading && (
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(STATUS_STYLE).map(([key, s]) => (
            <button
              key={key}
              onClick={() =>
                setStatusFilter(statusFilter === key ? 'ALL' : key)
              }
              className={`text-xs font-medium px-3 py-1 rounded-full border transition-all
                ${
                  statusFilter === key
                    ? s.className + ' border-transparent'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted'
                }`}
            >
              {s.label} {counts[key] ? `(${counts[key]})` : ''}
            </button>
          ))}
          {statusFilter !== 'ALL' && (
            <button
              onClick={() => setStatusFilter('ALL')}
              className="text-xs text-muted-foreground hover:text-foreground ml-1"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Separator />

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-center py-24 text-destructive text-sm">{error}</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <p className="text-muted-foreground text-sm">No tasks found.</p>
          {canCreateTask && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create first task
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100">
                <TableHead>
                  <Checkbox
                    className="border-slate-600"
                    checked={
                      selectedRows.length === filtered.length &&
                      filtered.length > 0
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const allIds = filtered.map((task) => task.id);
                        setSelectedRows(allIds);
                      } else {
                        setSelectedRows([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Task ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Reviewed By</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((task) => {
                const s = STATUS_STYLE[task.status];
                const overdue =
                  task.dueDate &&
                  !['DONE', 'APPROVED'].includes(task.status) &&
                  new Date(task.dueDate) < new Date();
                return (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Checkbox
                        className="border-slate-600"
                        checked={selectedRows.includes(Number(task?.id))}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRows((prev) => [...prev, task.id]);
                          } else {
                            setSelectedRows((prev) =>
                              prev.filter((id) => id !== task.id),
                            );
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      TASK-{task.id}
                    </TableCell>

                    <TableCell>
                      <p className="font-medium text-sm">{task.title}</p>
                    </TableCell>

                    <TableCell>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          STATUS_STYLE[task.status].className
                        }`}
                      >
                        {STATUS_STYLE[task.status].label}
                      </span>
                    </TableCell>

                    <TableCell>
                      {task.priority ? (
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            PRIORITY_STYLE[task.priority]
                          }`}
                        >
                          {task.priority}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {task.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center text-xs font-semibold">
                            {task.assignedTo.username}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-muted-foreground">—</span>
                    </TableCell>

                    <TableCell>
                      {task.dueDate ? (
                        <span className="text-xs text-muted-foreground">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setChangeStatusTarget(task)}
                          >
                            <ArrowRightCircle className="h-4 w-4 mr-2" />
                            Change Status
                          </DropdownMenuItem>

                          {canDeleteTask && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteTarget(task)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Add a new task to this project.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onCreateTask)}
            className="space-y-4"
            noValidate
          >
            <FormError message={form.formState.errors.root?.message} />
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input placeholder="Task title" {...form.register('title')} />
              <FieldError message={form.formState.errors.title?.message} />
            </div>
            <div className="space-y-1.5">
              <Label>
                Description{' '}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                rows={3}
                placeholder="Details..."
                {...form.register('description')}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  onValueChange={(v) => form.setValue('priority', v as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">URGENT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" {...form.register('dueDate')} />
              </div>
              <div className="space-y-1.5">
                <Label>Estimated Hours</Label>
                <Input
                  type="number"
                  // defaultValue={10}
                  placeholder="estimate hour"
                  {...form.register('estimatedHours', { valueAsNumber: true })}
                />
                <FieldError
                  message={form.formState.errors.estimatedHours?.message}
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Status Modal */}
      <Dialog
        open={!!changeStatusTarget}
        onOpenChange={(o) => {
          if (!o) setChangeStatusTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>
              Move: <strong>{changeStatusTarget?.title}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            {Object.entries(STATUS_STYLE).map(([key, s]) => (
              <button
                key={key}
                onClick={() =>
                  changeStatusTarget &&
                  onChangeStatus(changeStatusTarget, key as TaskStatus)
                }
                className={`text-left text-sm font-medium px-3 py-2.5 rounded-lg transition-colors hover:opacity-80 ${s.className}
                  ${changeStatusTarget?.status === key ? 'ring-2 ring-offset-1 ring-current' : ''}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteTarget?.title}</strong>? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteTask}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
