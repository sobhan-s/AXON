import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Loader2,
  UserCircle,
  KeyRound,
  Trash2,
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FormAlert, type AlertState } from '@/components/form-alert';
import { USER_ENDPOINTS } from '@/lib/api-endpints';
import { useAuthStore } from '@/store/auth.store';

const updateSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type UpdateValues = z.infer<typeof updateSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

function getInitials(name: string, email: string) {
  if (name) {
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default function AccountPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);

  const [profileAlert, setProfileAlert] = useState<AlertState>(null);
  const [passwordAlert, setPasswordAlert] = useState<AlertState>(null);
  const [deleteAlert, setDeleteAlert] = useState<AlertState>(null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const displayName = user?.username || user?.email?.split('@')[0] || 'User';
  const initials = getInitials(displayName, user?.email ?? '');

  const {
    register: regUpdate,
    handleSubmit: submitUpdate,
    formState: { errors: updateErrors, isSubmitting: updateLoading },
  } = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: { username: user?.username ?? '' },
  });

  const onUpdateProfile = async (values: UpdateValues) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setProfileAlert(null);

    try {
      const { data } = await axios.patch(
        USER_ENDPOINTS.UPDATE_ME,
        { username: values.username },
        { withCredentials: true, signal: abortRef.current.signal },
      );

      const updated = data?.data ?? data;
      updateUser({ username: updated?.username ?? values.username });

      setProfileAlert({
        type: 'success',
        message: data?.message || 'Profile updated successfully!',
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setProfileAlert({
          type: 'error',
          message: err.response?.data?.message ?? 'Failed to update profile.',
        });
      } else {
        setProfileAlert({
          type: 'error',
          message: 'Network error. Please try again.',
        });
      }
    }
  };

  const {
    register: regPassword,
    handleSubmit: submitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: passwordLoading },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  const onChangePassword = async (values: PasswordValues) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setPasswordAlert(null);

    try {
      const { data } = await axios.patch(
        USER_ENDPOINTS.CHANGE_PASSWORD,
        {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        },
        { withCredentials: true, signal: abortRef.current.signal },
      );

      setPasswordAlert({
        type: 'success',
        message: data?.message || 'Password changed successfully!',
      });
      resetPassword();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setPasswordAlert({
          type: 'error',
          message: err.response?.data?.message ?? 'Failed to change password.',
        });
      } else {
        setPasswordAlert({
          type: 'error',
          message: 'Network error. Please try again.',
        });
      }
    }
  };

  const [deleteLoading, setDeleteLoading] = useState(false);

  const onDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteAlert(null);

    try {
      await axios.delete(USER_ENDPOINTS.DELETE_ME, { withCredentials: true });
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setDeleteAlert({
          type: 'error',
          message: err.response?.data?.message ?? 'Failed to delete account.',
        });
      } else {
        setDeleteAlert({
          type: 'error',
          message: 'Network error. Please try again.',
        });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const dismissProfile = useCallback(() => setProfileAlert(null), []);
  const dismissPassword = useCallback(() => setPasswordAlert(null), []);

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your profile, password, and account.
        </p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your account information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-xl">
              <AvatarImage src={user?.avatarUrl ?? ''} alt={displayName} />
              <AvatarFallback className="rounded-xl text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="font-semibold text-lg">{displayName}</p>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <div className="flex gap-2">
                <Badge
                  variant={user?.isEmailVerified ? 'default' : 'destructive'}
                >
                  {user?.isEmailVerified
                    ? 'Email verified'
                    : 'Email not verified'}
                </Badge>
                <Badge variant={user?.isActive ? 'secondary' : 'outline'}>
                  {user?.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Member since</p>
              <p className="font-medium">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Last login</p>
              <p className="font-medium">
                {user?.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
          </div>

          <Separator />

          <form
            onSubmit={submitUpdate(onUpdateProfile)}
            className="space-y-4"
            noValidate
          >
            <FormAlert alert={profileAlert} onDismiss={dismissProfile} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                aria-invalid={!!updateErrors.username}
                {...regUpdate('username')}
              />
              {updateErrors.username && (
                <p className="text-destructive text-xs">
                  {updateErrors.username.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={updateLoading}>
              {updateLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {updateLoading ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password. You'll need your current password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={submitPassword(onChangePassword)}
            className="space-y-4"
            noValidate
          >
            <FormAlert alert={passwordAlert} onDismiss={dismissPassword} />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currentPassword">Current password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-invalid={!!passwordErrors.currentPassword}
                  className="pr-10"
                  {...regPassword('currentPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((s) => !s)}
                  className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground"
                  tabIndex={-1}
                >
                  {showCurrent ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-destructive text-xs">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPasswordAccount">New password</Label>
              <div className="relative">
                <Input
                  id="newPasswordAccount"
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  aria-invalid={!!passwordErrors.newPassword}
                  className="pr-10"
                  {...regPassword('newPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((s) => !s)}
                  className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground"
                  tabIndex={-1}
                >
                  {showNew ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="text-destructive text-xs">
                  {passwordErrors.newPassword.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPasswordAccount">
                Confirm new password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPasswordAccount"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  aria-invalid={!!passwordErrors.confirmPassword}
                  className="pr-10"
                  {...regPassword('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-destructive text-xs">
                  {passwordErrors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {passwordLoading ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <ShieldAlert className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This cannot
            be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormAlert
            alert={deleteAlert}
            onDismiss={() => setDeleteAlert(null)}
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete my account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account and all your data.
                  This action <strong>cannot</strong> be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeleteAccount}
                  disabled={deleteLoading}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                >
                  {deleteLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {deleteLoading ? 'Deleting…' : 'Yes, delete my account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
