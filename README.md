# Project Management Platform

A full-stack project management platform with Kanban boards, real-time collaboration, and team workflows.

## Tech Stack

| Layer         | Technologies                                       |
| ------------- | -------------------------------------------------- |
| **Frontend**  | React, Next.js, React Hook Form, Zod, Tailwind CSS |
| **Backend**   | Node.js, Express, Prisma, PostgreSQL               |
| **Auth**      | JWT                                                |
| **Real-time** | Socket.io                                          |
| **Quality**   | ESLint, Prettier, Husky, Lint-staged               |

## Project Structure

```
project-management-platform/
├── backend/                    # Express REST API
│   ├── prisma/                 # Database schema & migrations
│   ├── src/
│   │   ├── config/             # Environment, database, app config
│   │   ├── controllers/        # Request/response handlers only
│   │   ├── middlewares/        # Auth, validation, rate-limit, error
│   │   ├── models/             # Prisma client extensions (if needed)
│   │   ├── repositories/       # Data access layer
│   │   ├── routes/v1/          # API route definitions (no logic)
│   │   ├── services/           # Business logic
│   │   ├── validators/         # Zod schemas for request validation
│   │   ├── utils/              # Helpers, ApiError, ApiResponse, logger
│   │   ├── types/              # Shared TypeScript types
│   │   ├── uploads/            # File & image storage
│   │   ├── app.ts              # Express app setup
│   │   └── server.ts           # Server entry point
│   ├── logs/                   # Error & access logs
│   └── tests/                  # Backend tests
│
├── frontend/                   # Next.js App Router
│   ├── public/                 # Static assets
│   └── src/
│       ├── app/                # Next.js routes, layouts, metadata
│       ├── features/           # Feature-based modules
│       │   ├── auth/
│       │   ├── dashboard/
│       │   ├── board/
│       │   ├── projects/
│       │   ├── tasks/
│       │   └── search/
│       ├── shared/             # Cross-feature shared code
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── types/
│       │   └── utils/
│       ├── lib/                # API client, global utilities
│       └── styles/             # Global styles
│
├── docs/                       # Project documentation
└── .husky/                     # Git hooks (step 13)
```

## API Response Standard

```json
// Success
{ "success": true, "message": "", "data": {} }

// Error
{ "success": false, "message": "", "errors": [] }
```

All endpoints are versioned under `/api/v1`.

## Development Roadmap

1. ✅ Folder Structure
2. ✅ Dependencies Installation
3. ✅ Project Configuration
4. ⏳ Database
5. ⏳ Authentication
6. ⏳ API
7. ⏳ Frontend
8. ⏳ Dashboard
9. ⏳ Board
10. ⏳ Drag & Drop
11. ⏳ Real Time
12. ⏳ Search
13. ⏳ Filter
14. ⏳ Final Testing

## Getting Started

```bash
# Install all dependencies (root + workspaces)
npm install

# Run both servers (after Step 3 configuration)
npm run dev

# Run individually
npm run dev:backend   # http://localhost:5000
npm run dev:frontend  # http://localhost:3000
```

See [docs/dependencies.md](docs/dependencies.md) for the full package reference.
