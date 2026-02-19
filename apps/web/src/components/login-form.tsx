import { useRef, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormAlert, type AlertState } from '@/components/form-alert';
import { AUTH_ENDPOINTS } from '@/lib/api-endpints';

const schema = z.object({
  email: z.email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'form'>) {
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const dismissAlert = useCallback(() => setAlert(null), []);

  // ── axios POST directly here — no service wrapper ─────────
  const onSubmit = async (values: FormValues) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setAlert(null);

    try {
      const { data } = await axios.post(
        AUTH_ENDPOINTS.LOGIN,
        { email: values.email, password: values.password },
        {
          withCredentials: true, // accessToken + refreshToken set as httpOnly cookies
          signal: abortRef.current.signal,
        },
      );

      setAlert({
        type: 'success',
        message: data?.message || 'Login successful! Redirecting…',
      });

      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        // Backend message is shown as-is — e.g. "Email not verified yet"
        setAlert({
          type: 'error',
          message:
            err.response?.data?.message ?? 'Login failed. Please try again.',
        });
      } else {
        setAlert({
          type: 'error',
          message: 'Network error. Please try again.',
        });
      }
    }
  };

  return (
    <form
      className={cn('flex flex-col gap-5', className)}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      {...props}
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm">
          Welcome back! Enter your credentials below.
        </p>
      </div>

      {/* Alert */}
      <FormAlert alert={alert} onDismiss={dismissAlert} />

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="m@example.com"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-destructive text-xs">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <a
            href="/forgot-password"
            className="text-muted-foreground text-xs underline underline-offset-4 hover:text-foreground"
          >
            Forgot password?
          </a>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-destructive text-xs">{errors.password.message}</p>
        )}
      </div>

      {/* Submit */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? 'Signing in…' : 'Sign In'}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Don&apos;t have an account?{' '}
        <a
          href="/"
          className="text-foreground font-medium underline underline-offset-4"
        >
          Sign up
        </a>
      </p>
    </form>
  );
}
