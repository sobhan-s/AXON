import { useRef, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormAlert, type AlertState } from '@/components/form-alert';
import { AUTH_ENDPOINTS } from '@/lib/api-endpints';

const schema = z.object({
  email: z.email('Please enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const abortRef = useRef<AbortController | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const dismissAlert = useCallback(() => setAlert(null), []);

  const onSubmit = async (values: FormValues) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setAlert(null);

    try {
      const { data } = await axios.post(
        AUTH_ENDPOINTS.FORGOT_PASSWORD,
        { email: values.email },
        {
          withCredentials: true,
          signal: abortRef.current.signal,
        },
      );

      setSubmitted(true);
      setAlert({
        type: 'success',
        message:
          data?.message ||
          'Reset link sent! Check your inbox (and spam folder).',
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setAlert({
          type: 'error',
          message:
            err.response?.data?.message ??
            'Something went wrong. Please try again.',
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
      <div className="flex min-h-svh items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
              <Mail className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold">Check your inbox</h1>
            <p className="text-muted-foreground text-sm max-w-xs">
              We sent a password reset link to{' '}
              <span className="text-foreground font-medium">
                {getValues('email')}
              </span>
              . It expires in 1 hour.
            </p>

            <FormAlert alert={alert} className="w-full text-left" />

            <p className="text-muted-foreground text-xs">
              Didn't receive it?{' '}
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setAlert(null);
                }}
                className="text-foreground font-medium underline underline-offset-4"
              >
                Try again
              </button>
            </p>

            <a
              href="/login"
              className="text-muted-foreground flex items-center gap-1.5 text-sm underline underline-offset-4 hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <form
          className="flex flex-col gap-5"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">Forgot your password?</h1>
            <p className="text-muted-foreground text-sm max-w-xs">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>

          <FormAlert alert={alert} onDismiss={dismissAlert} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              autoComplete="email"
              autoFocus
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-destructive text-xs">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Sending reset link…' : 'Send reset link'}
          </Button>

          <a
            href="/login"
            className="text-muted-foreground flex items-center justify-center gap-1.5 text-sm underline underline-offset-4 hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </a>
        </form>
      </div>
    </div>
  );
}
