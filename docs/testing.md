# Final Testing Guide

This document covers automated smoke tests and the manual QA checklist for the platform.

## Automated Smoke Tests

Run against a **live backend** with seeded data:

```bash
# Terminal 1 — MongoDB + API (if not already running)
npm run dev:backend

# Terminal 2 — smoke tests
npm run test:smoke
```

From the repo root you can also run:

```bash
npm run test
```

### What the smoke suite covers

| Area     | Checks                                                    |
| -------- | --------------------------------------------------------- |
| Health   | `GET /api/v1/health`, database connected                  |
| Auth     | Login, `/auth/me`, 401 without token, invalid credentials |
| Projects | List, create, update, delete                              |
| Boards   | List by project, get with columns & tasks                 |
| Tasks    | Create, move (PATCH columnId/position), update, delete    |
| Search   | Text search, priority filter, board-scoped search         |
| Access   | Member can list shared projects                           |

### Environment variables

| Variable             | Default                        |
| -------------------- | ------------------------------ |
| `API_URL`            | `http://localhost:5000/api/v1` |
| `SMOKE_ADMIN_EMAIL`  | `admin@example.com`            |
| `SMOKE_MEMBER_EMAIL` | `member@example.com`           |
| `SMOKE_PASSWORD`     | `password123`                  |

## Full CI-style verification

```bash
npm run lint
npm run build
npm run test:smoke
```

## Manual UI Checklist

Use two browsers (or one normal + one incognito) with different seed users for real-time tests.

### Authentication

- [ ] Register a new user
- [ ] Login with `admin@example.com` / `password123`
- [ ] Logout and login again
- [ ] Protected routes redirect to login when logged out

### Dashboard & Projects

- [ ] Dashboard loads project list
- [ ] Create a new project
- [ ] Open project detail page
- [ ] Boards list appears on project page

### Kanban Board

- [ ] Open **Main Board** from demo project
- [ ] Add a task to a column
- [ ] Click task card → modal opens
- [ ] Edit title, priority, description → save
- [ ] Delete a task from modal

### Drag & Drop

- [ ] Reorder task within same column
- [ ] Move task to another column
- [ ] Refresh page → position persists

### Real-time (two users)

- [ ] User A and User B open same board (green **Live** indicator)
- [ ] User A adds task → appears for User B without refresh
- [ ] User A edits task → User B sees update
- [ ] User A deletes task → removed for User B
- [ ] User A drags task → User B board updates

### Search (board)

- [ ] Type in board search → non-matching cards dim
- [ ] Counter shows `X of Y tasks`

### Filters (board)

- [ ] Filter by priority (e.g. High only)
- [ ] Filter by assignee / Unassigned
- [ ] Filter by due date (Overdue, Today, etc.)
- [ ] Combine search + filters
- [ ] Clear filters resets view

### Global Search (header)

- [ ] Search tasks by title from header
- [ ] Apply priority / due filters in dropdown
- [ ] Click result → navigates to board and opens task modal

## Seed credentials

| User   | Email                | Password      |
| ------ | -------------------- | ------------- |
| Admin  | `admin@example.com`  | `password123` |
| Member | `member@example.com` | `password123` |

## Troubleshooting

| Issue                          | Fix                                                      |
| ------------------------------ | -------------------------------------------------------- |
| Smoke tests connection refused | Start backend: `npm run dev:backend`                     |
| Database disconnected          | Start MongoDB replica set: `npm run db:start -w backend` |
| Empty project list             | Run seed: `npm run db:seed`                              |
| Real-time not syncing          | Use separate browsers; check **Live** indicator is green |
| Drag not persisting            | Check backend logs for `PATCH /api/v1/tasks`             |
