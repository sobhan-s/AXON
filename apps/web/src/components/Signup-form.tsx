import { useRef, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormAlert, type AlertState } from '@/components/form-alert';
import { AUTH_ENDPOINTS } from '@/lib/api-endpints';

const schema = z
  .object({
    username: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<'form'>) {
  const abortRef = useRef<AbortController | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const dismissAlert = useCallback(() => setAlert(null), []);

  const onSubmit = async (values: FormValues) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setAlert(null);

    try {
      const { data } = await axios.post(
        AUTH_ENDPOINTS.REGISTER,
        {
          username: values.username,
          email: values.email,
          password: values.password,
        },
        {
          withCredentials: true,
          signal: abortRef.current.signal,
        },
      );

      setAlert({
        type: 'success',
        message:
          data?.message ||
          'Account created! Please check your inbox and verify your email.',
      });
      reset();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setAlert({
          type: 'error',
          message:
            err.response?.data?.message ??
            'Registration failed. Please try again.',
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
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-muted-foreground text-sm">
          Fill in the form below to get started
        </p>
      </div>

      <FormAlert alert={alert} onDismiss={dismissAlert} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          autoComplete="name"
          aria-invalid={!!errors.username}
          {...register('username')}
        />
        {errors.username && (
          <p className="text-destructive text-xs">{errors.username.message}</p>
        )}
      </div>

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
        {errors.email ? (
          <p className="text-destructive text-xs">{errors.email.message}</p>
        ) : (
          <p className="text-muted-foreground text-xs">
            We'll never share your email with anyone.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password ? (
          <p className="text-destructive text-xs">{errors.password.message}</p>
        ) : (
          <p className="text-muted-foreground text-xs">
            Must be at least 8 characters long.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-destructive text-xs">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? 'Creating account…' : 'Create Account'}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{' '}
        <a
          href="/login"
          className="text-foreground font-medium underline underline-offset-4"
        >
          Sign in
        </a>
      </p>
    </form>
  );
}
