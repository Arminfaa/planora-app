# Planora

Planora is a production-oriented, full-stack project management platform with Kanban boards, Gantt planning, real-time collaboration, team workflows, and fine-grained access control. Built as a monorepo with a layered Express API and a feature-based Next.js frontend.

**Repository:** [github.com/Arminfaa/planora-app](https://github.com/Arminfaa/planora-app)

---

## Highlights

- **Kanban boards** — columns, drag-and-drop cards, per-column search & assignee filter, board backgrounds, and real-time sync
- **Gantt timeline** — project-wide schedule view, drag-to-reschedule, task dependencies, and unscheduled tasks panel
- **Rich task management** — priorities, due/completion dates, weighted checklists, labels, comments, attachments, and progress tracking
- **All-tasks hub** — project- or board-scoped list with advanced filters, bulk operations, Excel import/export, and formatted work-report text
- **Team & analytics** — invites, custom roles, group chat, person completion charts, and project progress overview
- **Working calendar** — non-working weekends, holidays, and leave days for delivery analytics
- **Real-time updates** — Socket.io rooms for live board and project events across connected clients
- **Notifications** — in-app feed with preferences and optional Web Push (VAPID)
- **Bilingual UI** — English & Persian (FA), RTL layout, Jalali/Gregorian date pickers
- **Custom RBAC** — default Owner / Admin / Member roles plus per-project custom roles with 37 granular permissions
- **Secure auth** — JWT in HttpOnly cookies, refresh-token rotation, bcrypt hashing, rate limiting, and password reset via Resend
- **Polished UX** — content-matched loading skeletons, virtualized long lists, and mobile-friendly form controls
- **Cloud-ready storage** — local uploads in development, Cloudinary integration for production

---

## Tech Stack

| Layer               | Technologies                                                                                                                                                                                                                                                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**        | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [Ant Design 6](https://ant.design/), [TanStack Query](https://tanstack.com/query) & [Virtual](https://tanstack.com/virtual), [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/), [@dnd-kit](https://dndkit.com/), [Recharts](https://recharts.org/), [Socket.io Client](https://socket.io/), [xlsx](https://www.npmjs.com/package/xlsx) |
| **Backend**         | [Node.js](https://nodejs.org/) 20+, [Express](https://expressjs.com/), [TypeScript](https://www.typescriptlang.org/), [Prisma](https://www.prisma.io/) + [MongoDB](https://www.mongodb.com/), [Socket.io](https://socket.io/), [Zod](https://zod.dev/), [Winston](https://github.com/winstonjs/winston), [web-push](https://www.npmjs.com/package/web-push) |
| **Auth & Security** | JWT (access + refresh), HttpOnly cookies, bcrypt, Helmet, express-rate-limit, input sanitization                                                                                                                                                                                                                                                               |
| **Storage**         | Local filesystem (dev) · [Cloudinary](https://cloudinary.com/) (production)                                                                                                                                                                                                                                                                                    |
| **Email**           | [Resend](https://resend.com/) (password reset)                                                                                                                                                                                                                                                                                                                 |
| **Tooling**         | npm workspaces, ESLint, Prettier, Husky, lint-staged, Commitlint                                                                                                                                                                                                                                                                                               |

---

## Architecture

```mermaid
flowchart LR
  subgraph Client
    UI[Next.js App]
    SocketC[Socket.io Client]
  end

  subgraph Server
    API[Express REST API]
    SocketS[Socket.io Server]
    Svc[Services]
    Repo[Repositories]
  end

  DB[(MongoDB)]

  UI -->|"/api/v1/* rewrites"| API
  SocketC -->|"/socket.io"| SocketS
  API --> Svc --> Repo --> DB
  SocketS --> Svc
```

**Backend layers:** `Route → Middleware → Controller → Service → Repository → MongoDB`

**Frontend structure:** feature modules (`auth`, `dashboard`, `board`, `projects`, `tasks`, `gantt`, `notifications`, `search`, `permissions`, …) plus shared UI and service layers.

---

## Features

### Projects & Teams

- Create and manage multiple projects with slug-based URLs
- Project hub with overview, all-tasks, Gantt, group chat, team, and settings
- Invite members by email with role assignment and pending-invite management
- Team page with member roles, person completion charts (bar/line), and delivery date ranges
- Project progress overview (by project or by board)
- Working calendar: weekends, holidays, and member leave for analytics

### Kanban Boards

- Multiple boards per project with custom backgrounds (image or gradient)
- Configurable columns (create, edit, reorder, delete)
- Task cards with drag-and-drop between columns and within a column
- Per-column text search (title, description, checklist) and assignee filter modal
- Real-time board events when tasks, columns, or boards change

### Tasks

- Title, description, slug, priority (`LOW` → `URGENT`), start/due dates, and completion state
- Multiple assignees per task with color-coded avatars
- Weighted checklists with per-item `completedAt` timestamps
- Color-coded project labels
- Threaded comments and file/image attachments (with preview modal)
- Dedicated all-tasks view (project-wide or per-board) with virtualized list
- Bulk operations: move, assign, dates, labels, checklist items, delete, export
- Excel import/export and copy-ready work-report text generation

### Gantt

- Timeline view grouped by board with day/week/month zoom
- Drag bars to update task schedules
- Task dependency links (create, list, delete)
- Unscheduled tasks panel for quick scheduling

### Project Group

- Team chat with user messages and system activity events
- File uploads in group messages
- Real-time project-level socket events

### Search & Filters

- Global search across accessible projects and tasks
- Board/all-tasks filters: priority, assignee, column, due date, completion status, completion date range
- Completion filters include checklist items completed in the selected period (not only fully completed tasks)
- Kanban column-level search and assignee filter

### Notifications

- In-app notification center with unread state
- Per-category preferences (task changes, group messages, push)
- Web Push support when VAPID keys are configured (HTTPS required in production)

### Permissions

Built-in roles (`OWNER`, `ADMIN`, `MEMBER`) with sensible defaults, or switch a project to **custom mode** and define roles with a permission builder UI. Permissions cover project, board, column, task, team, label, comment, attachment, group, and role management.

### Localization

- English and Persian (فارسی) with runtime locale switching
- RTL layout for Persian (Vazirmatn font)
- Jalali calendar support via `antd-jalali-v5` for date inputs and charts

---

## Project Structure

```
planora-app/
├── backend/                 # Express REST API + Socket.io
│   ├── prisma/              # Schema, seed data, replica-set init
│   ├── mongo/               # Local MongoDB replica-set config
│   ├── scripts/             # Mongo startup & Atlas migration helpers
│   ├── src/
│   │   ├── config/          # Environment, database, app config
│   │   ├── controllers/     # HTTP request/response handlers
│   │   ├── middlewares/     # Auth, validation, rate-limit, upload, errors
│   │   ├── permissions/     # Permission registry & default role maps
│   │   ├── repositories/    # Data access layer
│   │   ├── routes/v1/       # Versioned API routes
│   │   ├── services/        # Business logic
│   │   ├── socket/          # Real-time handlers & event emitters
│   │   ├── validators/      # Zod request schemas
│   │   └── utils/           # ApiResponse, logger, helpers
│   └── tests/               # API smoke tests
│
├── frontend/                # Next.js App Router
│   └── src/
│       ├── app/             # Routes, layouts, metadata, loading skeletons
│       ├── features/        # Feature-based modules
│       ├── i18n/            # EN/FA messages and locale provider
│       ├── shared/          # Reusable components, hooks, UI primitives
│       └── lib/             # API client, socket, Ant Design setup
│
├── docs/                    # Extended documentation
└── docker-compose.yml       # Optional MongoDB 7 container (port 27017)
```

---

## Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10 (workspaces)
- **MongoDB** with a replica set (required by Prisma for MongoDB)

> The dev script starts a dedicated local MongoDB instance on port **27018** with `replSetName: rs0`. This is separate from a system MongoDB on the default port 27017.

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/Arminfaa/planora-app.git
cd planora-app
npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

**Backend** (`backend/.env`) — key variables:

| Variable         | Description                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`   | MongoDB connection string (default: `mongodb://127.0.0.1:27018/project_management?replicaSet=rs0`) |
| `JWT_SECRET`     | Secret for signing JWTs — change in production                                                     |
| `CORS_ORIGIN`    | Allowed frontend origin (default: `http://localhost:3000`)                                         |
| `API_PUBLIC_URL` | Public URL for serving uploaded files                                                              |
| `CLOUDINARY_*`   | Cloudinary credentials (production attachments)                                                    |
| `RESEND_API_KEY` | Resend API key for password-reset emails                                                           |
| `VAPID_*`        | Web Push keys (`npx web-push generate-vapid-keys`)                                                |

**Frontend** (`frontend/.env.local`) — key variables:

| Variable               | Description                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL`  | Browser API base (default: `/api/v1` via Next.js rewrite)          |
| `BACKEND_API_URL`      | Server-side proxy target (default: `http://localhost:5000/api/v1`) |
| `NEXT_PUBLIC_APP_NAME` | Display name in the UI (e.g. `Planora`)                            |

### 3. Initialize the database

```bash
# First-time setup: init replica set, push schema, seed demo data
npm run db:setup
```

Or step by step:

```bash
npm run db:init -w backend      # Initialize replica set (first time only)
npm run prisma:push -w backend  # Sync Prisma schema to MongoDB
npm run db:seed -w backend      # Insert rich demo data
```

After seeding, the CLI prints demo user credentials. Example owner account:

| Email                | Password       |
| -------------------- | -------------- |
| `arminfaa@gmail.com` | `password0041` |

The seed creates multiple projects, users, boards, columns, tasks, checklists, comments, labels, and group chat messages.

### 4. Run the app

```bash
# MongoDB + backend + frontend (recommended)
npm run dev
```

| Service       | URL                                 |
| ------------- | ----------------------------------- |
| Frontend      | http://localhost:3000               |
| Backend API   | http://localhost:5000/api/v1        |
| Health check  | http://localhost:5000/api/v1/health |
| Prisma Studio | `npm run prisma:studio`             |

Run services individually:

```bash
npm run dev:backend    # API on :5000 (starts MongoDB automatically)
npm run dev:frontend   # Next.js on :3000
```

### 5. Optional — Docker MongoDB

```bash
docker compose up -d
```

Update `DATABASE_URL` in `backend/.env` if you use the Docker instance on port 27017. Prisma still requires a replica set — run `npm run db:init -w backend` after pointing at your instance.

---

## API Overview

All endpoints are versioned under `/api/v1` and return a consistent envelope:

```json
// Success
{ "success": true, "message": "...", "data": {} }

// Error
{ "success": false, "message": "...", "errors": [] }
```

| Area                 | Endpoints                                                               |
| -------------------- | ----------------------------------------------------------------------- |
| **Auth**             | `POST /auth/register`, `/login`, `/refresh`, `/logout` · `GET /auth/me` |
| **Projects**         | CRUD, progress stats, working calendar, person completions              |
| **Boards & Columns** | Nested under projects and boards                                        |
| **Tasks**            | CRUD, move, bulk actions, checklist, labels, comments, attachments    |
| **Gantt**            | Project timeline, dependencies, schedule updates                        |
| **Team**             | Members, invites, role definitions                                      |
| **Search**           | `GET /search` with text and filter params                               |
| **Notifications**    | Feed, preferences, Web Push subscription                                |
| **Group**            | Project group messages and attachments                                  |
| **Health**           | `GET /health`                                                           |

Protected routes accept the `access_token` HttpOnly cookie (`credentials: include`) or `Authorization: Bearer <token>`.

See [docs/api.md](docs/api.md) and [docs/authentication.md](docs/authentication.md) for the full reference.

---

## Real-Time Events

Socket.io authenticates via JWT and uses room-based broadcasting:

| Room pattern          | Events          | Purpose                                 |
| --------------------- | --------------- | --------------------------------------- |
| `board:<boardId>`     | `board:event`   | Live Kanban updates (tasks, columns)    |
| `project:<projectId>` | `project:event` | Project-wide changes and group activity |

Clients join with `board:join` / `project:join` and leave with `board:leave` / `project:leave`.

---

## Scripts

| Command                 | Description                               |
| ----------------------- | ----------------------------------------- |
| `npm run dev`           | Start MongoDB, backend, and frontend      |
| `npm run build`         | Production build (backend + frontend)     |
| `npm run lint`          | ESLint across both workspaces             |
| `npm run test`          | API smoke tests (backend must be running) |
| `npm run db:setup`      | Init DB + push schema + seed              |
| `npm run prisma:studio` | Visual database browser                   |
| `npm run format`        | Prettier write                            |
| `npm run format:check`  | Prettier check                            |

---

## Testing

```bash
# Terminal 1 — start the backend (with seeded data)
npm run dev:backend

# Terminal 2 — smoke tests
npm run test:smoke
```

Smoke tests cover health, auth, projects, boards, tasks, search, and access control.

Full CI-style verification:

```bash
npm run lint
npm run build
npm run test:smoke
```

See [docs/testing.md](docs/testing.md) for the manual QA checklist.

---

## Production Notes

- Set `NODE_ENV=production` and a strong `JWT_SECRET`
- Configure `CLOUDINARY_*` for cloud file storage
- Configure `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL` for password reset
- Configure `VAPID_*` and `APP_PUBLIC_URL` for Web Push (HTTPS required)
- Cookies are `Secure` and `SameSite=Lax` in production
- The Next.js app proxies `/api/v1`, `/socket.io`, and `/uploads` to the backend — deploy both services with matching `BACKEND_API_URL`
- Atlas migration helpers: `npm run db:migrate-atlas -w backend`

---

## Documentation

| Document                                                       | Contents                           |
| -------------------------------------------------------------- | ---------------------------------- |
| [docs/api.md](docs/api.md)                                     | REST API reference                 |
| [docs/authentication.md](docs/authentication.md)               | Auth flow, cookies, token rotation |
| [docs/database.md](docs/database.md)                           | Schema, MongoDB setup, seed info   |
| [docs/backend-architecture.md](docs/backend-architecture.md)   | Backend layering & security        |
| [docs/frontend-architecture.md](docs/frontend-architecture.md) | Feature modules & patterns         |
| [docs/dependencies.md](docs/dependencies.md)                   | Package reference                  |
| [docs/testing.md](docs/testing.md)                             | Smoke tests & QA checklist         |

---

## Roadmap

| Area                                | Status |
| ----------------------------------- | ------ |
| Core platform (auth, projects, RBAC) | ✅     |
| Kanban boards & real-time sync      | ✅     |
| Tasks, checklists, comments, files  | ✅     |
| Search, filters & all-tasks view    | ✅     |
| Bulk ops, Excel import/export       | ✅     |
| Gantt timeline & dependencies       | ✅     |
| Team analytics & working calendar   | ✅     |
| Notifications & Web Push            | ✅     |
| Bilingual UI (EN/FA) & Jalali dates | ✅     |
| Content-matched loading skeletons   | ✅     |
| Smoke tests & QA                    | ✅     |

---

## License

This project is currently unlicensed. Add a `LICENSE` file before publishing or accepting contributions.
