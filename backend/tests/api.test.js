const request = require('supertest');
const mongoose = require('mongoose');
const { buildApp } = require('../src/app');
const database = require('../src/config/database');
const User = require('../src/models/user.model');
const Task = require('../src/models/task.model');

let app;
let token;
let userId;

beforeAll(async () => {
  await database.connect();
  app = buildApp();
});

afterAll(async () => {
  await User.deleteMany({});
  await Task.deleteMany({});
  await database.disconnect();
});

describe('Auth + Tasks flow', () => {
  test('signup creates a user and returns a token', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('alice@example.com');
    token = res.body.data.token;
    userId = res.body.data.user.id;
  });

  test('rejects duplicate email signup', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(409);
  });

  test('login works with valid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'alice@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  test('rejects bad login', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'alice@example.com',
      password: 'wrong',
    });
    expect(res.status).toBe(401);
  });

  test('protected route rejects unauthenticated', async () => {
    const res = await request(app).get('/api/v1/tasks');
    expect(res.status).toBe(401);
  });

  test('creates, lists, toggles, updates and deletes a task', async () => {
    const create = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Buy milk', priority: 'high' });
    expect(create.status).toBe(201);
    const taskId = create.body.data.task.id;

    const list = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.items.length).toBe(1);

    const toggle = await request(app)
      .post(`/api/v1/tasks/${taskId}/toggle`)
      .set('Authorization', `Bearer ${token}`);
    expect(toggle.status).toBe(200);
    expect(toggle.body.data.task.status).toBe('completed');

    const update = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Buy almond milk' });
    expect(update.status).toBe(200);
    expect(update.body.data.task.title).toBe('Buy almond milk');

    const del = await request(app)
      .delete(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
  });

  test('users cannot see other users tasks', async () => {
    // Create a second user + a task for them
    const bobSignup = await request(app).post('/api/v1/auth/signup').send({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'password123',
    });
    const bobToken = bobSignup.body.data.token;
    const bobCreate = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ title: 'Bob task' });
    const bobTaskId = bobCreate.body.data.task.id;

    // Alice tries to access Bob's task
    const r = await request(app)
      .get(`/api/v1/tasks/${bobTaskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(404);
  });
});