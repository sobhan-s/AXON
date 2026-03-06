import type { UploadFile } from '@/hooks/useUpload';
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
