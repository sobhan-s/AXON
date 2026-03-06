import type { UploadFile } from '@/interfaces/upload.interface';
import { cn } from '@/lib/utils';
import { Badge } from 'lucide-react';

export function StatusBadge({ status }: { status: UploadFile['status'] }) {
  const map: Record<
    UploadFile['status'],
    {
      label: string;
      variant: 'default' | 'secondary' | 'destructive' | 'outline';
    }
  > = {
    pending: { label: 'Pending', variant: 'secondary' },
    uploading: { label: 'Uploading', variant: 'default' },
    done: { label: 'Done', variant: 'default' },
    error: { label: 'Failed', variant: 'destructive' },
    aborted: { label: 'Cancelled', variant: 'outline' },
  };
  const { label, variant } = map[status];
  return (
    <Badge
      fontVariant={variant}
      className={cn(status === 'done' && 'bg-emerald-600 text-white')}
    >
      {label}
    </Badge>
  );
}

export function AssetTypeBadge({ mimeType }: { mimeType: string }) {
  const ext = mimeType?.split('/')[1]?.toUpperCase().slice(0, 6) ?? 'FILE';
  const colors = mimeType?.startsWith('image/')
    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30'
    : mimeType?.startsWith('video/')
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
      : 'bg-slate-100 text-slate-600 dark:bg-slate-800';
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${colors}`}>
      {ext}
    </span>
  );
}