import { Separator as Sep4 } from '@/components/ui/separator';

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 px-6 py-6 w-full max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Organization Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure your organization preferences and settings.
        </p>
      </div>
      <Sep4 />
      <div className="flex flex-col items-center justify-center py-24 gap-2">
        <p className="text-muted-foreground text-sm">Settings coming soon.</p>
      </div>
    </div>
  );
}

export default SettingsPage;
