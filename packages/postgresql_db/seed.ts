import { logger } from '@dam/config';
import { PrismaClient } from './index.js';

const prisma = new PrismaClient();

async function seedRBAC() {
  logger.info('Seeding RBAC data...');

  try {
    const roles = await Promise.all([
      prisma.role.upsert({
        where: { name: 'ADMIN' },
        update: {},
        create: {
          name: 'ADMIN',
          level: 1,
          description: 'Organization administrator with full control',
        },
      }),
      prisma.role.upsert({
        where: { name: 'MANAGER' },
        update: {},
        create: {
          name: 'MANAGER',
          level: 2,
          description: 'Project manager who oversees projects and modules',
        },
      }),
      prisma.role.upsert({
        where: { name: 'LEAD' },
        update: {},
        create: {
          name: 'LEAD',
          level: 3,
          description: 'Team lead who creates and manages tasks',
        },
      }),
      prisma.role.upsert({
        where: { name: 'MEMBER' },
        update: {},
        create: {
          name: 'MEMBER',
          level: 4,
          description: 'Team member who executes tasks',
        },
      }),
      prisma.role.upsert({
        where: { name: 'REVIEWER' },
        update: {},
        create: {
          name: 'REVIEWER',
          level: 5,
          description: 'Reviewer who approves or rejects assets',
        },
      }),
    ]);

    console.log(`Created ${roles.length} roles`);

    const permissions = [
      // Organization
      {
        name: 'view_organization',
        resource: 'organization',
        action: 'view',
        description: 'View organization details',
      },
      {
        name: 'update_organization',
        resource: 'organization',
        action: 'update',
        description: 'Update organization settings',
      },
      {
        name: 'manage_org_users',
        resource: 'organization',
        action: 'manage_users',
        description: 'Manage organization users',
      },

      // Project
      {
        name: 'create_project',
        resource: 'project',
        action: 'create',
        description: 'Create new projects',
      },
      {
        name: 'view_project',
        resource: 'project',
        action: 'view',
        description: 'View project details',
      },
      {
        name: 'update_project',
        resource: 'project',
        action: 'update',
        description: 'Update project details',
      },
      {
        name: 'delete_project',
        resource: 'project',
        action: 'delete',
        description: 'Delete projects',
      },
      {
        name: 'archive_project',
        resource: 'project',
        action: 'archive',
        description: 'Archive projects',
      },
      {
        name: 'manage_project_team',
        resource: 'project',
        action: 'manage_team',
        description: 'Add/remove project members',
      },

      // Module
      {
        name: 'create_module',
        resource: 'module',
        action: 'create',
        description: 'Create new modules',
      },
      {
        name: 'view_module',
        resource: 'module',
        action: 'view',
        description: 'View module details',
      },
      {
        name: 'update_module',
        resource: 'module',
        action: 'update',
        description: 'Update module details',
      },
      {
        name: 'delete_module',
        resource: 'module',
        action: 'delete',
        description: 'Delete modules',
      },

      // Task
      {
        name: 'create_task',
        resource: 'task',
        action: 'create',
        description: 'Create manual tasks',
      },
      {
        name: 'view_task',
        resource: 'task',
        action: 'view',
        description: 'View task details',
      },
      {
        name: 'update_task',
        resource: 'task',
        action: 'update',
        description: 'Update task details',
      },
      {
        name: 'delete_task',
        resource: 'task',
        action: 'delete',
        description: 'Delete tasks',
      },
      {
        name: 'assign_task',
        resource: 'task',
        action: 'assign',
        description: 'Assign tasks to team members',
      },

      // Asset
      {
        name: 'upload_asset',
        resource: 'asset',
        action: 'upload',
        description: 'Upload files',
      },
      {
        name: 'view_asset',
        resource: 'asset',
        action: 'view',
        description: 'View assets',
      },
      {
        name: 'update_asset',
        resource: 'asset',
        action: 'update',
        description: 'Update asset metadata',
      },
      {
        name: 'delete_asset',
        resource: 'asset',
        action: 'delete',
        description: 'Delete assets',
      },
      {
        name: 'approve_asset',
        resource: 'asset',
        action: 'approve',
        description: 'Approve assets',
      },
      {
        name: 'reject_asset',
        resource: 'asset',
        action: 'reject',
        description: 'Reject assets',
      },
      {
        name: 'finalize_asset',
        resource: 'asset',
        action: 'finalize',
        description: 'Mark assets as final',
      },

      // Analytics
      {
        name: 'view_org_analytics',
        resource: 'analytics',
        action: 'view_org',
        description: 'View organization analytics',
      },
      {
        name: 'view_project_analytics',
        resource: 'analytics',
        action: 'view_project',
        description: 'View project analytics',
      },

      // Time
      {
        name: 'log_time',
        resource: 'time',
        action: 'log',
        description: 'Log time on tasks',
      },
    ];

    const createdPermissions = await Promise.all(
      permissions.map((p) =>
        prisma.permission.upsert({
          where: {
            resource_action: {
              resource: p.resource,
              action: p.action,
            },
          },
          update: {},
          create: p,
        }),
      ),
    );

    console.log(`Created ${createdPermissions.length} permissions`);

    const [adminRole, managerRole, leadRole, memberRole, reviewerRole] = roles;

    const adminPermissions = createdPermissions;

    const managerPermissions = createdPermissions.filter((p) =>
      [
        'view_organization',
        'view_project',
        'update_project',
        'archive_project',
        'manage_project_team',
        'create_module',
        'view_module',
        'update_module',
        'delete_module',
        'create_task',
        'view_task',
        'update_task',
        'delete_task',
        'assign_task',
        'upload_asset',
        'view_asset',
        'update_asset',
        'delete_asset',
        'approve_asset',
        'reject_asset',
        'finalize_asset',
        'view_project_analytics',
        'log_time',
      ].includes(p.name),
    );

    const leadPermissions = createdPermissions.filter((p) =>
      [
        'view_organization',
        'view_project',
        'view_module',
        'create_task',
        'view_task',
        'update_task',
        'delete_task',
        'assign_task',
        'upload_asset',
        'view_asset',
        'update_asset',
        'delete_asset',
        'log_time',
      ].includes(p.name),
    );

    const memberPermissions = createdPermissions.filter((p) =>
      [
        'view_organization',
        'view_project',
        'view_module',
        'view_task',
        'update_task',
        'assign_task',
        'upload_asset',
        'view_asset',
        'update_asset',
        'delete_asset',
        'log_time',
      ].includes(p.name),
    );

    const reviewerPermissions = createdPermissions.filter((p) =>
      [
        'view_organization',
        'view_project',
        'view_module',
        'view_task',
        'assign_task',
        'view_asset',
        'approve_asset',
        'reject_asset',
        'finalize_asset',
      ].includes(p.name),
    );

    const mappings = [
      ...adminPermissions.map((p) => ({
        roleId: adminRole.id,
        permissionId: p.id,
      })),
      ...managerPermissions.map((p) => ({
        roleId: managerRole.id,
        permissionId: p.id,
      })),
      ...leadPermissions.map((p) => ({
        roleId: leadRole.id,
        permissionId: p.id,
      })),
      ...memberPermissions.map((p) => ({
        roleId: memberRole.id,
        permissionId: p.id,
      })),
      ...reviewerPermissions.map((p) => ({
        roleId: reviewerRole.id,
        permissionId: p.id,
      })),
    ];

    // Delete existing mappings
    await prisma.rolePermission.deleteMany();

    // Create new mappings
    await prisma.rolePermission.createMany({
      data: mappings,
      skipDuplicates: true,
    });

    console.log(`Created ${mappings.length} role-permission mappings`);

    console.log('\n RBAC Summary:');
    console.log(`ADMIN: ${adminPermissions.length} permissions`);
    console.log(`MANAGER: ${managerPermissions.length} permissions`);
    console.log(`LEAD: ${leadPermissions.length} permissions`);
    console.log(`MEMBER: ${memberPermissions.length} permissions`);
    console.log(`REVIEWER: ${reviewerPermissions.length} permissions`);

    console.log('\n RBAC seeding complete!');
  } catch (error) {
    console.error(' RBAC seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedRBAC();
