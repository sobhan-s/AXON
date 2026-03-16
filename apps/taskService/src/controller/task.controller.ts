import type { Request, RequestHandler, Response } from 'express';
import { TaskService } from '../services/task.service.js';
import { ApiResponse } from '@dam/utils';
import { asyncHandler } from '@dam/utils';
import { logger } from '@dam/config';

const taskService = new TaskService();

export const createManualTask: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('create manually tasks in cotrollers  . . . ');

    const userId = req.user?.id as number;
    const ip = req.ip!;
    const userAgent = req.header('user-agent');
    const task = await taskService.createManualTask(
      Number(req.params.projectId),
      userId,
      req.body,
      ip,
      userAgent,
    );

    logger.info(' manually tasks creations successfully ');

    res
      .status(201)
      .json(new ApiResponse(201, task, 'Task created successfully'));
  },
);

export const getProjectTasks: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Fetching tasks by there projects . . . ');

    const { status, priority, taskType, assignedToId } = req.query;

    const tasks = await taskService.getProjectTasks(
      Number(req.params.projectId),
      {
        status: status as string,
        priority: priority as string,
        taskType: taskType as string,
        assignedToId: assignedToId ? Number(assignedToId) : undefined,
      },
    );

    logger.info('fetching tasks by there projects');
    res
      .status(200)
      .json(new ApiResponse(200, tasks, 'Tasks fetched successfully'));
  },
);

export const getTaskById: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('fetcing tasks by there id  . . .');

    const task = await taskService.getTaskById(Number(req.params.taskId));

    logger.info('fetchin tasks successfully there id .');
    res
      .status(200)
      .json(new ApiResponse(200, task, 'Task fetched successfully'));
  },
);

export const getMyTasks: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('get self taks  . . .');

    const { status, projectId } = req.query;
    const userId = req.user?.id as number;
    const tasks = await taskService.getMyTasks(userId, {
      status: status,
      projectId: projectId ? Number(projectId) : undefined,
    });

    logger.info('get my task successfully .');
    res.status(200).json(new ApiResponse(200, tasks, 'My tasks fetched'));
  },
);

export const getOverdueTasks: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('get overdue taks contorller . . .');

    const tasks = await taskService.getOverdueTasks(
      Number(req.params.projectId),
    );

    logger.info('OverDue taks successfully .');
    res.status(200).json(new ApiResponse(200, tasks, 'Overdue tasks fetched'));
  },
);

export const getMyOverdueTasks: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Get over due task sfor admin leve');

    const userId = req.user?.id as number;
    const tasks = await taskService.getMyOverdueTasks(userId);

    logger.info('over due taks of adminl level fetched succssfully');
    res
      .status(200)
      .json(new ApiResponse(200, tasks, 'My overdue tasks fetched'));
  },
);

export const updateTask: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Update takss in contrller level');

    const userId = req.user?.id as number;
    const ip = req.ip!;
    const userAgent = req.get('user-agent');

    const task = await taskService.updateTask(
      Number(req.params.taskId),
      userId,
      req.body,
      ip,
      userAgent,
    );

    logger.info('taks is update successfully');

    res
      .status(200)
      .json(new ApiResponse(200, task, 'Task updated successfully'));
  },
);

export const changeStatus: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Change status start in contrller level');

    const userId = req.user?.id as number;
    const ip = req.ip!;
    const userAgent = req.get('user-agent');
    const { status } = req.body;

    const task = await taskService.changeStatus(
      Number(req.params.taskId),
      userId,
      status,
      ip,
      userAgent,
    );

    logger.info('change status of taks successfully');
    res
      .status(200)
      .json(new ApiResponse(200, task, `Status changed to ${status}`));
  },
);

export const assignTask: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { assignedToId } = req.body;
    const task = await taskService.assignTask(
      Number(req.params.taskId),
      req.user?.id as number,
      assignedToId,
      req.ip,
      req.headers['user-agent'],
    );
    res
      .status(200)
      .json(new ApiResponse(200, task, 'Task assigned successfully'));
  },
);

export const deleteTask: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await taskService.deleteTask(
      Number(req.params.taskId),
      req.user?.id as number,
      req.ip,
      req.headers['user-agent'],
    );
    res
      .status(200)
      .json(new ApiResponse(200, null, 'Task deleted successfully'));
  },
);

export const bulkAssign: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { taskIds, assignedToId } = req.body;
    const result = await taskService.bulkAssign(
      taskIds,
      assignedToId,
      req.user?.id as number,
      req.ip,
      req.headers['user-agent'],
    );
    res.status(200).json(new ApiResponse(200, result, 'Tasks bulk assigned'));
  },
);

export const bulkChangeStatus: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { taskIds, status } = req.body;
    const result = await taskService.bulkChangeStatus(
      taskIds,
      status,
      req.user?.id as number,
      req.ip,
      req.headers['user-agent'],
    );
    res.status(200).json(new ApiResponse(200, result, 'Tasks status updated'));
  },
);

export const bulkDelete: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { taskIds } = req.body;
    const result = await taskService.deleteBulkTasks(
      taskIds,
      req.user?.id as number,
      req.ip,
      req.headers['user-agent'],
    );
    res.status(200).json(new ApiResponse(200, result, 'Tasks deleted'));
  },
);

export const getApprovals: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const approvals = await taskService.getApprovals(
      Number(req.params.taskId),
      req.user?.id as number,
    );
    res.status(200).json(new ApiResponse(200, approvals, 'Approvals fetched'));
  },
);

export const getPendingApprovals: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const approvals = await taskService.getPendingApprovals(
      Number(req.params.projectId),
    );
    res
      .status(200)
      .json(new ApiResponse(200, approvals, 'Pending Approvals fetched'));
  },
);

export const getTimeLogs: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await taskService.getTimeLogs(
      Number(req.params.taskId),
      req.user?.id as number,
    );
    res.status(200).json(new ApiResponse(200, result, 'Time logs fetched'));
  },
);

export const deleteTimeLog: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await taskService.deleteTimeLog(
      Number(req.params.taskId),
      Number(req.params.timeLogId),
      req.user?.id as number,
    );
    res.status(200).json(new ApiResponse(200, null, 'Time log deleted'));
  },
);
