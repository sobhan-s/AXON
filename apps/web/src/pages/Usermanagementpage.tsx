import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  Users,
  UserCheck,
  ShieldCheck,
  MoreHorizontal,
} from 'lucide-react';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

import { adminUserService, type OrgUser } from '@/services/AdminUser.service';
import { useAuthStore } from '@/store/auth.store';

const ROLES = [
  { id: 2, name: 'MANAGER' },
  { id: 3, name: 'LEAD' },
  { id: 4, name: 'REVIEWER' },
  { id: 5, name: 'MEMBER' },
];

const ROLE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  ADMIN: 'default',
  MANAGER: 'secondary',
  LEAD: 'outline',
  REVIEWER: 'outline',
  MEMBER: 'outline',
};

const createSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscore'),
  roleId: z.number('Select a role'),
});

const updateSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscore')
    .optional(),
  isActive: z.boolean().optional(),
  roleId: z.number().optional(),
});

type CreateValues = z.infer<typeof createSchema>;
type UpdateValues = z.infer<typeof updateSchema>;

function getInitials(username: string, email: string) {
  return (username || email).slice(0, 2).toUpperCase();
}

function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
      {message}
    </p>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  className: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-lg ${className}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UserManagementPage() {
  const authUser = useAuthStore((s) => s.user);
  const orgId = authUser?.organizationId as number;

  const [members, setMembers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OrgUser | null>(null);
  const [viewTarget, setViewTarget] = useState<OrgUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrgUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await adminUserService.getOrgUsers(orgId);

      const seen = new Set<number>();
      const unique = data.filter((m) => {
        if (seen.has(m.userId)) return false;
        seen.add(m.userId);
        return true;
      });
      setMembers(unique);
    } catch (err) {
      setFetchError(
        axios.isAxiosError(err)
          ? err.response?.data?.message
          : 'Failed to load users',
      );
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const stats = {
    total: members.length,
    active: members.length,
    managers: members.filter((m) => m.role?.name === 'MANAGER').length,
    members: members.filter((m) => m.role?.name === 'MEMBER').length,
  };

  const filtered = members.filter(
    (m) =>
      m.user.username.toLowerCase().includes(search.toLowerCase()) ||
      m.user.email.toLowerCase().includes(search.toLowerCase()),
  );

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
  });

  const onCreateUser = async (values: CreateValues) => {
    try {
      await adminUserService.createUser(orgId, values);
      setCreateOpen(false);
      createForm.reset();
      fetchMembers();
    } catch (err) {
      createForm.setError('root', {
        message: axios.isAxiosError(err)
          ? err.response?.data?.message
          : 'Failed to create user',
      });
    }
  };

  const updateForm = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
  });

  useEffect(() => {
    if (editTarget) {
      updateForm.reset({
        username: editTarget.user.username,
        roleId: editTarget.role?.id,
      });
    }
  }, [editTarget, updateForm]);

  const onUpdateUser = async (values: UpdateValues) => {
    if (!editTarget) return;
    try {
      await adminUserService.updateUser(orgId, {
        ...values,
        email: editTarget.user.email,
      });
      setEditTarget(null);
      fetchMembers();
    } catch (err) {
      updateForm.setError('root', {
        message: axios.isAxiosError(err)
          ? err.response?.data?.message
          : 'Failed to update user',
      });
    }
  };

  const onDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminUserService.removeUser(orgId, deleteTarget.userId);
      setDeleteTarget(null);
      fetchMembers();
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 px-6 py-6 w-full max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add, edit roles, or remove members in your organization.
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.total}
          className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          icon={UserCheck}
          label="Active"
          value={stats.active}
          className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          icon={ShieldCheck}
          label="Managers"
          value={stats.managers}
          className="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
        />
        <StatCard
          icon={Users}
          label="Members"
          value={stats.members}
          className="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
        />
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Organization Members</CardTitle>
              <CardDescription>
                All users assigned to your organization
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-9 w-56"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : fetchError ? (
            <p className="text-center py-16 text-destructive text-sm">
              {fetchError}
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-16 text-muted-foreground text-sm">
              {search
                ? 'No users match your search.'
                : 'No users in this organization yet.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={m.user.avatarUrl ?? ''} />
                          <AvatarFallback className="text-xs">
                            {getInitials(m.user.username, m.user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {m.user.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {m.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ROLE_VARIANT[m.role?.name] ?? 'outline'}>
                        {m.role?.name ?? '—'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {m.project?.name ?? (
                          <span className="italic text-muted-foreground">
                            Unassigned
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(m.addedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewTarget(m)}>
                            <Eye className="h-4 w-4 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditTarget(m)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(m)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── CREATE MODAL ─────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit(onCreateUser)}
            className="space-y-4"
            noValidate
          >
            <FormError message={createForm.formState.errors.root?.message} />
            <div className="space-y-1.5">
              <Label htmlFor="c-email">Email</Label>
              <Input
                id="c-email"
                type="email"
                placeholder="user@example.com"
                {...createForm.register('email')}
              />
              <ErrorMessage
                message={createForm.formState.errors.email?.message}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-username">Username</Label>
              <Input
                id="c-username"
                placeholder="john_doe"
                {...createForm.register('username')}
              />
              <ErrorMessage
                message={createForm.formState.errors.username?.message}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-password">Password</Label>
              <Input
                id="c-password"
                type="password"
                placeholder="Min. 8 characters"
                {...createForm.register('password')}
              />
              <ErrorMessage
                message={createForm.formState.errors.password?.message}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                onValueChange={(val) =>
                  createForm.setValue('roleId', Number(val))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ErrorMessage
                message={createForm.formState.errors.roleId?.message}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  createForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createForm.formState.isSubmitting}
              >
                {createForm.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editTarget}
        onOpenChange={(o) => {
          if (!o) setEditTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit — {editTarget?.user.username}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={updateForm.handleSubmit(onUpdateUser)}
            className="space-y-4"
            noValidate
          >
            <FormError message={updateForm.formState.errors.root?.message} />
            <div className="space-y-1.5">
              <Label htmlFor="u-username">Username</Label>
              <Input id="u-username" {...updateForm.register('username')} />
              <ErrorMessage
                message={updateForm.formState.errors.username?.message}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                defaultValue={String(editTarget?.role?.id)}
                onValueChange={(val) =>
                  updateForm.setValue('roleId', Number(val))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Active Status</p>
                <p className="text-xs text-muted-foreground">
                  Disable to block user access
                </p>
              </div>
              <Switch
                checked={updateForm.watch('isActive') ?? true}
                onCheckedChange={(v) => updateForm.setValue('isActive', v)}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateForm.formState.isSubmitting}
              >
                {updateForm.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewTarget}
        onOpenChange={(o) => {
          if (!o) setViewTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={viewTarget.user.avatarUrl ?? ''} />
                  <AvatarFallback className="text-lg">
                    {getInitials(
                      viewTarget.user.username,
                      viewTarget.user.email,
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">
                    {viewTarget.user.username}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {viewTarget.user.email}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Role</p>
                  <Badge
                    variant={ROLE_VARIANT[viewTarget.role?.name] ?? 'outline'}
                  >
                    {viewTarget.role?.name ?? '—'}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Project</p>
                  <p className="font-medium">
                    {viewTarget.project?.name ?? 'Unassigned'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Added</p>
                  <p className="font-medium mt-1">
                    {new Date(viewTarget.addedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTarget(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setEditTarget(viewTarget);
                setViewTarget(null);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{deleteTarget?.user.username}</strong> from the
              organization? This will permanently delete their account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteUser}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
