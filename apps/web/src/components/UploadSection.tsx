import { useCallback, useRef } from 'react';
import {
  Upload,
  X,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileImage,
  FileVideo,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTusUpload } from '@/hooks/useUpload';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ALLOWED_TYPES, MAX_SIZE } from '@/constants/docsType';
import { formatBytes } from '@/constants/chunkSize';
import { StatusBadge } from './badge';
import type { UploadSectionProps } from '@/interfaces/uploadSection.interface';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8004';
const UPLOAD_ENDPOINT = `${API_BASE}/api/assets/upload`;

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.startsWith('video/')) return FileVideo;
  return FileText;
}

export function UploadSection({
  projectId,
  organizationId,
  uploadedBy,
  taskId,
  parentAssetId,
  tags,
  onUploadDone,
}: UploadSectionProps) {
  const dropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { files, addFiles, removeFile, retryFile, clearDone } = useTusUpload({
    endpoint: UPLOAD_ENDPOINT,
    projectId,
    organizationId,
    uploadedBy,
    taskId,
    parentAssetId,
    tags,
    onAllDone: onUploadDone,
  });

  const handleFiles = useCallback(
    (incoming: FileList | File[]) => {
      const arr = Array.from(incoming);
      const valid = arr.filter((f) => {
        if (!ALLOWED_TYPES.includes(f.type)) {
          alert(`"${f.name}" . . . unsupported file type: ${f.type}`);
          return false;
        }
        if (f.size > MAX_SIZE) {
          alert(`"${f.name}" exceeds the 10 GB limit.`);
          return false;
        }
        return true;
      });
      if (valid.length) addFiles(valid);
    },
    [addFiles],
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    dropRef.current?.classList.add('border-primary', 'bg-primary/5');
  };
  const onDragLeave = () => {
    dropRef.current?.classList.remove('border-primary', 'bg-primary/5');
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDragLeave();
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const activeCount = files.filter((f) => f.status === 'uploading').length;
  const completedCount = files.filter((f) => f.status === 'done').length;

  return (
    <div className="flex flex-col gap-5">
      <div
        ref={dropRef}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-14',
          'cursor-pointer transition-colors duration-200',
          'hover:border-primary hover:bg-primary/5',
          'text-center select-none',
        )}
      >
        <div className="p-4 rounded-full bg-muted">
          <Upload className="w-7 h-7 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm">
            Drop files here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Images · Videos · PDF · DOCX · XLSX . . . up to 10 GB each
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(',')}
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {files.length} file{files.length !== 1 ? 's' : ''}
            {activeCount > 0 && ` . . . ${activeCount} uploading`}
            {completedCount > 0 && `, ${completedCount} done`}
          </span>
          {completedCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearDone}>
              Clear completed
            </Button>
          )}
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-col gap-3">
          {files.map((f) => {
            const Icon = getFileIcon(f.file.type);
            return (
              <div
                key={f.id}
                className="flex items-center gap-4 p-4 border rounded-xl bg-card"
              >
                <div className="shrink-0 p-2 rounded-lg bg-muted">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium truncate max-w-xs">
                      {f.file.name}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatBytes(f.file.size)}
                    </span>
                    <StatusBadge status={f.status} />
                  </div>

                  {(f.status === 'uploading' || f.status === 'done') && (
                    <Progress value={f.progress} className="h-1.5" />
                  )}

                  {f.status === 'error' && f.error && (
                    <p className="text-xs text-destructive mt-1">{f.error}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {f.status === 'uploading' && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {f.status === 'done' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                  {f.status === 'error' && (
                    <>
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => retryFile(f.id)}
                        title="Retry"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeFile(f.id)}
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UploadSection;