import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Loader2,
  Building2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import axios from 'axios';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormAlert, type AlertState } from '@/components/form-alert';
import { userService } from '@/services/user.service';

const schema = z.object({
  orgName: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(60, 'Organization name must be at most 60 characters'),
  orgSlug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(40, 'Slug must be at most 40 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug may only contain lowercase letters, numbers, and hyphens',
    ),
  requetedUserMail: z.email(
    'please give a valid email and that must be registered',
  ),
});

type FormValues = z.infer<typeof schema>;

interface RequestOrgCardProps {
  userEmail: string;
  className?: string;
}

export function RequestOrgCard({ userEmail, className }: RequestOrgCardProps) {
  const [alert, setAlert] = useState<AlertState>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const dismissAlert = useCallback(() => setAlert(null), []);

  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setValue('orgSlug', slug, { shouldValidate: true });
  };

  const onSubmit = async (values: FormValues) => {
    setAlert(null);
    try {
      await userService.requestOrg(
        values.requetedUserMail,
        values.orgName,
        values.orgName,
      );

      setSubmitted(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setAlert({
          type: 'error',
          message:
            err.response?.data?.message ??
            'Failed to submit request. Please try again.',
        });
      } else {
        setAlert({
          type: 'error',
          message: 'Network error. Please try again.',
        });
      }
    }
  };

  if (submitted) {
    return (
      <div
        className={cn(
          'flex flex-col items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm dark:border-emerald-800 dark:bg-emerald-950',
          className,
        )}
      >
        <CheckCircle2
          className="h-12 w-12 text-emerald-500"
          strokeWidth={1.5}
        />
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">
            Request Submitted!
          </h2>
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            Your organization request is pending admin approval. We'll notify
            you at <span className="font-medium">{userEmail}</span> once it's
            reviewed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-6 rounded-2xl border bg-card p-8 shadow-sm',
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Create an Organization</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Request a new workspace for your team. An admin will review and
          approve your request.
        </p>
      </div>

      <FormAlert alert={alert} onDismiss={dismissAlert} />

      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="orgName">Organization Name</Label>
          <Input
            id="orgName"
            type="text"
            placeholder="Acme Corp"
            aria-invalid={!!errors.orgName}
            {...register('orgName', { onChange: handleOrgNameChange })}
          />
          {errors.orgName && (
            <p className="text-xs text-destructive">{errors.orgName.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="orgSlug">
            Organization Slug
            <span className="ml-1.5 text-xs text-muted-foreground font-normal">
              (used in URLs)
            </span>
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
              /
            </span>
            <Input
              id="orgSlug"
              type="text"
              placeholder="acme-corp"
              className="pl-6"
              aria-invalid={!!errors.orgSlug}
              {...register('orgSlug')}
            />
          </div>
          {errors.orgSlug ? (
            <p className="text-xs text-destructive">{errors.orgSlug.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens only.
            </p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Request Organization
              <ArrowRight className="ml-auto h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
