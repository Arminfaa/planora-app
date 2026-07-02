# Frontend Architecture

## Feature-Based Structure

Each feature is a self-contained module:

```
features/<feature-name>/
├── components/    # UI components specific to this feature
├── hooks/         # Custom React hooks
├── services/      # API calls & data fetching
├── types/         # TypeScript interfaces & types
└── utils/         # Feature-specific utilities
```

## Features

| Feature | Description |
|---------|-------------|
| `auth` | Login, register, session management |
| `dashboard` | Overview, stats, recent activity |
| `board` | Kanban board with columns & cards |
| `projects` | Project CRUD & settings |
| `tasks` | Task management, assignments, labels |
| `search` | Global search & filters |

## Shared Layer

Code reused across features lives in `src/shared/`:

- `components/ui/` — Reusable UI primitives (Button, Input, Modal)
- `components/layout/` — Header, Sidebar, PageLayout
- `components/feedback/` — ErrorBoundary, Loading, Toast
- `hooks/` — useDebounce, usePagination, useInfiniteScroll
- `services/` — Base API client, interceptors
- `types/` — Global TypeScript types
- `utils/` — Formatters, constants

## App Router (`src/app/`)

Next.js App Router for routing, layouts, metadata (SEO), and code splitting.

## Performance Patterns

- **Lazy Loading** — `dynamic()` for heavy components
- **Code Splitting** — Route-based automatic splitting
- **Memoization** — `React.memo`, `useMemo`, `useCallback`
- **Suspense** — Loading boundaries
- **Error Boundary** — Graceful error handling
- **Image Optimization** — `next/image`
- **Infinite Scroll** — Virtualized lists for large datasets
- **Pagination** — Server-side paginated API consumption

## Form & Validation

- **React Hook Form** — Form state management
- **Zod** — Schema validation (shared with backend patterns)
