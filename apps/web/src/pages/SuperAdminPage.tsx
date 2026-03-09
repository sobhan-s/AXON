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
  MoreHorizontal,
  Search,
  Building2,
  CheckCircle2,
  XCircle,
  UserMinus,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DialogDescription,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

import {
  superAdminOrgService,
  type Organization,
} from '@/services/SuperAdmin.service';

const createSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
  description: z.string().max(500).optional(),
});

const updateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  storageLimit: z.string().optional(),
});

const assignSchema = z.object({
  adminEmail: z.email('Invalid email address'),
});

type CreateValues = z.infer<typeof createSchema>;
type UpdateValues = z.infer<typeof updateSchema>;
type AssignValues = z.infer<typeof assignSchema>;

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
      {message}
    </p>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  sub?: string;
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
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SuperAdminOrgsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Organization | null>(null);
  const [viewTarget, setViewTarget] = useState<Organization | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Organization | null>(null);
  const [assignTarget, setAssignTarget] = useState<Organization | null>(null);
  const [statusTarget, setStatusTarget] = useState<Organization | null>(null);
  const [unassignTarget, setUnassignTarget] = useState<Organization | null>(
    null,
  );

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [unassignLoading, setUnassignLoading] = useState(false);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await superAdminOrgService.getAll();
      setOrgs(Array.isArray(data) ? data : []);
    } catch (err) {
      setFetchError(
        axios.isAxiosError(err)
          ? err.response?.data?.message
          : 'Failed to load organizations',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const stats = {
    total: orgs.length,
    active: orgs.filter((o) => o.status === 'ACTIVE').length,
    inactive: orgs.filter((o) => o.status === 'INACTIVE').length,
    assigned: orgs.filter((o) => o.assignedTo !== null).length,
  };

  const filtered = orgs.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase()),
  );

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
  });

  const onCreateOrg = async (values: CreateValues) => {
    try {
      await superAdminOrgService.create(values);
      setCreateOpen(false);
      createForm.reset();
      fetchOrgs();
    } catch (err) {
      createForm.setError('root', {
        message: axios.isAxiosError(err)
          ? err.response?.data?.message
          : 'Failed to create organization',
      });
    }
  };

  const updateForm = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
  });

  useEffect(() => {
    if (editTarget) {
      updateForm.reset({
        name: editTarget.name,
        description: editTarget.description ?? '',
        storageLimit: editTarget.storageLimit ?? '',
      });
    }
  }, [editTarget, updateForm]);

  const onUpdateOrg = async (values: UpdateValues) => {
    if (!editTarget) return;
    try {
      await superAdminOrgService.update(editTarget.id, values);
      setEditTarget(null);
      fetchOrgs();
    } catch (err) {
      updateForm.setError('root', {
        message: axios.isAxiosError(err)
          ? err.response?.data?.message
          : 'Failed to update organization',
      });
    }
  };

  const onDeleteOrg = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await superAdminOrgService.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchOrgs();
    } finally {
      setDeleteLoading(false);
    }
  };

  const assignForm = useForm<AssignValues>({
    resolver: zodResolver(assignSchema),
  });

  useEffect(() => {
    if (!assignTarget) assignForm.reset();
  }, [assignTarget, assignForm]);

  const onAssignAdmin = async (values: AssignValues) => {
    if (!assignTarget) return;
    try {
      await superAdminOrgService.assignAdmin(
        assignTarget.id,
        values.adminEmail,
      );
      setAssignTarget(null);
      assignForm.reset();
      fetchOrgs();
    } catch (err) {
      assignForm.setError('root', {
        message: axios.isAxiosError(err)
          ? err.response?.data?.message
          : 'Failed to assign admin',
      });
    }
  };

  const onUnassignAdmin = async () => {
    if (!unassignTarget) return;
    setUnassignLoading(true);
    try {
      await superAdminOrgService.unassignAdmin(unassignTarget.id);
      setUnassignTarget(null);
      fetchOrgs();
    } finally {
      setUnassignLoading(false);
    }
  };

  const onToggleStatus = async () => {
    if (!statusTarget) return;
    setStatusLoading(true);
    try {
      const next = statusTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await superAdminOrgService.changeStatus(statusTarget.id, next);
      setStatusTarget(null);
      fetchOrgs();
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 px-6 py-6 w-full max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage all organizations across the platform.
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={Building2}
          label="Total"
          value={stats.total}
          className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="Active"
          value={stats.active}
          className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          icon={XCircle}
          label="Inactive"
          value={stats.inactive}
          className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        />
        <StatCard
          icon={ShieldCheck}
          label="Assigned"
          value={stats.assigned}
          className="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
        />
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>All Organizations</CardTitle>
              <CardDescription>
                Create, manage and monitor all organizations
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search organizations..."
                  className="pl-9 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Organization
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
                ? 'No organizations match your search.'
                : 'No organizations yet.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{org.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {org.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {org.assignee && org.assignee.email ? (
                        <div>
                          <p className="text-sm font-medium">
                            {org.assignee.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {org.assignee.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          org.status === 'ACTIVE' ? 'default' : 'destructive'
                        }
                      >
                        {org.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {org._count?.projects ?? '. . .'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {org._count?.users ?? '. . .'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(org.createdAt).toLocaleDateString()}
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
                          <DropdownMenuItem onClick={() => setViewTarget(org)}>
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditTarget(org)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setAssignTarget(org)}
                          >
                            <ShieldCheck className="h-4 w-4 mr-2" /> Assign
                            Admin
                          </DropdownMenuItem>
                          {org.assignedTo && (
                            <DropdownMenuItem
                              onClick={() => setUnassignTarget(org)}
                            >
                              <UserMinus className="h-4 w-4 mr-2" /> Unassign
                              Admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => setStatusTarget(org)}
                          >
                            {org.status === 'ACTIVE' ? (
                              <>
                                <ToggleLeft className="h-4 w-4 mr-2" />{' '}
                                Deactivate
                              </>
                            ) : (
                              <>
                                <ToggleRight className="h-4 w-4 mr-2" />{' '}
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(org)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Set up a new organization on the platform.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit(onCreateOrg)}
            className="space-y-4"
            noValidate
          >
            <FormError message={createForm.formState.errors.root?.message} />

            <div className="space-y-1.5">
              <Label htmlFor="c-name">Organization Name</Label>
              <Input
                id="c-name"
                placeholder="Acme Corp"
                {...createForm.register('name')}
              />
              <FieldError message={createForm.formState.errors.name?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-slug">Slug</Label>
              <Input
                id="c-slug"
                placeholder="acme-corp"
                {...createForm.register('slug')}
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers and hyphens only
              </p>
              <FieldError message={createForm.formState.errors.slug?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-desc">
                Description{' '}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="c-desc"
                placeholder="What does this organization do?"
                rows={3}
                {...createForm.register('description')}
              />
              <FieldError
                message={createForm.formState.errors.description?.message}
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
                Create Organization
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
            <DialogTitle>Edit . . . {editTarget?.name}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={updateForm.handleSubmit(onUpdateOrg)}
            className="space-y-4"
            noValidate
          >
            <FormError message={updateForm.formState.errors.root?.message} />

            <div className="space-y-1.5">
              <Label htmlFor="u-name">Organization Name</Label>
              <Input id="u-name" {...updateForm.register('name')} />
              <FieldError message={updateForm.formState.errors.name?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="u-desc">Description</Label>
              <Textarea
                id="u-desc"
                rows={3}
                {...updateForm.register('description')}
              />
              <FieldError
                message={updateForm.formState.errors.description?.message}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="u-storage">
                Storage Limit{' '}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="u-storage"
                placeholder="e.g. 100GB"
                {...updateForm.register('storageLimit')}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Organization Details</DialogTitle>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-xl">{viewTarget.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {viewTarget.slug}
                  </p>
                  <Badge
                    variant={
                      viewTarget.status === 'ACTIVE' ? 'default' : 'destructive'
                    }
                    className="mt-1"
                  >
                    {viewTarget.status}
                  </Badge>
                </div>
              </div>

              {viewTarget.description && (
                <p className="text-sm text-muted-foreground border rounded-lg p-3">
                  {viewTarget.description}
                </p>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Admin</p>
                  <p className="font-medium mt-1">
                    {viewTarget.assignee?.username ? (
                      viewTarget.assignee.username
                    ) : (
                      <span className="italic text-muted-foreground">
                        Unassigned
                      </span>
                    )}
                  </p>
                  {viewTarget.assignee?.email && (
                    <p className="text-xs text-muted-foreground">
                      {viewTarget.assignee.email}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Storage Limit</p>
                  <p className="font-medium mt-1">
                    {viewTarget.storageLimit ?? 'Default'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Projects</p>
                  <p className="font-medium mt-1">
                    {viewTarget._count?.projects ?? '. . .'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Members</p>
                  <p className="font-medium mt-1">
                    {viewTarget._count?.users ?? '. . .'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium mt-1">
                    {new Date(viewTarget.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium mt-1">
                    {new Date(viewTarget.updatedAt).toLocaleDateString()}
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

      <Dialog
        open={!!assignTarget}
        onOpenChange={(o) => {
          if (!o) {
            setAssignTarget(null);
            assignForm.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Admin</DialogTitle>
            <DialogDescription>
              Assign an admin to <strong>{assignTarget?.name}</strong>. Enter
              the email of an existing user.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={assignForm.handleSubmit(onAssignAdmin)}
            className="space-y-4"
            noValidate
          >
            <FormError message={assignForm.formState.errors.root?.message} />

            <div className="space-y-1.5">
              <Label htmlFor="a-email">Admin Email</Label>
              <Input
                id="a-email"
                type="email"
                placeholder="admin@example.com"
                {...assignForm.register('adminEmail')}
              />
              <FieldError
                message={assignForm.formState.errors.adminEmail?.message}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAssignTarget(null);
                  assignForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={assignForm.formState.isSubmitting}
              >
                {assignForm.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Assign Admin
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!unassignTarget}
        onOpenChange={(o) => {
          if (!o) setUnassignTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unassign Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Remove the current admin from{' '}
              <strong>{unassignTarget?.name}</strong>? The organization will
              have no admin until a new one is assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onUnassignAdmin}
              disabled={unassignLoading}
            >
              {unassignLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Unassign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!statusTarget}
        onOpenChange={(o) => {
          if (!o) setStatusTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}{' '}
              Organization
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusTarget?.status === 'ACTIVE'
                ? `Deactivating ${statusTarget?.name} will block all user access. You can reactivate it later.`
                : `Activating ${statusTarget?.name} will restore user access.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onToggleStatus}
              disabled={statusLoading}
              className={
                statusTarget?.status === 'ACTIVE'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {statusLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {statusTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{deleteTarget?.name}</strong>? This
              will remove all projects, members and data associated with this
              organization. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteOrg}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Organization
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
