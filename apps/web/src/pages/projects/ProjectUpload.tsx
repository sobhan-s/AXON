import { useParams } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/auth.store';
import UploadSection from '@/components/UploadSection';

export function ProjectUploadPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const user = useAuthStore((s) => s.user);

  const orgId = user?.organizationId ?? 0;
  const uploadedBy = user?.id ?? 0;

  return (
    <div className="flex flex-col gap-6 px-6 py-6 w-full max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Assets</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload files. Each file automatically creates a task in Review status.
        </p>
      </div>

      <Separator />

      <UploadSection
        projectId={Number(projectId)}
        organizationId={orgId}
        uploadedBy={uploadedBy}
        onUploadDone={() => console.log('All uploads done!')}
      />
    </div>
  );
}

export default ProjectUploadPage;
