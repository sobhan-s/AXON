import request from 'supertest';
import express from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

let app: any;

const mocks = {
  createComment: vi.fn(),
  getTaskComments: vi.fn(),
  updateComment: vi.fn(),
  deleteComment: vi.fn(),
};

vi.mock('../../controller/comment.controller.js', () => ({
  createComment: mocks.createComment,
  getTaskComments: mocks.getTaskComments,
  updateComment: mocks.updateComment,
  deleteComment: mocks.deleteComment,
}));

vi.mock('@dam/middlewares', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: 1 };
    next();
  },
  requireProjectAccess: (_req: any, _res: any, next: any) => next(),
}));

describe('Comment Routes', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const router = (await import('../../routes/comment.routes.js')).default;

    app = express();
    app.use(express.json());
    app.use('/api/comments', router);
  });

  it('/:projectId/create', async () => {
    mocks.createComment.mockImplementation((req, res) =>
      res.status(201).json({}),
    );

    const res = await request(app)
      .post('/api/comments/1/create')
      .send({ text: 'hello' });

    expect(res.status).toBe(201);
    expect(mocks.createComment).toHaveBeenCalled();
  });

  it('/:projectId/task/:taskId', async () => {
    mocks.getTaskComments.mockImplementation((req, res) =>
      res.status(200).json([]),
    );

    const res = await request(app).get('/api/comments/1/task/10');

    expect(res.status).toBe(200);
    expect(mocks.getTaskComments).toHaveBeenCalled();
  });

  it('/:projectId/:commentId', async () => {
    mocks.updateComment.mockImplementation((req, res) =>
      res.status(200).json({}),
    );

    const res = await request(app)
      .patch('/api/comments/1/5')
      .send({ text: 'updated' });

    expect(res.status).toBe(200);
    expect(mocks.updateComment).toHaveBeenCalled();
  });

  it('/:projectId/:commentId', async () => {
    mocks.deleteComment.mockImplementation((req, res) =>
      res.status(204).send(),
    );

    const res = await request(app).delete('/api/comments/1/5');

    expect(res.status).toBe(204);
    expect(mocks.deleteComment).toHaveBeenCalled();
  });
});
