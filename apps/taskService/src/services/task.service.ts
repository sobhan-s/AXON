import { logger } from '@dam/config';
import { ApiError } from '@dam/utils';
import { ActivityService, AuthRepository } from '@dam/common';
import { TaskRepository } from '../repository/task.repository.js';
import { ApprovalRepository } from '../repository/approval.repository.js';
import { TimelogRepository } from '../repository/timelog.repository.js';
import type {
  CreateManualTaskPayload,
  UpdateTaskPayload,
  TaskFilters,
} from '../interfaces/task.interface.js';
import { AssetRepository } from '../repository/asset.repository.js';

const LEVEL = {
  ADMIN: 1,
  MANAGER: 2,
  LEAD: 3,
  REVIEWER: 4,
  MEMBER: 5,
} as const;

const CAN_CREATE_MANUAL = [LEVEL.ADMIN, LEVEL.MANAGER, LEVEL.LEAD];
const CAN_FINALIZE = [LEVEL.ADMIN, LEVEL.MANAGER, LEVEL.LEAD];
const CAN_MANAGE_TASK = [LEVEL.ADMIN, LEVEL.MANAGER, LEVEL.LEAD];
const CAN_REVIEW = [LEVEL.ADMIN, LEVEL.MANAGER, LEVEL.REVIEWER];
const CAN_UPLOAD = [LEVEL.ADMIN, LEVEL.MANAGER, LEVEL.LEAD, LEVEL.MEMBER];

export class TaskService {
  private taskRepo: TaskRepository;
  private approvalRepo: ApprovalRepository;
  private timelogRepo: TimelogRepository;
  private activitySvc: ActivityService;
  private authRepo: AuthRepository;
  private assetRepo: AssetRepository;

  constructor() {
    this.taskRepo = new TaskRepository();
    this.approvalRepo = new ApprovalRepository();
    this.timelogRepo = new TimelogRepository();
    this.activitySvc = new ActivityService();
    this.authRepo = new AuthRepository();
    this.assetRepo = new AssetRepository();
  }

  async createManualTask(
    projectId: number,
    createdById: number,
    data: CreateManualTaskPayload,
    ip?: string,
    userAgent?: string,
  ) {
    logger.info('Creating manual task', { projectId, createdById });

    const task = await this.taskRepo.createManualTask(
      projectId,
      createdById,
      data,
    );

    await this.activitySvc.logActivity({
      userId: createdById,
      organizationId: task.project.organizationId,
      action: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: task.id.toString(),
      details: { taskTitle: task.title, taskType: 'MANUAL' },
      ipAddress: ip,
      userAgent,
    });

    return task;
  }

  async createAssetBasedTask(
    projectId: number,
    uploadedById: number,
    organizationId: number,
    filename: string,
    assetId: string,
    ip?: string,
    userAgent?: string,
  ) {
    logger.info('Auto-creating asset-based task', {
      projectId,
      uploadedById,
      filename,
    });

    const task = await this.taskRepo.createAssetBasedTask(
      projectId,
      uploadedById,
      organizationId,
      filename,
      assetId,
    );

    await this.approvalRepo.createApproval(
      task.id,
      uploadedById,
      assetId,
      projectId,
    );

    await this.activitySvc.logActivity({
      userId: uploadedById,
      organizationId,
      action: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: task.id.toString(),
      details: { taskTitle: filename, taskType: 'ASSET_BASED', assetId },
      ipAddress: ip,
      userAgent,
    });

    return task;
  }

  async assignTask(
    taskId: number,
    requesterId: number,
    assignedToId: number,
    ip?: string,
    userAgent?: string,
  ) {
    logger.info('Assigning task', { taskId, assignedToId, requesterId });

    const task = await this.taskRepo.findTaskById(taskId);
    if (!task) throw new ApiError(404, 'Task not found');

    const requesterMember = await this.taskRepo.getMemberRole(
      task.project.id,
      requesterId,
    );
    if (!requesterMember)
      throw new ApiError(403, 'You are not a member of this project');

    const assigneeMember = await this.taskRepo.getMemberRole(
      task.project.id,
      assignedToId,
    );
    if (!assigneeMember)
      throw new ApiError(400, 'Assigned user is not a member of this project');

    const requesterLevel = requesterMember.role.level;
    const { status, taskType } = task;

    if (status === 'TODO') {
      if (!CAN_MANAGE_TASK.includes(requesterLevel as any)) {
        throw new ApiError(
          403,
          'Only Lead, Manager or Admin can assign tasks at TODO stage',
        );
      }
      if (assigneeMember.role.level !== LEVEL.MEMBER) {
        throw new ApiError(400, 'Can only assign a Member to a TODO task');
      }
    } else if (status === 'REVIEW') {
      const isUploader = task.createdById === requesterId;
      const isAssignedMember = task.assignedToId === requesterId;

      if (
        !isUploader &&
        !isAssignedMember &&
        !CAN_MANAGE_TASK.includes(requesterLevel as any)
      ) {
        throw new ApiError(
          403,
          'Only the task owner or Lead/Manager can assign a reviewer',
        );
      }
      if (!CAN_REVIEW.includes(assigneeMember.role.level as any)) {
        throw new ApiError(400, 'Reviewer must be Admin, Manager or REVIEWER');
      }
    } else if (status === 'FAILED') {
      if (!CAN_REVIEW.includes(requesterLevel as any)) {
        throw new ApiError(403, 'Only a Reviewer can reassign after rejection');
      }

      const expectedUserId =
        taskType === 'ASSET_BASED' ? task.createdById : task.createdById;
    } else {
      throw new ApiError(400, `Cannot reassign a task in ${status} status`);
    }

    const updated = await this.taskRepo.assignTask(taskId, assignedToId);

    await this.activitySvc.logActivity({
      userId: requesterId,
      organizationId: task.project.organizationId,
      action: 'TASK_ASSIGNED',
      entityType: 'TASK',
      entityId: taskId.toString(),
      details: { assignedToId, status },
      ipAddress: ip,
      userAgent,
    });

    return updated;
  }

  async changeStatus(
    taskId: number,
    userId: number,
    newStatus: string,
    ip?: string,
    userAgent?: string,
  ) {
    logger.info('Changing task status', { taskId, newStatus, userId });

    const task = await this.taskRepo.findTaskById(taskId);
    if (!task) throw new ApiError(404, 'Task not found');

    const member = await this.taskRepo.getMemberRole(task.project.id, userId);
    if (!member) {
      throw new ApiError(403, 'You are not a member of this project');
    }

    const currentStatus = task.status;
    const level = member.role.level;

    // TODO to IN_PROGRESS
    // MEMBER only, must be assigned to this task
    if (currentStatus === 'TODO' && newStatus === 'IN_PROGRESS') {
      if (level !== LEVEL.MEMBER) {
        throw new ApiError(403, 'Only the assigned Member can start the task');
      }
      if (task.assignedToId !== userId) {
        throw new ApiError(403, 'You can only start tasks assigned to you');
      }
      if (task.taskType !== 'MANUAL') {
        throw new ApiError(400, 'ASSET_BASED tasks do not have a TODO stage');
      }

      await this.taskRepo.updateTaskStatus(taskId, 'IN_PROGRESS');

      await this.timelogRepo.openSession(taskId, userId);
    }

    // IN_PROGRESS to REVIEW
    else if (currentStatus === 'IN_PROGRESS' && newStatus === 'REVIEW') {
      if (level !== LEVEL.MEMBER) {
        throw new ApiError(
          403,
          'Only the assigned Member can submit for review',
        );
      }
      if (task.assignedToId !== userId) {
        throw new ApiError(403, 'You can only submit tasks assigned to you');
      }
      if (!task.assetId) {
        throw new ApiError(
          400,
          'You must upload a file before submitting for review',
        );
      }

      await this.taskRepo.updateTaskStatus(taskId, 'REVIEW');

      await this.timelogRepo.closeSession(taskId, userId);

      const pending =
        await this.approvalRepo.getPendingApprovalByTaskId(taskId);
      if (!pending) {
        await this.approvalRepo.createApproval(
          taskId,
          userId,
          task.assetId,
          task.project.id,
        );
      }
    }

    // REVIEW to APPROVED
    else if (currentStatus === 'REVIEW' && newStatus === 'APPROVED') {
      const notAccess = [4, 5];
      const findiingTask = await this.taskRepo.findTaskById(taskId);
      if (!CAN_REVIEW.includes(level as any)) {
        throw new ApiError(
          403,
          'Only Admin, Manager or REVIEWER can approve tasks',
        );
      }
      if (task.assignedToId !== userId && notAccess.includes(level)) {
        throw new ApiError(
          403,
          'Only the assigned reviewer can approve this task',
        );
      }

      const pending =
        await this.approvalRepo.getPendingApprovalByTaskId(taskId);
      if (pending) {
        await this.approvalRepo.reviewApproval(pending.id, userId, 'APPROVED');
      }

      const asset = await this.assetRepo.getById(String(findiingTask?.assetId));

      if (!asset) {
        throw new ApiError(500, 'Asset has been not found');
      }
      const updatedAsset = await this.assetRepo.updateAsset(
        asset._id,
        'approved',
      );

      await this.taskRepo.updateTaskStatus(taskId, 'APPROVED');
    }

    // REVIEW to FAILED
    else if (currentStatus === 'REVIEW' && newStatus === 'FAILED') {
      const findiingTask = await this.taskRepo.findTaskById(taskId);
      const notAccess = [4, 5];
      if (!CAN_REVIEW.includes(level as any)) {
        throw new ApiError(
          403,
          'Only Admin, Manager or REVIEWER can reject tasks',
        );
      }
      if (task.assignedToId !== userId && notAccess.includes(level)) {
        throw new ApiError(
          403,
          'Only the assigned reviewer can reject this task',
        );
      }

      const pending =
        await this.approvalRepo.getPendingApprovalByTaskId(taskId);
      if (pending) {
        await this.approvalRepo.reviewApproval(pending.id, userId, 'REJECTED');
      }

      const asset = await this.assetRepo.getById(String(findiingTask?.assetId));

      if (!asset) {
        throw new ApiError(500, 'Asset has been not found');
      }
      const updatedAsset = await this.assetRepo.updateAsset(
        asset._id,
        'rejected',
      );

      await this.taskRepo.updateTaskStatus(taskId, 'FAILED');
    }

    // FAILED to REVIEW
    else if (currentStatus === 'FAILED' && newStatus === 'REVIEW') {
      // Must be the original uploader / assigned member
      const isCreator = task.createdById === userId;
      const isAssignedTo = task.assignedToId === userId;

      if (!isCreator && !isAssignedTo) {
        throw new ApiError(403, 'Only the original uploader can resubmit');
      }
      if (!task.assetId) {
        throw new ApiError(
          400,
          'You must upload a new file before resubmitting',
        );
      }

      await this.taskRepo.updateTaskStatus(taskId, 'REVIEW');

      await this.timelogRepo.openSession(taskId, userId);

      await this.approvalRepo.createApproval(
        taskId,
        userId,
        task.assetId,
        task.project.id,
      );
    } else if (currentStatus === 'APPROVED' && newStatus === 'DONE') {
      if (!CAN_FINALIZE.includes(level as any)) {
        throw new ApiError(403, 'Only Lead, Manager or Admin can close a task');
      }

      await this.taskRepo.updateTaskStatus(taskId, 'DONE');
    } else {
      throw new ApiError(
        400,
        `Invalid transition: ${currentStatus} → ${newStatus}`,
      );
    }

    await this.activitySvc.logActivity({
      userId,
      organizationId: task.project.organizationId,
      action: 'TASK_STATUS_CHANGED',
      entityType: 'TASK',
      entityId: taskId.toString(),
      details: { from: currentStatus, to: newStatus },
      ipAddress: ip,
      userAgent,
    });

    return this.taskRepo.findTaskById(taskId);
  }

  async linkUploadToManualTask(
    taskId: number,
    userId: number,
    assetId: string,
    ip?: string,
    userAgent?: string,
  ) {
    logger.info('Linking upload to manual task', { taskId, userId, assetId });

    const task = await this.taskRepo.findTaskById(taskId);
    if (!task) throw new ApiError(404, 'Task not found');

    if (task.taskType !== 'MANUAL') {
      throw new ApiError(400, 'Use the upload section for ASSET_BASED tasks');
    }

    if (!['IN_PROGRESS', 'FAILED'].includes(task.status)) {
      throw new ApiError(
        400,
        `Cannot upload to a task with status ${task.status}`,
      );
    }

    if (task.assignedToId !== userId) {
      throw new ApiError(403, 'You can only upload to tasks assigned to you');
    }

    await this.taskRepo.updateTaskAsset(taskId, assetId);
    await this.timelogRepo.closeSession(taskId, userId);
    await this.taskRepo.updateTaskStatus(taskId, 'REVIEW');
    await this.approvalRepo.createApproval(
      taskId,
      userId,
      assetId,
      task.project.id,
    );

    await this.activitySvc.logActivity({
      userId,
      organizationId: task.project.organizationId,
      action: 'ASSET_UPLOADED',
      entityType: 'TASK',
      entityId: taskId.toString(),
      details: { assetId, from: task.status, to: 'REVIEW' },
      ipAddress: ip,
      userAgent,
    });

    return this.taskRepo.findTaskById(taskId);
  }

  async getProjectTasks(projectId: number, filters: TaskFilters = {}) {
    logger.info('Fetching project tasks', { projectId, filters });
    const tasks = await this.taskRepo.findTasksByProject(projectId, filters);

    return tasks;
  }

  async getTaskById(taskId: number) {
    const task = await this.taskRepo.findTaskById(taskId);
    if (!task) throw new ApiError(404, 'Task not found');
    return task;
  }

  async getMyTasks(
    userId: number,
    filters?: { status?: any; projectId?: number },
  ) {
    logger.info('fetching my tasks');
    const myTakss = await this.taskRepo.getMyTasks(userId, filters);

    return myTakss;
  }

  async getOverdueTasks(projectId: number) {
    logger.info('Fetching the overdue taks');
    const overDueTasks = await this.taskRepo.getProjectOverdueTasks(projectId);

    return overDueTasks;
  }

  async getMyOverdueTasks(userId: number) {
    logger.info('Get overdue tasks of a user');
    const overDueTasksOfUser = await this.taskRepo.getMyOverdueTasks(userId);

    return overDueTasksOfUser;
  }

  async updateTask(
    taskId: number,
    userId: number,
    data: UpdateTaskPayload,
    ip?: string,
    userAgent?: string,
  ) {
    const task = await this.taskRepo.findTaskById(taskId);
    if (!task) throw new ApiError(404, 'Task not found');

    const member = await this.taskRepo.getMemberRole(task.project.id, userId);
    if (!member)
      throw new ApiError(403, 'You are not a member of this project');
    if (!CAN_MANAGE_TASK.includes(member.role.level as any)) {
      throw new ApiError(
        403,
        'Only Admin, Manager or Lead can update task details',
      );
    }

    const updated = await this.taskRepo.updateTask(taskId, data);

    await this.activitySvc.logActivity({
      userId,
      organizationId: task.project.organizationId,
      action: 'TASK_UPDATED',
      entityType: 'TASK',
      entityId: taskId.toString(),
      details: { updated: Object.keys(data) },
      ipAddress: ip,
      userAgent,
    });

    return updated;
  }

  async deleteTask(
    taskId: number,
    userId: number,
    ip?: string,
    userAgent?: string,
  ) {
    const task = await this.taskRepo.findTaskById(taskId);
    if (!task) throw new ApiError(404, 'Task not found');

    const member = await this.taskRepo.getMemberRole(task.project.id, userId);
    if (!member)
      throw new ApiError(403, 'You are not a member of this project');
    if (!CAN_MANAGE_TASK.includes(member.role.level as any)) {
      throw new ApiError(403, 'Only Admin, Manager or Lead can delete tasks');
    }

    const deliteDtask = await this.taskRepo.deleteTask(taskId);

    await this.activitySvc.logActivity({
      userId: userId,
      organizationId: task.project.organizationId,
      action: 'TASK_DELITED',
      entityType: 'TASK',
      entityId: task.id.toString(),
      details: { taskTitle: task.title, taskType: 'MANUAL' },
      ipAddress: ip,
      userAgent,
    });

    return {
      message: `Tasks ${taskId} is delited`,
      data: deliteDtask,
    };
  }

  async deleteBulkTasks(
    taskIds: number[],
    userId: number,
    ip?: string,
    userAgent?: string,
  ) {
    if (taskIds.length === 0) throw new ApiError(400, 'No task IDs provided');

    const task = await this.taskRepo.findTaskById(taskIds[0] as number);
    if (!task) throw new ApiError(404, 'Task not found');

    const member = await this.taskRepo.getMemberRole(task.project.id, userId);
    if (!member)
      throw new ApiError(403, 'You are not a member of this project');
    if (!CAN_MANAGE_TASK.includes(member.role.level as any)) {
      throw new ApiError(403, 'Only Admin, Manager or Lead can delete tasks');
    }

    await this.activitySvc.logActivity({
      userId: userId,
      organizationId: task.project.organizationId,
      action: 'TASK_DELITED',
      entityType: 'TASK',
      entityId: task.id.toString(),
      details: { taskTitle: task.title, taskType: 'MANUAL' },
      ipAddress: ip,
      userAgent,
    });

    const delieBulk = await this.taskRepo.deleteBulkTask(taskIds);

    return {
      data: delieBulk,
      message: `Bulk tasks are delited , tasksid :  ${taskIds}`,
    };
  }

  async bulkAssign(
    taskIds: number[],
    assignedToId: number,
    assignFromId: number,
    ip?: string,
    userAgent?: string,
  ) {
    if (taskIds.length === 0) throw new ApiError(400, 'No task IDs provided');

    const task = await this.taskRepo.findTaskById(taskIds[0] as number);
    if (!task) throw new ApiError(404, 'Task not found');

    const member = await this.taskRepo.getMemberRole(
      task.project.id,
      assignFromId,
    );
    if (!member)
      throw new ApiError(403, 'You are not a member of this project');
    if (!CAN_MANAGE_TASK.includes(member.role.level as any)) {
      throw new ApiError(
        403,
        'Only Admin, Manager or Lead can bulk assign tasks',
      );
    }

    const bulkAssign = await this.taskRepo.bulkAssignTask(
      taskIds,
      assignedToId,
    );

    await this.activitySvc.logActivity({
      userId: assignFromId,
      organizationId: task.project.organizationId,
      action: 'TASK_ASSIGNED',
      entityType: 'TASK',
      entityId: task.id.toString(),
      details: { taskTitle: task.title, taskType: 'MANUAL,', data: bulkAssign },
      ipAddress: ip,
      userAgent,
    });

    return {
      bulkAssign,
    };
  }

  async bulkChangeStatus(
    taskIds: number[],
    status: any,
    assignFromId: number,
    ip?: string,
    userAgent?: string,
  ) {
    if (taskIds.length === 0) throw new ApiError(400, 'No task IDs provided');

    const task = await this.taskRepo.findTaskById(taskIds[0] as number);
    if (!task) throw new ApiError(404, 'Task not found');

    const member = await this.taskRepo.getMemberRole(
      task.project.id,
      assignFromId,
    );
    if (!member)
      throw new ApiError(403, 'You are not a member of this project');
    if (!CAN_MANAGE_TASK.includes(member.role.level as any)) {
      throw new ApiError(
        403,
        'Only Admin, Manager or Lead can bulk update status',
      );
    }

    const bulkAssignTask = await this.taskRepo.bulkStaus(taskIds, status);

    await this.activitySvc.logActivity({
      userId: assignFromId,
      organizationId: task.project.organizationId,
      action: 'TASK_ASSIGNED',
      entityType: 'TASK',
      entityId: task.id.toString(),
      details: {
        taskTitle: task.title,
        taskType: 'MANUAL,',
        data: bulkAssignTask,
      },
      ipAddress: ip,
      userAgent,
    });
  }

  async getApprovals(taskId: number, userId: number) {
    logger.info('Fetching the approval Records . . .');
    const task = await this.taskRepo.findTaskById(taskId);

    if (!task) throw new ApiError(404, 'Task not found');

    const approvals = await this.approvalRepo.findApprovalsByTask(taskId);

    return approvals;
  }

  async getPendingApprovals(projectId: number) {
    logger.info('Fetching the approval Records . . .');
    const project = await this.taskRepo.findProjectById(projectId);

    if (!project) throw new ApiError(404, 'project not found');

    const approvals = await this.approvalRepo.getPendingApprovals(projectId);

    return approvals;
  }

  async getTimeLogs(taskId: number, userId: number) {
    logger.info('Fetching the timelogs');

    const task = await this.taskRepo.findTaskById(taskId);
    if (!task) throw new ApiError(404, 'Task not found');

    const member = await this.taskRepo.getMemberRole(task.project.id, userId);
    if (!member)
      throw new ApiError(403, 'You are not a member of this project');

    if (member.role.level === LEVEL.MEMBER) {
      const logs = await this.timelogRepo.findTimeLogsByUser(taskId, userId);
      const total = await this.timelogRepo.getTotalHoursByUser(taskId, userId);
      return { timeLogs: logs, totalHours: total };
    }

    const logs = await this.timelogRepo.findTimeLogsByTask(taskId);
    const total = await this.timelogRepo.getTotalHours(taskId);
    return { timeLogs: logs, totalHours: total };
  }

  async deleteTimeLog(taskId: number, timeLogId: number, userId: number) {
    logger.info('delite timelog at admin level');
    const task = await this.taskRepo.findTaskById(taskId);
    if (!task) throw new ApiError(404, 'Task not found');

    const member = await this.taskRepo.getMemberRole(task.project.id, userId);
    if (!member)
      throw new ApiError(403, 'You are not a member of this project');
    if (!CAN_MANAGE_TASK.includes(member.role.level as any)) {
      throw new ApiError(
        403,
        'Only Admin, Manager or Lead can delete time logs',
      );
    }

    const log = await this.timelogRepo.findTimeLogById(timeLogId);
    if (!log) throw new ApiError(404, 'Time log not found');
    if (log.taskId !== taskId)
      throw new ApiError(400, 'Time log does not belong to this task');

    await this.timelogRepo.deleteTimeLog(timeLogId);
  }
}
