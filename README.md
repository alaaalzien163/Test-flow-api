# TaskFlow API

A clean, modular, production-oriented **monolithic backend** built with
NestJS, PostgreSQL and Prisma. TaskFlow manages users, projects, tasks and
comments, and is intentionally kept simple so it can later be used to learn
DevOps (Docker, CI/CD, orchestration) on top of a solid application.

- REST API with a consistent `/api/v1` prefix
- JWT authentication with Argon2 password hashing
- Role-based access control: `ADMIN`, `MANAGER`, `MEMBER`
- Input validation with DTOs + `class-validator`
- Consistent error responses and structured request logging
- Swagger / OpenAPI documentation at `/docs`
- Health check at `/health`
- Unit tests (Jest) and end-to-end tests (Jest + Supertest)

---

## 1. Project overview

The API is composed of independent NestJS feature modules:

```
src/
  auth/       Authentication (register, login, current user, JWT strategy)
  users/      User management (ADMIN only)
  projects/   Project CRUD and project access rules
  tasks/      Task CRUD with filtering and pagination
  comments/   Comments on tasks
  health/     Liveness + database readiness check
  common/     Guards, filters, interceptors, decorators, DTOs, utils
  config/     Environment variable validation
  prisma/     PrismaService + global PrismaModule
```

Design principles: thin controllers, business logic in services, database
access centralized through `PrismaService`, dependency injection everywhere,
and no unnecessary abstractions.

## 2. Requirements

- Node.js 20+ (developed and verified on Node 22)
- npm 10+
- PostgreSQL 14+ (developed and verified on PostgreSQL 18)
- A running local PostgreSQL server

## 3. Installation

```bash
cd taskflow-api
npm install
```

## 4. PostgreSQL setup

Create a dedicated development role and database (run as a PostgreSQL
superuser):

```sql
CREATE ROLE taskflow LOGIN PASSWORD 'taskflow' CREATEDB;
CREATE DATABASE taskflow OWNER taskflow;
```

`CREATEDB` lets Prisma create the temporary shadow database used by
`prisma migrate dev`.

Connection string used by the app:

```
postgresql://taskflow:taskflow@localhost:5432/taskflow?schema=public
```

## 5. Environment variables

Copy the example file and adjust it:

```bash
cp .env.example .env      # Windows: copy .env.example .env
```

| Variable         | Required | Default       | Description                              |
| ---------------- | -------- | ------------- | ---------------------------------------- |
| `NODE_ENV`       | no       | `development` | `development` \| `test` \| `production`  |
| `PORT`           | no       | `3000`        | HTTP port                                |
| `DATABASE_URL`   | yes      | –             | PostgreSQL connection string             |
| `JWT_SECRET`     | yes      | –             | JWT signing secret (min 16 chars)        |
| `JWT_EXPIRES_IN` | no       | `1h`          | Access token lifetime                    |
| `CORS_ORIGIN`    | no       | `*`           | Allowed origin(s), comma separated       |
| `THROTTLE_TTL`   | no       | `60000`       | Rate-limit window in milliseconds        |
| `THROTTLE_LIMIT` | no       | `100`         | Max requests per window per IP           |

Environment variables are validated at startup; the app refuses to boot with
an invalid or missing configuration. **Never commit a real `.env` file.**

## 6. Database migration

```bash
npm run prisma:generate     # generate Prisma Client
npm run prisma:migrate      # create/apply migrations in development
# production-style (no prompts):
npm run prisma:migrate:deploy
```

## 7. Database seed

```bash
npm run db:seed
```

The seed is idempotent and creates:

| Role    | Email                  | Password     |
| ------- | ---------------------- | ------------ |
| ADMIN   | `admin@taskflow.dev`   | `Admin123!`  |
| MANAGER | `manager@taskflow.dev` | `Manager123!`|
| MEMBER  | `member@taskflow.dev`  | `Member123!` |

It also creates a sample project ("TaskFlow Demo Project"), three tasks and a
few comments. **These credentials are for local development only.**

## 8. Running locally

```bash
npm run start:dev      # watch mode
npm run start          # start without watch
npm run build          # production build to dist/
npm run start:prod     # run the compiled build
```

The API is then available at `http://localhost:3000/api/v1`.

## 9. Running tests

```bash
npm test               # unit tests (Jest)
npm run test:e2e       # end-to-end tests (Jest + Supertest)
npm run test:cov       # unit tests with coverage
```

E2E tests require a running database and use `DATABASE_URL`. They create
uniquely named users and clean them up afterwards.

## 10. Swagger documentation

Interactive API docs are served at:

```
http://localhost:3000/docs
```

The OpenAPI JSON is available at `/docs-json`. Use the **Authorize** button
with a JWT access token obtained from `/api/v1/auth/login`.

## 11. API structure

Base path: `/api/v1` (the health check is unprefixed at `/health`).

### Auth

| Method | Path                  | Access | Description                    |
| ------ | --------------------- | ------ | ------------------------------ |
| POST   | `/auth/register`      | Public | Register a new account         |
| POST   | `/auth/login`         | Public | Login and get a JWT            |
| GET    | `/auth/me`            | Auth   | Current authenticated user     |

### Users (ADMIN only)

| Method | Path           | Access | Description            |
| ------ | -------------- | ------ | ---------------------- |
| POST   | `/users`       | ADMIN  | Create a user          |
| GET    | `/users`       | ADMIN  | List users (paginated) |
| GET    | `/users/:id`   | ADMIN  | Get a user             |
| PATCH  | `/users/:id`   | ADMIN  | Update a user          |
| DELETE | `/users/:id`   | ADMIN  | Delete a user          |

### Projects

| Method | Path             | Access          | Description                          |
| ------ | ---------------- | --------------- | ------------------------------------ |
| POST   | `/projects`      | ADMIN, MANAGER  | Create a project                     |
| GET    | `/projects`      | Auth            | List visible projects (paginated)    |
| GET    | `/projects/:id`  | Auth            | Get a project                        |
| PATCH  | `/projects/:id`  | Owner/ADMIN     | Update a project                     |
| DELETE | `/projects/:id`  | Owner/ADMIN     | Delete a project                     |

### Tasks

| Method | Path           | Access          | Description                                       |
| ------ | -------------- | --------------- | ------------------------------------------------- |
| POST   | `/tasks`       | ADMIN, MANAGER  | Create a task in a managed project                |
| GET    | `/tasks`       | Auth            | List tasks (`projectId`, `assigneeId`, `status`, `priority`, `search`, `page`, `limit`) |
| GET    | `/tasks/:id`   | Auth            | Get a task                                        |
| PATCH  | `/tasks/:id`   | Manager / assigned MEMBER | Update a task (MEMBER: status only)     |
| DELETE | `/tasks/:id`   | ADMIN, MANAGER  | Delete a task                                     |

### Comments (nested under tasks)

| Method | Path                        | Access | Description        |
| ------ | --------------------------- | ------ | ------------------ |
| POST   | `/tasks/:taskId/comments`   | Auth   | Add a comment      |
| GET    | `/tasks/:taskId/comments`   | Auth   | List comments      |

### Health

| Method | Path      | Access | Description                              |
| ------ | --------- | ------ | ---------------------------------------- |
| GET    | `/health` | Public | API liveness + database readiness (503 if DB is down) |

### Authorization summary

- **ADMIN** – full access to all resources.
- **MANAGER** – full control of projects they own and their tasks.
- **MEMBER** – can view projects they own or are assigned tasks in; can update
  the status of tasks assigned to them and add comments.

## 12. Development notes

- **Framework versions:** NestJS 11 (CommonJS) with Jest. Prisma ORM 6 is used
  deliberately: Prisma 7 is ESM-only and requires driver adapters, which would
  complicate the Jest/CommonJS setup for no benefit in this project.
- **Password storage:** passwords are hashed with Argon2 (`argon2id`). Hashes
  are never returned by the API.
- **Error format:** every error returns
  `{ statusCode, message, error, path, method, timestamp }`. Stack traces are
  never sent to clients.
- **Logging:** one structured log line per request (method, path, status,
  duration). Request bodies, passwords, tokens and secrets are never logged.
- **Security basics:** Helmet security headers, configurable CORS, global
  validation pipe (`whitelist` + `forbidNonWhitelisted`), and per-IP rate
  limiting via `@nestjs/throttler`.
- **Env validation:** implemented with `class-validator` (no extra dependency).
- **Migrations:** SQL migration history lives in `prisma/migrations/`.
- **Containerization:** a production `Dockerfile` and a `docker-compose.yml`
  (API + PostgreSQL) are included. Kubernetes, cloud infrastructure, Redis,
  message brokers and CI/CD are intentionally **not** added yet.

### Useful commands

| Command                        | Purpose                          |
| ------------------------------ | -------------------------------- |
| `npm run start:dev`            | Run in watch mode                |
| `npm run build`                | Production build                 |
| `npm run typecheck`            | TypeScript type check            |
| `npm run lint`                 | ESLint (+ autofix)               |
| `npm test`                     | Unit tests                       |
| `npm run test:e2e`             | E2E tests                        |
| `npm run prisma:generate`      | Generate Prisma Client           |
| `npm run prisma:migrate`       | Create/apply a dev migration     |
| `npm run prisma:migrate:deploy`| Apply migrations (production)    |
| `npm run prisma:studio`        | Browse the database              |
| `npm run db:seed`              | Seed development data            |

## 13. Docker Compose (API + PostgreSQL)

Run the whole stack (NestJS API + PostgreSQL) locally with Docker Compose.

### Architecture

```
Developer
   │  http://localhost:3000
   ▼
Docker Compose (project: taskflow)
├── api                    built from ./Dockerfile (production target)
│    └── NestJS            container port 3000 -> host port 3000
│
├── migrate                one-off job, built from ./Dockerfile (builder target)
│    └── prisma migrate deploy (runs, then exits 0)
│
└── postgres               image postgres:18-alpine
     └── PostgreSQL        internal only: postgres:5432 (NOT published to host)
         └── volume: taskflow-postgres-data

All services share the bridge network: taskflow-network
```

### Prerequisites

- Docker Desktop (with Compose v2) running.
- The existing `Dockerfile` (already in the repo).
- Port **3000** free on the host.
- The host's own PostgreSQL on `localhost:5432` is untouched and unused here.

### Environment variables

Docker Compose loads variables from **`.env.docker`** (via `env_file:`), which is
**git-ignored** and is **not** copied into the image. Create it from the example:

```bash
copy .env.docker.example .env.docker     # Windows
cp    .env.docker.example .env.docker     # macOS/Linux
```

| Variable            | Example                                                          | Used by            |
| ------------------- | ---------------------------------------------------------------- | ------------------ |
| `POSTGRES_DB`       | `taskflow`                                                       | postgres           |
| `POSTGRES_USER`     | `taskflow`                                                       | postgres           |
| `POSTGRES_PASSWORD` | `taskflow_dev_password`                                          | postgres           |
| `DATABASE_URL`      | `postgresql://taskflow:<password>@postgres:5432/taskflow?schema=public` | api, migrate |
| `NODE_ENV`          | `production`                                                     | api                |
| `PORT`              | `3000`                                                           | api                |
| `JWT_SECRET`        | a long random string (>= 16 chars)                               | api                |
| `JWT_EXPIRES_IN`    | `1h`                                                             | api                |
| `CORS_ORIGIN`       | `*`                                                              | api                |

Keep `POSTGRES_PASSWORD` and the password inside `DATABASE_URL` identical.
Never commit real secrets; `.env` and `.env.docker` are git-ignored.

### How Docker networking works (why `localhost` is wrong)

Each container has its **own** network namespace and its **own** `localhost`.
Inside the `api` container, `localhost:5432` points at the API container itself
(nothing is listening there), **not** at PostgreSQL and **not** at your Windows
host. Docker Compose runs an internal DNS server on the `taskflow-network`, so
containers reach each other by their **service name**:

- The API connects to `postgres:5432` (the Compose service name).
- From your **host** machine you reach the API at `http://localhost:3000`
  because that port is published.

That is why `DATABASE_URL` uses host **`postgres`**, e.g.
`postgresql://taskflow:<password>@postgres:5432/taskflow?schema=public`.

### How PostgreSQL persistence works

- The named volume **`taskflow-postgres-data`** stores all database files.
- It is mounted at **`/var/lib/postgresql`** — PostgreSQL 18+ stores data in a
  major-version subdirectory, so this is the correct mount point (not
  `/var/lib/postgresql/data`, which was the pre-18 convention).
- `docker compose down` removes containers and the network, but **keeps the
  volume**, so your data survives.
- `docker compose up -d` starts a fresh container that reuses the same volume.

### How to start

```bash
# Validate the resolved Compose file
docker compose config

# Build the images
docker compose build

# Start in the foreground (Ctrl+C to stop)
docker compose up --build

# Start in the background (recommended)
docker compose up -d --build
```

On startup Compose: starts `postgres` -> waits for its healthcheck ->
runs `migrate` to completion -> starts `api`.

### How to stop

```bash
docker compose down          # stop and remove containers + network (keeps the volume)
```

### How to run migrations

Migrations are applied automatically by the **`migrate`** service on every
`up`, using `prisma migrate deploy` (never `db push`, never a reset). The
service reuses the Dockerfile's **builder** stage because the lean production
image intentionally has no dev dependencies (no Prisma CLI).

```bash
# Runs automatically during `docker compose up`; to run it manually:
docker compose run --rm migrate npx prisma migrate deploy
```

### How to seed (manual, not automatic)

The seed is **not** run automatically on startup. Run it once, on demand:

```bash
docker compose run --rm migrate npx prisma db seed
```

This creates the development accounts documented in the seed output
(`admin@taskflow.dev` / `Admin123!`, `manager@taskflow.dev` / `Manager123!`,
`member@taskflow.dev` / `Member123!`). Never hard-code these anywhere else.

### How to view logs

```bash
docker compose logs                 # all services
docker compose logs api             # API only
docker compose logs postgres        # PostgreSQL only
docker compose logs -f api          # follow the API logs
docker compose ps                   # service status (incl. health)
```

### Endpoints

| What     | URL                                     |
| -------- | --------------------------------------- |
| API base | `http://localhost:3000/api/v1`          |
| Swagger  | `http://localhost:3000/docs`            |
| Health   | `http://localhost:3000/health`          |

`GET /health` returns HTTP 200 with `{"status":"ok","info":{"database":{"status":"up"}}}`.

### Rebuild the API image

```bash
docker compose build api
# or force a clean rebuild:
docker compose build --no-cache api
# then recreate the container:
docker compose up -d api
```

### Inspect the volume

```bash
docker volume ls
docker volume inspect taskflow-postgres-data
```

### Reset the development database (safely)

To wipe **only** the Docker PostgreSQL data (this is destructive to Docker data):

```bash
docker compose down
docker volume rm taskflow-postgres-data
docker compose up -d            # migrate re-runs, creating a fresh schema
docker compose run --rm migrate npx prisma db seed   # optional: re-seed
```

> **WARNING:** `docker compose down -v` **deletes the `taskflow-postgres-data`
> volume and all data in it.** Do not run it during normal development.

### Troubleshooting

- **`postgres` keeps restarting / "unused mount/volume"** — the volume must be
  mounted at `/var/lib/postgresql` for PostgreSQL 18+. This repo does that.
- **`dependency failed to start: container taskflow-postgres is unhealthy`** —
  check `docker compose logs postgres`; the healthcheck uses `pg_isready` with
  `$POSTGRES_USER` and `$POSTGRES_DB`, so verify `.env.docker`.
- **API can't reach the database** — confirm `DATABASE_URL` host is `postgres`
  (not `localhost`) and that `migrate` exited 0 (`docker compose ps -a`).
- **`localhost:3000` times out** — try `http://127.0.0.1:3000`. Docker Desktop
  can take a few seconds to publish the port after startup; confirm with
  `docker compose ps` that `api` is `healthy`.
- **Port 3000 already in use** — stop the process using it, or change the host
  side of the mapping (`"3001:3000"`) in `docker-compose.yml`.
- **DNS/registry pull errors** — environment/network issue; retry the pull.

### Required Docker commands (reference)

```bash
docker compose config
docker compose build
docker compose up --build
docker compose up -d --build
docker compose ps
docker compose logs
docker compose logs api
docker compose logs postgres
docker compose down
```
