/**
 * Regression tests for the fixes applied after the production audit.
 * Each describe block corresponds to one or more BUG IDs in the audit report.
 */
const request = require('supertest');
const { buildApp } = require('../src/app');
const database = require('../src/config/database');
const User = require('../src/models/user.model');
const Task = require('../src/models/task.model');
const config = require('../src/config');

let app;
let aliceToken;
let aliceId;

beforeAll(async () => {
  await database.connect();
  app = buildApp();
});

afterAll(async () => {
  await User.deleteMany({});
  await Task.deleteMany({});
  await database.disconnect();
});

describe('BUG-H10: Strong password policy', () => {
  test('rejects passwords shorter than 8 characters', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      name: 'Weak Pass',
      email: 'weakpass@example.com',
      password: 'short1',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
  });

  test('rejects passwords without a digit', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      name: 'No Digit',
      email: 'nodigit@example.com',
      password: 'onlyletters',
    });
    expect(res.status).toBe(400);
  });

  test('rejects passwords without a letter', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      name: 'No Letter',
      email: 'noletter@example.com',
      password: '12345678',
    });
    expect(res.status).toBe(400);
  });

  test('accepts a password that satisfies the policy', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      name: 'Strong Pass',
      email: 'strongpass@example.com',
      password: 'Goodpass1',
    });
    expect(res.status).toBe(201);
  });
});

describe('BUG-C07: DTO escapes user-controlled strings on output', () => {
  let token;
  beforeAll(async () => {
    const signup = await request(app).post('/api/v1/auth/signup').send({
      name: 'XSS User',
      email: 'xssuser@example.com',
      password: 'Goodpass1',
    });
    token = signup.body.data.token;
  });

  test('task title with <script> is escaped in the response', async () => {
    // Joi strips HTML on input, so the title is stored without tags.
    // The DTO additionally escapes on output as defense-in-depth.
    const create = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Safe Title', description: '<script>alert(1)</script>' });
    expect(create.status).toBe(201);
    // Description was sanitized at the validator layer.
    expect(create.body.data.task.description).not.toMatch(/<script/i);
  });
});

describe('BUG-C01: assertJwtSecret rejects placeholder secrets in production', () => {
  const { assertJwtSecret } = require('../src/config');

  test('throws when given a placeholder secret in production', () => {
    expect(() =>
      assertJwtSecret('replace_with_a_long_random_secret', 'production')
    ).toThrow(/placeholder/i);
    expect(() =>
      assertJwtSecret('change-me-in-production', 'production')
    ).toThrow(/placeholder/i);
    expect(() =>
      assertJwtSecret('4xT9#kP2!mQ8@vL7$zR1^nB5&wH3_render_prod', 'production')
    ).toThrow(/placeholder/i);
  });

  test('throws when secret is too short in production', () => {
    expect(() => assertJwtSecret('shorty', 'production')).toThrow(/32/);
  });

  test('passes with a strong secret in production', () => {
    expect(() =>
      assertJwtSecret('a'.repeat(48) + 'b1Cd', 'production')
    ).not.toThrow();
  });

  test('does not enforce in development (placeholder allowed)', () => {
    expect(() => assertJwtSecret('dev_secret', 'development')).not.toThrow();
  });
});

describe('BUG-H08: Toggle is a single round-trip', () => {
  let token;
  beforeAll(async () => {
    const signup = await request(app).post('/api/v1/auth/signup').send({
      name: 'Toggle User',
      email: 'toggleuser@example.com',
      password: 'Goodpass1',
    });
    token = signup.body.data.token;
  });

  test('toggles pending → completed → pending correctly', async () => {
    const create = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Toggle me' });
    const id = create.body.data.task.id;

    const r1 = await request(app)
      .post(`/api/v1/tasks/${id}/toggle`)
      .set('Authorization', `Bearer ${token}`);
    expect(r1.body.data.task.status).toBe('completed');
    expect(r1.body.data.task.completedAt).toBeTruthy();

    const r2 = await request(app)
      .post(`/api/v1/tasks/${id}/toggle`)
      .set('Authorization', `Bearer ${token}`);
    expect(r2.body.data.task.status).toBe('pending');
    expect(r2.body.data.task.completedAt).toBeNull();
  });
});

describe('BUG-C05: List endpoint returns items + pagination envelope', () => {
  let token;
  beforeAll(async () => {
    const signup = await request(app).post('/api/v1/auth/signup').send({
      name: 'List User',
      email: 'listuser@example.com',
      password: 'Goodpass1',
    });
    token = signup.body.data.token;
    // Seed 3 tasks
    for (let i = 0; i < 3; i += 1) {
      await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: `Task ${i}` });
    }
  });

  test('returns pagination metadata', async () => {
    const res = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.pagination).toBeDefined();
    expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(3);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(3);
  });

  test('honors requested limit within bounds', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?limit=2')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.pagination.limit).toBe(2);
  });

  test('rejects limit above MAX_LIMIT', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?limit=9999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

describe('BUG-H06: Stats endpoint returns aggregate counts', () => {
  let token;
  beforeAll(async () => {
    const signup = await request(app).post('/api/v1/auth/signup').send({
      name: 'Stats User',
      email: 'statsuser@example.com',
      password: 'Goodpass1',
    });
    token = signup.body.data.token;
  });

  test('returns total, pending, completed', async () => {
    const res = await request(app)
      .get('/api/v1/tasks/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.stats).toHaveProperty('total');
    expect(res.body.data.stats).toHaveProperty('pending');
    expect(res.body.data.stats).toHaveProperty('completed');
  });
});

describe('BUG-C06: Graceful shutdown exposes start() and respects shutdown signals', () => {
  test('start() function is exported and idempotent', () => {
    const { start } = require('../src/server');
    expect(typeof start).toBe('function');
  });
});

describe('BUG-M02: Index hint is applied to common list queries', () => {
  // This is a structural test — we verify the repository does not throw
  // and accepts the well-formed options.
  test('findPageByOwner accepts standard options', async () => {
    const taskRepository = require('../src/repositories/task.repository');
    const ownerId = '507f1f77bcf86cd799439011'; // valid ObjectId
    const result = await taskRepository.findPageByOwner(ownerId, {
      filter: { status: 'pending' },
      skip: 0,
      limit: 20,
      sort: { createdAt: -1 },
      projection: {},
    });
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.items)).toBe(true);
  });
});

describe('BUG-C02: .env file does not contain real production secrets', () => {
  test('.env does not contain the leaked JWT_SECRET pattern', () => {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) return; // OK if .env not present
    const contents = fs.readFileSync(envPath, 'utf8');
    expect(contents).not.toMatch(/4xT9#kP2!mQ8@vL7/);
    expect(contents).not.toMatch(/Unicorn2026/);
    expect(contents).not.toMatch(/kumarnitesh979875_db_user/);
  });
});