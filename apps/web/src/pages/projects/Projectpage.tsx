import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Search,
  Loader2,
  FolderOpen,
  Users,
  CheckSquare,
  Calendar,
  MoreHorizontal,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { projectService, type Project } from '@/services/Project.service';
import { useAuthStore } from '@/store/auth.store';

const createSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Lowercase, numbers, hyphens only'),
  description: z.string().max(500).optional(),
});
type CreateValues = z.infer<typeof createSchema>;

function FieldError({ message }: { message?: string }) {
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

export default function ProjectsPage() {
  const user = useAuthStore((s) => s.user);
  const orgId = user?.organizationId as number;
  const role = user?.role?.name ?? 'MEMBER';
  const navigate = useNavigate();

  const canCreate = ['ADMIN', 'MANAGER'].includes(role);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectService.getAll(orgId);
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message
          : 'Failed to load projects',
      );
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()),
  );

  const form = useForm<CreateValues>({ resolver: zodResolver(createSchema) });

  const onCreateProject = async (values: CreateValues) => {
    try {
      await projectService.create(orgId, values);
      setCreateOpen(false);
      form.reset();
      fetchProjects();
    } catch (err) {
      form.setError('root', {
        message: axios.isAxiosError(err)
          ? err.response?.data?.message
          : 'Failed to create project',
      });
    }
  };

  const onDeleteProject = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await projectService.delete(orgId, deleteTarget.id);
      setDeleteTarget(null);
      fetchProjects();
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 px-6 py-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {canCreate
              ? 'Create and manage your projects.'
              : 'Browse projects you are assigned to.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-9 w-56"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canCreate && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-center py-24 text-destructive text-sm">{error}</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <FolderOpen className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">
            {search ? 'No projects match your search.' : 'No projects yet.'}
          </p>
          {canCreate && !search && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create your first project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              role={role}
              canDelete={canCreate}
              onOpen={() => navigate(`/projects/${project.id}/board`)}
              onDelete={() => setDeleteTarget(project)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Set up a new project for your team.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onCreateProject)}
            className="space-y-4"
            noValidate
          >
            <FormError message={form.formState.errors.root?.message} />

            <div className="space-y-1.5">
              <Label htmlFor="p-name">Project Name</Label>
              <Input
                id="p-name"
                placeholder="Brand Campaign Q1"
                {...form.register('name')}
              />
              <FieldError message={form.formState.errors.name?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-slug">Slug</Label>
              <Input
                id="p-slug"
                placeholder="brand-campaign-q1"
                {...form.register('slug')}
              />
              <p className="text-xs text-muted-foreground">
                Lowercase, numbers and hyphens only
              </p>
              <FieldError message={form.formState.errors.slug?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-desc">
                Description{' '}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="p-desc"
                rows={3}
                placeholder="What is this project about?"
                {...form.register('description')}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{deleteTarget?.name}</strong>? All
              tasks and assets will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteProject}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProjectCard({
  project,
  canDelete,
  onOpen,
  onDelete,
}: {
  project: Project;
  role: string;
  canDelete: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <Card
      className="group relative flex flex-col hover:shadow-md transition-shadow cursor-pointer"
      onClick={onOpen}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{project.name}</p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {project.slug}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}
              className="text-[10px]"
            >
              {project.status}
            </Badge>

            {canDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuItem onClick={onOpen}>
                    <ArrowRight className="h-4 w-4 mr-2" /> Open
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {project.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {project.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {project._count?.tasks !== undefined && (
            <span className="flex items-center gap-1">
              <CheckSquare className="h-3.5 w-3.5" />
              {project._count.tasks} tasks
            </span>
          )}
          {project._count?.teamMembers !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {project._count?.teamMembers} members
            </span>
          )}
          <span className="flex items-center gap-1 ml-auto">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
