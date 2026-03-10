import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  ArrowRightCircle,
  ExternalLink,
  Users,
  CheckSquare2,
  X,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
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
import { toast } from 'sonner';

import { useAuthStore } from '@/store/auth.store';
import { taskService, type TaskStatus } from '@/services/task.service';
import { projectService, type ProjectMember } from '@/services/Project.service';
import type { Task } from '@/interfaces/projectBoard';
import { createSchema, type CreateValues } from '@/validations/createTask.validations';
import { PRIORITY_STYLE, STATUS_STYLE, STATUS_TRANSITIONS } from '@/constants/statusType';
import { FieldError, FormError } from '@/helper/error';

export default function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
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
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkAssignUserId, setBulkAssignUserId] = useState('');
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await taskService.getProjectTasks(Number(projectId));
      setTasks(result);
    } catch {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const fetchMembers = async () => {
    if (!projectId || membersLoading) return;
    setMembersLoading(true);
    try {
      const data = await projectService.getTeam(
        user?.organizationId ?? 0,
        Number(projectId),
      );
      setMembers(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Could not load members');
    } finally {
      setMembersLoading(false);
    }
  };

  const onBulkAssign = async () => {
    if (!projectId || !bulkAssignUserId || selectedRows.length === 0) return;
    try {
      await taskService.bulkAssign(Number(projectId), {
        taskIds: selectedRows,
        assignedToId: Number(bulkAssignUserId),
      });
      const assignedUser = members.find(
        (m) => String(m.userId) === bulkAssignUserId,
      );
      setSelectedRows([]);
      setBulkAssignOpen(false);
      setBulkAssignUserId('');
      fetchTasks();
      toast.success('Tasks assigned', {
        description: `${selectedRows.length} task(s) assigned to ${assignedUser?.user.username ?? 'user'}.`,
      });
    } catch {
      toast.error('Error', { description: 'Bulk assign failed.' });
    }
  };

  const filtered = tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  const form = useForm<CreateValues>({ resolver: zodResolver(createSchema) });

  const onCreateTask = async (values: CreateValues) => {
    if (!projectId) return;
    try {
      await taskService.createTask(Number(projectId), values);
      setCreateOpen(false);
      form.reset();
      fetchTasks();
      toast.success('Task created', {
        description: `"${values.title}" added to the board.`,
      });
    } catch {
      form.setError('root', { message: 'Failed to create task' });
      toast.error('Error', { description: 'Failed to create task.' });
    }
  };

  const onDeleteTask = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await taskService.deleteTask(deleteTarget.id);
      setDeleteTarget(null);
      fetchTasks();
      toast.success('Task deleted', {
        description: `"${deleteTarget.title}" was removed.`,
      });
    } catch {
      toast.error('Error', { description: 'Failed to delete task.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const onChangeStatus = async (task: Task, status: TaskStatus) => {
    if (!projectId) return;
    try {
      await taskService.changeStatus(Number(projectId), task.id, status);
      setChangeStatusTarget(null);
      fetchTasks();
      toast.success('Status updated', {
        description: `Task moved to ${STATUS_STYLE[status].label}.`,
      });
    } catch {
      toast.error('Error', { description: 'Failed to change status.' });
    }
  };

  const onBulkDelete = async () => {
    if (!projectId || selectedRows.length === 0) return;
    try {
      await taskService.bulkDelete(Number(projectId), {
        taskIds: selectedRows,
      });
      setSelectedRows([]);
      setBulkDeleteOpen(false);
      fetchTasks();
      toast.success('Tasks deleted', {
        description: `${selectedRows.length} task(s) removed.`,
      });
    } catch {
      toast.error('Error', { description: 'Bulk delete failed.' });
    }
  };

  const onBulkStatus = async (status: TaskStatus) => {
    try {
      await taskService.bulkChangeStatus({ taskIds: selectedRows, status });
      setSelectedRows([]);
      setBulkStatusOpen(false);
      fetchTasks();
      toast.success('Status updated', {
        description: `${selectedRows.length} task(s) moved to ${STATUS_STYLE[status].label}.`,
      });
    } catch {
      toast.error('Error', { description: 'Bulk status update failed.' });
    }
  };

  const allSelected =
    filtered.length > 0 && selectedRows.length === filtered.length;
  const someSelected = selectedRows.length > 0;

  return (
    <div className="flex flex-col gap-6 px-6 py-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Board</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} in this project
          </p>
        </div>
        <div className="flex items-center gap-2">
          {someSelected && (
            <>
              <span className="text-xs text-muted-foreground mr-1">
                {selectedRows.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkStatusOpen(true)}
              >
                <ArrowRightCircle className="h-3.5 w-3.5 mr-1.5" /> Change
                Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchMembers();
                  setBulkAssignOpen(true);
                }}
              >
                <Users className="h-3.5 w-3.5 mr-1.5" /> Assign
              </Button>
              {canDeleteTask && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/5"
                  onClick={() => setBulkDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRows([])}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          {canCreateTask && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Task
            </Button>
          )}
        </div>
      </div>

      {!loading && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
              statusFilter === 'ALL'
                ? 'bg-foreground text-background border-transparent'
                : 'border-border bg-background text-muted-foreground hover:bg-muted'
            }`}
          >
            All ({tasks.length})
          </button>
          {Object.entries(STATUS_STYLE).map(([key, s]) => (
            <button
              key={key}
              onClick={() =>
                setStatusFilter(statusFilter === key ? 'ALL' : key)
              }
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                statusFilter === key
                  ? s.className + ' border-transparent'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label} {counts[key] ? `(${counts[key]})` : '(0)'}
            </button>
          ))}
        </div>
      )}

      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <Separator />

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-center py-24 text-destructive text-sm">{error}</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <CheckSquare2 className="h-12 w-12 text-muted-foreground/20" />
          <p className="text-muted-foreground text-sm">
            {search || statusFilter !== 'ALL'
              ? 'No tasks match your filters.'
              : 'No tasks yet.'}
          </p>
          {canCreateTask && !search && statusFilter === 'ALL' && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create first task
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => {
                      setSelectedRows(checked ? filtered.map((t) => t.id) : []);
                    }}
                  />
                </TableHead>
                <TableHead className="w-24 text-xs font-semibold text-muted-foreground">
                  ID
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Title
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Priority
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Assigned To
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Approvals
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Due Date
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Logs
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((task) => {
                const overdue =
                  task.dueDate &&
                  !['DONE', 'APPROVED'].includes(task.status) &&
                  new Date(task.dueDate) < new Date();
                const isSelected = selectedRows.includes(task.id);

                return (
                  <TableRow
                    key={task.id}
                    className={`group transition-colors cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
                    onClick={() =>
                      navigate(`/projects/${task.projectId}/tasks/${task.id}`)
                    }
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          setSelectedRows((prev) =>
                            checked
                              ? [...prev, task.id]
                              : prev.filter((id) => id !== task.id),
                          );
                        }}
                      />
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground">
                      TASK-{task.id}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <p
                            className={`font-medium text-sm group-hover:text-primary transition-colors ${overdue ? 'text-red-600' : ''}`}
                          >
                            {task.title}
                          </p>
                        </div>
                        {task.taskType === 'ASSET_BASED' && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/20 shrink-0">
                            ASSET
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[task.status].className}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLE[task.status].dot}`}
                        />
                        {STATUS_STYLE[task.status].label}
                      </span>
                    </TableCell>

                    <TableCell>
                      {task.priority ? (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[task.priority]}`}
                        >
                          {task.priority}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          . . .
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {task.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                            {task.assignedTo.username.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs font-medium">
                            {task.assignedTo.username}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {task._count.approvals > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {task._count.approvals} approvals
                          {task._count.approvals > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          . . .
                        </span>
                      )}
                    </TableCell>

                    {/* Due Date */}
                    <TableCell>
                      {task.dueDate ? (
                        <span
                          className={`text-xs font-medium ${overdue ? 'text-red-600' : 'text-muted-foreground'}`}
                        >
                          {overdue && '⚠ '}
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          . . .
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {task._count.timeLogs}
                      </span>
                    </TableCell>

                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(
                                `/projects/${task.projectId}/tasks/${task.id}`,
                              )
                            }
                          >
                            <ExternalLink className="h-4 w-4 mr-2" /> Open
                            Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setChangeStatusTarget(task)}
                          >
                            <ArrowRightCircle className="h-4 w-4 mr-2" /> Change
                            Status
                          </DropdownMenuItem>
                          {canDeleteTask && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteTarget(task)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
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

      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) form.reset();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Add a new manual task to this project.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onCreateTask)}
            className="space-y-4"
            noValidate
          >
            <FormError message={form.formState.errors.root?.message} />
            <div className="space-y-1.5">
              <Label>
                Title <span className="text-destructive">*</span>
              </Label>
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
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" {...form.register('dueDate')} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>
                  Estimated Hours <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="e.g. 8"
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
            {changeStatusTarget &&
              STATUS_TRANSITIONS[changeStatusTarget.status].length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  This task is complete . . . no further transitions available.
                </p>
              )}
            {changeStatusTarget &&
              STATUS_TRANSITIONS[changeStatusTarget.status].map((key) => {
                const s = STATUS_STYLE[key];
                return (
                  <button
                    key={key}
                    onClick={() =>
                      onChangeStatus(changeStatusTarget, key as TaskStatus)
                    }
                    className={`flex items-center gap-2 text-left text-sm font-medium px-3 py-2.5 rounded-lg transition-colors hover:opacity-80 ${s.className}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    {s.label}
                  </button>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkStatusOpen} onOpenChange={setBulkStatusOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Bulk Change Status</DialogTitle>
            <DialogDescription>
              Apply to {selectedRows.length} selected task(s).
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            {(Object.keys(STATUS_STYLE) as TaskStatus[])
              // .filter((k) => k !== 'TODO')
              .map((key) => {
                const s = STATUS_STYLE[key];
                return (
                  <button
                    key={key}
                    onClick={() => onBulkStatus(key)}
                    className={`flex items-center gap-2 text-left text-sm font-medium px-3 py-2.5 rounded-lg transition-colors hover:opacity-80 ${s.className}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    {s.label}
                  </button>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>

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

      <Dialog
        open={bulkAssignOpen}
        onOpenChange={(o) => {
          setBulkAssignOpen(o);
          if (!o) setBulkAssignUserId('');
        }}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Bulk Assign</DialogTitle>
            <DialogDescription>
              Assign {selectedRows.length} selected task(s) to a team member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Assign to</Label>
            <Select
              value={bulkAssignUserId}
              onValueChange={setBulkAssignUserId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={membersLoading ? 'Loading...' : 'Choose member'}
                />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.userId} value={String(m.userId)}>
                    <span className="font-medium">{m.user.username}</span>
                    <span className="ml-2 text-xs text-muted-foreground capitalize">
                      ({m.role.name.toLowerCase()})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Tasks already assigned will be reassigned to this person.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBulkAssignOpen(false);
                setBulkAssignUserId('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={onBulkAssign}
              disabled={!bulkAssignUserId || membersLoading}
            >
              Assign {selectedRows.length} Task
              {selectedRows.length > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Delete Confirm ── */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedRows.length} Task
              {selectedRows.length > 1 ? 's' : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedRows.length} task(s). This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
