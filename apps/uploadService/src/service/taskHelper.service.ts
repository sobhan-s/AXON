import { logger } from '@dam/config';
import { ActivityService } from '@dam/common';
import { TaskRepository, ApprovalRepository } from '@dam/repository';

export class TaskHelperService {
  private taskRepo: TaskRepository;
  private approvalRepo: ApprovalRepository;
  private activitySvc: ActivityService;

  constructor() {
    this.taskRepo = new TaskRepository();
    this.approvalRepo = new ApprovalRepository();
    this.activitySvc = new ActivityService();
  }

  async updateTaskAsset(taskId: number, assetId: string) {
    return this.taskRepo.updateTaskAsset(taskId, assetId);
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
}
