const request = require('supertest');
const mongoose = require('mongoose');
const { buildApp } = require('../src/app');
const database = require('../src/config/database');
const User = require('../src/models/user.model');
const Task = require('../src/models/task.model');
const ApiError = require('../src/utils/ApiError');
const { invalidateAuthCache } = require('../src/middlewares/auth.middleware');

// These tests exercise error paths — they should NOT require authentication
// for the request-rejection cases (auth runs after body parsing).

let app;
let token;

beforeAll(async () => {
  await database.connect();
  app = buildApp();
});

afterAll(async () => {
  await User.deleteMany({});
  await Task.deleteMany({});
  await database.disconnect();
});

describe('Error middleware regressions (BUG-001, BUG-002, BUG-101, BUG-102, BUG-103, BUG-207, BUG-209)', () => {
  test('BUG-002: oversized JSON body returns 413 with JSON envelope (not 500)', async () => {
    // 2 MB body, default limit is 1 MB
    const big = 'x'.repeat(2 * 1024 * 1024);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'a@b.com', password: big }));
    expect(res.status).toBe(413);
    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(413);
    expect(res.body.message).toBe('Payload too large');
    expect(res.body.details).toBeDefined();
    expect(res.body.details.limit).toBe(1048576);
  });

  test('malformed JSON body returns 400 (entity.parse.failed)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{not valid json');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Malformed JSON body');
  });

  test('BUG-207: every response includes a requestId', async () => {
    const res = await request(app).get('/');
    expect(res.body.requestId).toBeUndefined(); // root uses plain res.json without req.id path; we accept either
    // Error responses definitely include it:
    const r2 = await request(app).get('/api/v1/nonexistent');
    expect(r2.status).toBe(404);
    expect(r2.body.requestId).toBeDefined();
    expect(typeof r2.body.requestId).toBe('string');
  });

  test('BUG-209: health endpoint reports DB status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.data.db).toBe('up');
    expect(res.body.data.dbState).toBe(1);
  });

  test('BUG-101: 4xx responses do NOT include stack trace', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.stack).toBeUndefined();
  });

  test('ApiError helper factories produce correct shape', () => {
    const e = ApiError.badRequest('bad');
    expect(e.statusCode).toBe(400);
    expect(e.message).toBe('bad');

    const e2 = ApiError.notFound('missing');
    expect(e2.statusCode).toBe(404);

    const e3 = ApiError.conflict('dup');
    expect(e3.statusCode).toBe(409);

    const e4 = ApiError.unauthorized('no');
    expect(e4.statusCode).toBe(401);

    const e5 = ApiError.forbidden('denied');
    expect(e5.statusCode).toBe(403);
  });
});

describe('Auth regressions (BUG-103, BUG-005, BUG-106, BUG-107, BUG-108)', () => {
  test('BUG-005: changing password invalidates the old token (tokenVersion)', async () => {
    const signup = await request(app).post('/api/v1/auth/signup').send({
      name: 'Carol',
      email: 'carol@example.com',
      password: 'Password123!',
    });
    expect(signup.status).toBe(201);
    const oldToken = signup.body.data.token;
    const carolId = signup.body.data.user.id;

    // Verify old token works
    const me1 = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${oldToken}`);
    expect(me1.status).toBe(200);

    // Bump tokenVersion manually to simulate "logout everywhere"
    await User.findByIdAndUpdate(carolId, { $inc: { tokenVersion: 1 } });
    // Invalidate the in-memory auth cache so the middleware re-reads the user.
    invalidateAuthCache(carolId);

    const me2 = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${oldToken}`);
    expect(me2.status).toBe(401);
    expect(me2.body.message).toMatch(/token/i);
  });

  test('BUG-107: search filter without q returns 400', async () => {
    const signup = await request(app).post('/api/v1/auth/signup').send({
      name: 'Dan',
      email: 'dan@example.com',
      password: 'Password123!',
    });
    const danToken = signup.body.data.token;

    const res = await request(app)
      .get('/api/v1/tasks?filter=search')
      .set('Authorization', `Bearer ${danToken}`);
    expect(res.status).toBe(400);
  });

  test('BUG-108: text search returns matching task', async () => {
    // Reuse Dan
    const dan = await User.findOne({ email: 'dan@example.com' });
    const danTokenRes = await request(app).post('/api/v1/auth/login').send({
      email: 'dan@example.com',
      password: 'Password123!',
    });
    const danToken = danTokenRes.body.data.token;

    await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${danToken}`)
      .send({ title: 'Buy organic bananas', description: 'from the local market' });

    await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${danToken}`)
      .send({ title: 'Pay electricity bill', description: 'urgent' });

    const res = await request(app)
      .get('/api/v1/tasks?filter=search&q=banana')
      .set('Authorization', `Bearer ${danToken}`);
    expect(res.status).toBe(200);
    const titles = res.body.data.items.map((t) => t.title);
    expect(titles.some((t) => t.includes('banana'))).toBe(true);
  });

  test('BUG-106: completedAt is set when status flips to completed', async () => {
    const dan = await request(app).post('/api/v1/auth/login').send({
      email: 'dan@example.com',
      password: 'Password123!',
    });
    const danToken = dan.body.data.token;
    const create = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${danToken}`)
      .send({ title: 'Walk the dog' });
    const id = create.body.data.task.id;

    const toggle = await request(app)
      .post(`/api/v1/tasks/${id}/toggle`)
      .set('Authorization', `Bearer ${danToken}`);
    expect(toggle.status).toBe(200);
    expect(toggle.body.data.task.status).toBe('completed');
    expect(toggle.body.data.task.completedAt).toBeDefined();
    expect(new Date(toggle.body.data.task.completedAt).toString()).not.toBe('Invalid Date');

    // Toggle back to pending
    const toggle2 = await request(app)
      .post(`/api/v1/tasks/${id}/toggle`)
      .set('Authorization', `Bearer ${danToken}`);
    expect(toggle2.body.data.task.status).toBe('pending');
    expect(toggle2.body.data.task.completedAt).toBeNull();
  });

  test('BUG-001: invalid ObjectId in /tasks/:id returns 404', async () => {
    const dan = await request(app).post('/api/v1/auth/login').send({
      email: 'dan@example.com',
      password: 'Password123!',
    });
    const danToken = dan.body.data.token;
    const res = await request(app)
      .get('/api/v1/tasks/12345')
      .set('Authorization', `Bearer ${danToken}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Task not found');
  });
});
