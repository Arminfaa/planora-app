# Database Schema

MongoDB database managed with **Prisma ORM**.

## Connection (MongoDB Compass)

```
mongodb://127.0.0.1:27018/project_management?replicaSet=rs0
```

> Prisma requires a **replica set**. This project runs a local MongoDB instance on port **27018** (separate from the default 27017).

## Quick Start

```bash
# 1. Start local MongoDB with replica set (from backend/mongo)
cd backend/mongo
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --config mongod-rs.cfg

# 2. Initialize replica set (first time only)
npm run db:init -w backend

# 3. Push schema
npm run prisma:push -w backend

# 4. Seed demo data
npm run db:seed -w backend
```

## Entity Relationship

```
User ──┬── owns ──> Project ──┬── has ──> Board ──> Column ──> Task
       │                      │
       ├── member of ─────────┘
       ├── assigned to ──> Task
       └── creates ──────> Task

Project ──> Label ──> TaskLabel ──> Task
Task ──> Comment, Attachment
```

## Models

| Model           | Collection      | Description                 |
| --------------- | --------------- | --------------------------- |
| `User`          | users           | Platform users              |
| `Project`       | projects        | Top-level project container |
| `ProjectMember` | project_members | User ↔ Project with role    |
| `Board`         | boards          | Kanban board                |
| `Column`        | columns         | Board columns               |
| `Task`          | tasks           | Task cards                  |
| `Label`         | labels          | Color-coded labels          |
| `TaskLabel`     | task_labels     | Task ↔ Label join           |
| `Comment`       | comments        | Task comments               |
| `Attachment`    | attachments     | File/image uploads          |

## Seed Credentials

| Email              | Password    |
| ------------------ | ----------- |
| admin@example.com  | password123 |
| member@example.com | password123 |

Seed includes: 1 project, 1 board, 3 columns, 4 tasks, 3 labels.

## Browse in Compass

1. Open **MongoDB Compass**
2. Connect to: `mongodb://127.0.0.1:27018/?replicaSet=rs0`
3. Select database: `project_management`

## Useful Commands

```bash
npm run db:init -w backend           # Init replica set
npm run prisma:push -w backend       # Sync schema
npm run db:seed -w backend           # Insert demo data
npm run prisma:studio -w backend     # Visual DB browser
npm run prisma:generate -w backend   # Regenerate client
```

## Why Port 27018?

The system MongoDB on port 27017 runs without replica set enabled. Prisma requires replica set for write operations. The project uses a dedicated instance on **27018** with `replSetName: rs0` configured in `backend/mongo/mongod-rs.cfg`.
