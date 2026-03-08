import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Paperclip,
  Calendar,
  User,
  Tag,
  AlertCircle,
  ChevronRight,
  Edit2,
  Eye,
  Download,
  FileText,
  ImageIcon,
  Film,
  Star,
  Clock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import { useAuthStore } from '@/store/auth.store';
import {
  taskService,
  type TaskStatus,
  type Task,
} from '@/services/task.service';
import { projectService, type ProjectMember } from '@/services/Project.service';
import UploadSection from '@/components/UploadSection';
import { ASSET_ENDPOINTS } from '@/lib/api-endpints';
import type { Approval, AssetItem } from '@/interfaces/TaskDetails.interfaces';
import { formatBytes } from '@/constants/chunkSize';
import {
  PRIORITY_STYLE,
  STATUS_ORDER,
  STATUS_STYLE,
  STATUS_TRANSITIONS,
} from '@/constants/statusType';

const api = axios.create({ withCredentials: true });

function AssetIcon({
  mimeType,
  className = 'h-5 w-5',
}: {
  mimeType: string;
  className?: string;
}) {
  if (mimeType?.startsWith('image/'))
    return <ImageIcon className={className} />;
  if (mimeType?.startsWith('video/')) return <Film className={className} />;
  return <FileText className={className} />;
}

export default function TaskDetailPage() {
  const { projectId, taskId } = useParams<{
    projectId: string;
    taskId: string;
  }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = user?.role?.name ?? 'MEMBER';
  const orgId = user?.organizationId ?? 0;

  const canManageTask = ['ADMIN', 'MANAGER', 'LEAD'].includes(role);
  const canReview = ['ADMIN', 'MANAGER', 'REVIEWER'].includes(role);
  const isMember = role === 'MEMBER';
  const canOpenAssign = [
    'ADMIN',
    'MANAGER',
    'LEAD',
    'REVIEWER',
    'MEMBER',
  ].includes(role);

  const [task, setTask] = useState<Task | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'files' | 'approvals'>('files');

  const [statusChanging, setStatusChanging] = useState(false);
  const [feedback, setFeedback] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);

  const [previewAsset, setPreviewAsset] = useState<AssetItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const fetchTask = useCallback(async () => {
    if (!projectId || !taskId) return;
    try {
      const t = await taskService.getById(Number(projectId), Number(taskId));
      setTask(t);
    } catch {
      toast.error('Failed to load task');
    }
  }, [projectId, taskId]);

  const fetchApprovals = useCallback(async () => {
    if (!taskId) return;
    try {
      const data = await taskService.getApprovals(Number(taskId));
      setApprovals(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load approvals');
    }
  }, [taskId]);

  const fetchAssets = useCallback(async () => {
    if (!taskId) return;
    try {
      const { data } = await api.get(
        ASSET_ENDPOINTS.GET_BY_TASK(Number(taskId)),
      );
      const list = data?.data ?? data ?? [];
      setAssets(Array.isArray(list) ? list : []);
    } catch {}
  }, [taskId]);

  const fetchMembers = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await projectService.getTeam(orgId, Number(projectId));
      setMembers(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load members');
    }
  }, [projectId, orgId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchTask(),
        fetchApprovals(),
        fetchAssets(),
        fetchMembers(),
      ]);
      setLoading(false);
    };
    init();
  }, [fetchTask, fetchApprovals, fetchAssets, fetchMembers]);

  const handleStatusChange = useCallback(
    async (newStatus: TaskStatus) => {
      if (!task || !projectId) return;
      setStatusChanging(true);
      try {
        const updated = await taskService.changeStatus(
          Number(projectId),
          task.id,
          newStatus,
          feedback || undefined,
        );
        setTask(updated);
        setFeedback('');
        toast.success('Status updated', {
          description: `Moved to ${STATUS_STYLE[newStatus].label}.`,
        });
      } catch (err: any) {
        const msg = axios.isAxiosError(err)
          ? err.response?.data?.message
          : 'Failed to update status.';
        toast.error('Error', { description: msg });
      } finally {
        setStatusChanging(false);
      }
    },
    [task, projectId, feedback],
  );

  const afterManualUpload = useCallback(async () => {
    await Promise.all([fetchTask(), fetchAssets(), fetchApprovals()]);
    toast.success('Submitted for review', {
      description: 'Your file has been uploaded and the task is now in review.',
    });
  }, [fetchTask, fetchAssets, fetchApprovals]);

  const afterReupload = useCallback(async () => {
    await Promise.all([fetchTask(), fetchAssets(), fetchApprovals()]);
    await handleStatusChange('REVIEW');
  }, [fetchTask, fetchAssets, fetchApprovals, handleStatusChange]);

  const openEdit = () => {
    if (!task) return;
    setEditTitle(task.title);
    setEditDesc(task.description ?? '');
    setEditPriority(task.priority ?? '');
    setEditDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!task || !projectId) return;
    setEditSaving(true);
    try {
      const updated = await taskService.updateTask(Number(projectId), task.id, {
        title: editTitle || undefined,
        description: editDesc || undefined,
        priority: (editPriority as any) || undefined,
        dueDate: editDueDate || undefined,
      });
      setTask(updated);
      setEditOpen(false);
      toast.success('Task updated');
    } catch (err: any) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : 'Failed to update.';
      toast.error('Error', { description: msg });
    } finally {
      setEditSaving(false);
    }
  };

  const saveAssign = async () => {
    if (!task || !projectId || !assignUserId) return;
    setAssignSaving(true);
    try {
      const updated = await taskService.assignTask(Number(projectId), task.id, {
        assignedToId: Number(assignUserId),
      });
      if (updated) setTask(updated);
      setAssignOpen(false);
      setAssignUserId('');
      toast.success('Task assigned successfully');
    } catch (err: any) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : 'Failed to assign.';
      toast.error('Error', { description: msg });
    } finally {
      setAssignSaving(false);
    }
  };

  const openPreview = async (asset: AssetItem) => {
    setPreviewAsset(asset);
    setPreviewUrl(null);
    setPreviewLoading(true);
    api.post(ASSET_ENDPOINTS.TRACK_VIEW(asset._id)).catch(() => null);
    try {
      const { data } = await api.get(
        ASSET_ENDPOINTS.GET_DOWNLOAD_URL(asset._id),
      );
      setPreviewUrl(data?.data?.url ?? data?.url ?? null);
    } catch {
      toast.error('Could not load preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const finalizeAsset = async () => {
    if (!previewAsset) return;
    setFinalizing(true);
    try {
      await api.patch(ASSET_ENDPOINTS.FINALIZE(previewAsset._id));
      setAssets((prev) =>
        prev.map((a) =>
          a._id === previewAsset._id ? { ...a, isFinal: true } : a,
        ),
      );
      setPreviewAsset((prev) => (prev ? { ...prev, isFinal: true } : prev));
      toast.success('Marked as final');
    } catch (err: any) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : 'Failed to finalize.';
      toast.error('Error', { description: msg });
    } finally {
      setFinalizing(false);
    }
  };

  const isAssignedToMe = task?.assignedTo?.id === user?.id;
  const isCreator = task?.createdBy?.id === user?.id;
  const isOverdue =
    task?.dueDate &&
    !['DONE', 'APPROVED'].includes(task.status ?? '') &&
    new Date(task.dueDate) < new Date();
  const currentStatusIndex = task
    ? STATUS_ORDER.indexOf(task.status === 'FAILED' ? 'REVIEW' : task.status)
    : 0;
  const transitions = task ? (STATUS_TRANSITIONS[task.status] ?? []) : [];
  const isAssetBased = task?.taskType === 'ASSET_BASED';
  const isManual = task?.taskType === 'MANUAL';

  const allowedTransitions = transitions.filter((next) => {
    if (next === 'IN_PROGRESS') return isMember && isAssignedToMe;
    if (next === 'REVIEW') {
      if (isAssetBased) return false;
      if (task?.status === 'FAILED')
        return !canReview && (isAssignedToMe || isCreator);
      return isMember && isAssignedToMe;
    }
    if (next === 'APPROVED' || next === 'FAILED') return canReview;
    if (next === 'DONE') return canManageTask;
    return false;
  });

  const showManualUpload =
    isManual && task?.status === 'IN_PROGRESS' && isAssignedToMe && isMember;

  const showReupload =
    task?.status === 'FAILED' && !canReview && (isAssignedToMe || isCreator);

  const latestAsset = assets.length > 0 ? assets[assets.length - 1] : undefined;
  const latestAssetId = latestAsset?._id;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground">Task not found.</p>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-6 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
          <span
            className="hover:text-foreground cursor-pointer shrink-0 transition-colors"
            onClick={() => navigate(`/projects/${projectId}/board`)}
          >
            Board
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium text-foreground truncate">
            {task.title}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            TASK-{task.id}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[task.status].className}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLE[task.status].dot}`}
            />
            {STATUS_STYLE[task.status].label}
          </span>
          {canManageTask && (
            <Button variant="outline" size="sm" onClick={openEdit}>
              <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-6 py-6 gap-8">
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
            {task.description && (
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                {task.description}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Progress
            </p>
            <div className="flex gap-1">
              {STATUS_ORDER.map((s, i) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    task.status === 'FAILED' && s === 'REVIEW'
                      ? 'bg-red-400'
                      : i < currentStatusIndex
                        ? 'bg-primary'
                        : i === currentStatusIndex
                          ? 'bg-primary/50'
                          : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
              {STATUS_ORDER.map((s) => (
                <span
                  key={s}
                  className={
                    task.status === s ||
                    (task.status === 'FAILED' && s === 'REVIEW')
                      ? 'text-foreground font-semibold'
                      : ''
                  }
                >
                  {STATUS_STYLE[s].label}
                </span>
              ))}
            </div>
          </div>

          {task.status === 'FAILED' && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                This task was rejected.
                {showReupload
                  ? ' Upload a corrected file below to automatically resubmit for review.'
                  : ''}
              </span>
            </div>
          )}

          {allowedTransitions.length > 0 && (
            <div className="space-y-3 p-4 rounded-xl border bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Move Task
              </p>
              {task.status === 'REVIEW' && canReview && (
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Feedback{' '}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea
                    rows={2}
                    placeholder="Leave feedback for the submitter..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="text-sm resize-none"
                  />
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {allowedTransitions.map((next) => {
                  const s = STATUS_STYLE[next];
                  return (
                    <Button
                      key={next}
                      size="sm"
                      variant="outline"
                      disabled={statusChanging}
                      onClick={() => handleStatusChange(next)}
                      className={`font-medium border-transparent ${s.className} hover:opacity-80`}
                    >
                      {statusChanging ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${s.dot}`}
                        />
                      )}
                      Move to {s.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {showReupload && (
            <div className="space-y-3 p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-900/10">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                Re-upload Corrected File
              </p>
              <p className="text-xs text-red-600/80 dark:text-red-500">
                Upload a corrected file. This will automatically resubmit the
                task for review and create a new approval record.
                {latestAssetId
                  ? ' Your file will be tracked as a new version.'
                  : ''}
              </p>
              <UploadSection
                projectId={task.projectId}
                organizationId={orgId}
                uploadedBy={user?.id ?? 0}
                taskId={task.id}
                parentAssetId={latestAssetId}
                onUploadDone={afterReupload}
              />
            </div>
          )}

          {task.status === 'DONE' && (
            <div className="flex items-center gap-2 p-3 rounded-xl border bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              This task is complete.
            </div>
          )}
          <div className="space-y-4">
            <div className="flex items-center gap-1 border-b">
              {(['files', 'approvals'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'files' && `Files (${assets.length})`}
                  {tab === 'approvals' && `Approvals (${approvals.length})`}
                </button>
              ))}
            </div>

            {activeTab === 'files' && (
              <div className="space-y-4">
                {showManualUpload && (
                  <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                    <p className="text-sm font-medium">
                      Submit Work for Approval
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Upload your completed file. This closes your time log and
                      moves the task to Review automatically.
                      {latestAssetId
                        ? ' It will be saved as a new version.'
                        : ''}
                    </p>
                    <UploadSection
                      projectId={task.projectId}
                      organizationId={orgId}
                      uploadedBy={user?.id ?? 0}
                      taskId={task.id}
                      parentAssetId={latestAssetId}
                      onUploadDone={afterManualUpload}
                    />
                  </div>
                )}

                {assets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Paperclip className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      No files uploaded yet.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {assets.map((asset) => (
                      <div
                        key={asset._id}
                        onClick={() => openPreview(asset)}
                        className="flex items-center gap-4 p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors cursor-pointer group"
                      >
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <AssetIcon
                            mimeType={asset.mimeType}
                            className="h-5 w-5 text-muted-foreground"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {asset.originalName}
                            </p>
                            {asset.isFinal && (
                              <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-0.5">
                                <Star className="h-2.5 w-2.5" /> Final
                              </span>
                            )}
                            {asset.version && asset.version > 1 && (
                              <span className="shrink-0 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                v{asset.version}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                            <span>{formatBytes(asset.fileSize)}</span>
                            <span>·</span>
                            <span>
                              {asset.mimeType.split('/')[1]?.toUpperCase()}
                            </span>
                            <span>·</span>
                            <span>
                              {new Date(asset.createdAt).toLocaleDateString()}
                            </span>
                            {(asset.viewCount ?? 0) > 0 && (
                              <>
                                <span>·</span>
                                <span className="flex items-center gap-0.5">
                                  <Eye className="h-2.5 w-2.5" />{' '}
                                  {asset.viewCount}
                                </span>
                              </>
                            )}
                            {asset.uploadedBy?.username && (
                              <>
                                <span>·</span>
                                <span>by {asset.uploadedBy.username}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                              asset.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-700'
                                : asset.status === 'rejected'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {asset.status}
                          </span>
                          <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'approvals' && (
              <div className="space-y-3">
                {approvals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      No approvals yet.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {approvals.map((appr) => (
                      <div
                        key={appr.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                              appr.status === 'APPROVED'
                                ? 'bg-emerald-500'
                                : appr.status === 'REJECTED' ||
                                    appr.status === 'FAILED'
                                  ? 'bg-red-500'
                                  : 'bg-amber-500'
                            }`}
                          />
                          <div>
                            <p className="text-xs font-medium">
                              Submitted by{' '}
                              {appr.requestedBy?.username ?? 'Unknown'}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(appr.requestedAt).toLocaleDateString()}
                              {appr.reviewedBy &&
                                ` · Reviewed by ${appr.reviewedBy.username}`}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            appr.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : appr.status === 'REJECTED' ||
                                  appr.status === 'FAILED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {appr.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="w-72 shrink-0 flex flex-col gap-5">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Status
            </p>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full ${STATUS_STYLE[task.status].className}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLE[task.status].dot}`}
              />
              {STATUS_STYLE[task.status].label}
            </span>
          </div>
          <Separator />

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="h-3 w-3" /> Priority
            </p>
            {task.priority ? (
              <span
                className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${PRIORITY_STYLE[task.priority]}`}
              >
                {task.priority}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                Not set
              </span>
            )}
          </div>
          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3 w-3" /> Assigned To
              </p>
              {canOpenAssign && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => {
                    fetchMembers();
                    setAssignUserId('');
                    setAssignOpen(true);
                  }}
                >
                  {task.assignedTo ? 'Reassign' : 'Assign'}
                </Button>
              )}
            </div>
            {task.assignedTo ? (
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                  {task.assignedTo.username.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-medium">
                  {task.assignedTo.username}
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                Unassigned
              </span>
            )}
          </div>
          <Separator />

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Due Date
            </p>
            {task.dueDate ? (
              <p
                className={`text-sm font-medium ${isOverdue ? 'text-red-600' : ''}`}
              >
                {isOverdue && (
                  <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                )}
                {new Date(task.dueDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
                {isOverdue && (
                  <span className="ml-1 text-xs font-normal">(Overdue)</span>
                )}
              </p>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                No due date
              </span>
            )}
          </div>
          <Separator />

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Type
            </p>
            <span
              className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${
                isAssetBased
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800'
              }`}
            >
              {isAssetBased ? 'Asset Based' : 'Manual'}
            </span>
          </div>
          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Activity
            </p>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <Paperclip className="h-3 w-3" /> Files uploaded
                </span>
                <span className="font-semibold text-xs">{assets.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <CheckCircle2 className="h-3 w-3" /> Approvals
                </span>
                <span className="font-semibold text-xs">
                  {task._count?.approvals}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <Clock className="h-3 w-3" /> Time Logs
                </span>
                <span className="font-semibold text-xs">
                  {task._count?.timeLogs}
                </span>
              </div>
            </div>
          </div>

          {task.createdBy && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Created By
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                    {task.createdBy.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs">{task.createdBy.username}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={editPriority} onValueChange={setEditPriority}>
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
                <Input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={editSaving}>
              {editSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={assignOpen}
        onOpenChange={(open) => {
          if (!assignSaving) {
            setAssignOpen(open);
            if (!open) setAssignUserId('');
          }
        }}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Assign Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Select person</Label>
            <Select value={assignUserId} onValueChange={setAssignUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a member" />
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
              Select a role to assign for this task.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAssignOpen(false);
                setAssignUserId('');
              }}
              disabled={assignSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={saveAssign}
              disabled={assignSaving || !assignUserId}
            >
              {assignSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!previewAsset}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewAsset(null);
            setPreviewUrl(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 min-w-0">
              {previewAsset && (
                <AssetIcon
                  mimeType={previewAsset.mimeType}
                  className="h-4 w-4 shrink-0"
                />
              )}
              <span className="truncate">{previewAsset?.originalName}</span>
              {previewAsset?.isFinal && (
                <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                  <Star className="h-3 w-3" /> Final
                </span>
              )}
              {previewAsset?.version && previewAsset.version > 1 && (
                <span className="shrink-0 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  v{previewAsset.version}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="rounded-lg overflow-hidden border bg-muted/20 flex items-center justify-center min-h-56">
            {previewLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : previewUrl ? (
              <>
                {previewAsset?.mimeType?.startsWith('image/') && (
                  <img
                    src={previewUrl}
                    alt={previewAsset.originalName}
                    className="max-w-full max-h-[440px] object-contain"
                  />
                )}
                {previewAsset?.mimeType?.startsWith('video/') && (
                  <video
                    src={previewUrl}
                    controls
                    autoPlay
                    muted
                    className="max-w-full max-h-[440px]"
                  />
                )}
                {previewAsset?.mimeType === 'application/pdf' && (
                  <iframe
                    src={previewUrl}
                    title={previewAsset.originalName}
                    className="w-full h-[440px]"
                  />
                )}
                {!previewAsset?.mimeType?.startsWith('image/') &&
                  !previewAsset?.mimeType?.startsWith('video/') &&
                  previewAsset?.mimeType !== 'application/pdf' && (
                    <div className="flex flex-col items-center gap-3 py-12">
                      <FileText className="h-12 w-12 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">
                        No preview available for this file type.
                      </p>
                    </div>
                  )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8">
                <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Could not load asset.
                </p>
              </div>
            )}
          </div>

          {previewAsset && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground border-t pt-3 flex-wrap">
              <span>{formatBytes(previewAsset.fileSize)}</span>
              <span>·</span>
              <span>{previewAsset.mimeType}</span>
              <span>·</span>
              <span>
                Uploaded {new Date(previewAsset.createdAt).toLocaleDateString()}
              </span>
              {(previewAsset.viewCount ?? 0) > 0 && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {previewAsset.viewCount} views
                  </span>
                </>
              )}
              <span
                className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                  previewAsset.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : previewAsset.status === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                }`}
              >
                {previewAsset.status}
              </span>
            </div>
          )}

          <DialogFooter className="gap-2">
            {canReview && previewAsset && !previewAsset.isFinal && (
              <Button
                variant="outline"
                className="text-purple-700 border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                onClick={finalizeAsset}
                disabled={finalizing}
              >
                {finalizing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Star className="h-3.5 w-3.5 mr-1.5" />
                )}
                Mark as Final
              </Button>
            )}
            {previewUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={previewUrl} target="_blank" rel="noreferrer" download>
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
