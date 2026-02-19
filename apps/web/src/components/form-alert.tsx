import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export type AlertState =
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }
  | null;

interface FormAlertProps {
  alert: AlertState;
  onDismiss?: () => void;
  className?: string;
}

export function FormAlert({ alert, onDismiss, className }: FormAlertProps) {
  if (!alert) return null;

  const ok = alert.type === 'success';

  return (
    <Alert
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
        ok
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
          : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300',
        className,
      )}
    >
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600    dark:text-red-400" />
      )}
      <AlertDescription className="flex-1 font-medium">
        {alert.message}
      </AlertDescription>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="ml-auto shrink-0 opacity-60 transition-opacity hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </Alert>
  );
}
