import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { useAuthStore } from '@/store/auth.store';
// import { TASK_ENDPOINTS } from '@/lib/api-endpints';
import { taskService, type TaskStatus } from '@/services/task.service';

interface ReviewTask {
  id: number;
  taskId: number;
  assetId: string;
  projectId: number;
  requestedById: number;
  reviewedById: number | null;
  status: TaskStatus;
  comments?: string;
  requestedAt: string;
  reviewedAt: string;
  requestedBy: {
    id: number;
    username: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  reviewedBy: {
    id: number;
    username: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  task: {
    title: string;
    description: string | null;
    taskType: 'ASSET_BASED' | 'MANUAL';
  };
}

export function ProjectReviewsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const user = useAuthStore((s) => s.user);
  const role = user?.role?.name ?? 'MEMBER';
  const canReview = ['REVIEWER', 'ADMIN', 'MANAGER'].includes(role);

  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewTask, setViewTask] = useState<ReviewTask | null>(null);
  const [feedback, setFeedback] = useState('');
  const [actioning, setActioning] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await taskService.getPendingApprovals(Number(projectId));
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const doAction = async (taskId: number, status: 'APPROVED' | 'FAILED') => {
    setActioning(true);
    try {
      // await fetch(TASK_ENDPOINTS.CHANGE_STATUS(Number(projectId), taskId), {
      //   method: 'PATCH',
      //   credentials: 'include',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status, feedback }),
      // });
      await taskService.changeStatus(
        Number(projectId),
        taskId,
        status,
        feedback,
      );
      setViewTask(null);
      setFeedback('');
      fetchTasks();
    } finally {
      setActioning(false);
    }
  };

  const title = projectId ? 'Review Queue' : 'My Review Queue';

  return (
    <div className="flex flex-col gap-6 px-6 py-6 w-full max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {canReview
            ? 'Review and approve or reject submitted assets.'
            : 'Assets currently in review . . . read only.'}
        </p>
      </div>

      <Separator />

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <CheckCircle2 className="h-12 w-12 text-emerald-400/50" />
          <p className="text-muted-foreground text-sm">
            No tasks in review right now.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Id</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Reviewed By</TableHead>
                <TableHead>Requested At</TableHead>
                <TableHead className="px-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <p className="font-medium text-sm">Task - {task.taskId}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">{task.task.title}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {task.task.taskType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {task?.requestedBy?.username ?? '. . .'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {task?.reviewedBy?.username ?? '. . .'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(task.requestedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewTask(task)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      {canReview && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => doAction(task.id, 'APPROVED')}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => {
                              setViewTask(task);
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={!!viewTask}
        onOpenChange={(o) => {
          if (!o) {
            setViewTask(null);
            setFeedback('');
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewTask?.task.title}</DialogTitle>
          </DialogHeader>

          {viewTask?.ass && (
            <div className="rounded-lg overflow-hidden border">
              {viewTask.asset.mimeType?.startsWith('image/') ? (
                <img
                  src={
                    viewTask.asset.thumbnailUrl ?? viewTask.asset.originalUrl
                  }
                  alt=""
                  className="w-full max-h-64 object-contain bg-muted"
                />
              ) : viewTask.asset.mimeType?.startsWith('video/') ? (
                <video
                  src={viewTask.asset.originalUrl}
                  controls
                  className="w-full max-h-64"
                />
              ) : (
                <div className="p-4 text-center">
                  <a
                    href={viewTask.asset.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Open file ↗
                  </a>
                </div>
              )}
            </div>
          )}

          {canReview && (
            <div className="space-y-1.5">
              <Label>
                Feedback{' '}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                rows={3}
                placeholder="Leave feedback for the submitter..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setViewTask(null);
                setFeedback('');
              }}
            >
              Close
            </Button>
            {canReview && viewTask && (
              <>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200"
                  onClick={() => doAction(viewTask.taskId, 'FAILED')}
                  disabled={actioning}
                >
                  {actioning ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-1" />
                  )}
                  Reject
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => doAction(viewTask.id, 'APPROVED')}
                  disabled={actioning}
                >
                  {actioning ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                  )}
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProjectReviewsPage;
