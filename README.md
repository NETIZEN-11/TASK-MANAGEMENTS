# Task Management App (Production-Level)

A full-stack personal task manager where users sign up, log in, and manage their own
pending / completed tasks. Built with **Express + MongoDB** on the backend and
**Vite + React + Tailwind** on the frontend.

This project is deliberately structured around classic system design patterns
so each layer has a clear responsibility and can be tested or swapped in isolation.

---

## System Design Patterns Used

| Pattern | Where | Why |
|---|---|---|
| **MVC** | `controllers/` + `models/` + `routes/` | Clean separation between HTTP transport, business shape, and routing. |
| **Repository** | `repositories/` | All Mongoose calls live behind an interface so services can be tested with fakes. |
| **Service Layer** | `services/` | Business rules (auth, task lifecycle) isolated from controllers. |
| **Singleton** | `config/database.js` | One shared Mongoose connection pool per process. |
| **Factory** | `factories/dto.factory.js`, `strategies/taskFilter.strategy.js` | Centralized object construction and strategy selection. |
| **Strategy** | `strategies/taskFilter.strategy.js` | `AllTasksStrategy`, `PendingTasksStrategy`, `CompletedTasksStrategy`, `SearchTasksStrategy` are interchangeable. |
| **Observer** | `observers/taskEventEmitter.js` | Services emit `task.created`, `task.completed`, etc.; logger and any future notifier subscribe. |
| **Middleware** | `middlewares/` | `authenticate`, `validate`, `notFoundHandler`, `errorHandler` form the pipeline. |
| **DTO** | `dtos/index.js` | Outbound payloads never include `password`, `_id`, `__v`, etc. |
| **Dependency Injection** (light) | `AuthService`, `TaskService` constructors | Accept repo via constructor so tests can pass fakes. |
| **Module / Provider (FE)** | `contexts/AuthContext.jsx`, `TaskContext.jsx` | Single source of truth; observers auto re-render consumers. |
| **Higher-Order Route** | `routes/ProtectedRoute.jsx` | Guards routes; redirects unauthenticated users. |

---

## Folder Structure

```
PROJECT-02/
├── backend/
│   ├── src/
│   │   ├── config/         # env loader + singleton DB
│   │   ├── constants/      # enums (status, priority, filter)
│   │   ├── models/         # Mongoose schemas
│   │   ├── repositories/   # data access
│   │   ├── services/       # business logic
│   │   ├── strategies/     # filter Strategy + Factory
│   │   ├── observers/      # event emitter
│   │   ├── factories/      # DTO factory
│   │   ├── dtos/           # DTO mappers
│   │   ├── middlewares/    # auth, validate, error
│   │   ├── validators/     # Joi schemas
│   │   ├── controllers/    # thin HTTP adapters
│   │   ├── routes/v1/      # versioned routes
│   │   ├── utils/          # ApiError, ApiResponse, asyncHandler, logger
│   │   ├── app.js          # Express app builder
│   │   └── server.js       # entry point
│   ├── tests/              # supertest integration tests
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/            # axios client (Singleton + interceptor Observer)
│   │   ├── contexts/       # Auth + Task providers
│   │   ├── components/     # auth, layout, tasks
│   │   ├── pages/          # login, signup, dashboard
│   │   ├── routes/         # ProtectedRoute HOC
│   │   ├── services/       # authService, taskService
│   │   ├── utils/          # small helpers
│   │   ├── constants/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Setup

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env`:

```
MONGO_URI=mongodb://127.0.0.1:27017/task_management
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_ORIGIN=http://localhost:5173
```

### 3. Run MongoDB

Either install MongoDB locally or:

```bash
docker compose up mongo -d
```

### 4. Seed demo data (optional)

```bash
cd backend && npm run seed
# creates demo@example.com / password123
```

### 5. Start the API + frontend

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Visit http://localhost:5173

---

## API (v1)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/signup` | Create account, returns JWT |
| POST | `/api/v1/auth/login` | Login, returns JWT |
| GET | `/api/v1/auth/me` | Current user (auth) |
| GET | `/api/v1/tasks?filter=all|pending|completed|search&q=&page=&limit=` | List my tasks |
| GET | `/api/v1/tasks/stats` | Counts |
| POST | `/api/v1/tasks` | Create |
| GET | `/api/v1/tasks/:id` | Get one (scoped to me) |
| PATCH | `/api/v1/tasks/:id` | Update |
| POST | `/api/v1/tasks/:id/toggle` | Flip pending ↔ completed |
| DELETE | `/api/v1/tasks/:id` | Delete |

Every `/tasks` request requires `Authorization: Bearer <token>`. The server enforces
owner-scoping in every query — a user can **never** see another user's tasks (verified
by the `tests/api.test.js` integration test).

---

## Frontend State Management

- **AuthContext** — holds `user` + `token`, persists to `localStorage`, exposes
  `login` / `signup` / `logout`. Any component that calls `useAuth()` re-renders
  when these values change — that is the Observer pattern.
- **TaskContext** — single source of truth for tasks, stats, filter, search.
  Exposes `createTask`, `updateTask`, `toggleComplete`, `deleteTask`. Derived
  `visibleTasks` is computed with `useMemo` — the Strategy idea again, applied
  on the client.
- **ProtectedRoute** — Higher-Order component that gates `/` on auth state.

---

## Tests

```bash
cd backend && npm test
```

Covers: signup / duplicate, login / bad credentials, unauthenticated access,
CRUD lifecycle, owner isolation.

---

## Production

`docker compose up --build` brings up MongoDB, the API, and (with the optional
nginx frontend image) the UI behind a single network. See `docker-compose.yml`.

---

## Outcome

This codebase demonstrates hands-on with:
- Protected routes (JWT bearer)
- User-based data scoping (repository + middleware)
- Centralized state management on the frontend (Contexts)
- Clean separation of concerns via Repository, Service, DTO, Strategy, Factory, and Observer patterns.