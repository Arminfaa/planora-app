# Dependencies Reference

## Root

| Package | Purpose |
|---------|---------|
| `concurrently` | Run backend & frontend dev servers simultaneously |

## Backend

### Production

| Package | Purpose |
|---------|---------|
| `express` | HTTP server framework |
| `@prisma/client` | Database ORM client |
| `bcryptjs` | Password hashing |
| `cors` | Cross-origin resource sharing |
| `dotenv` | Environment variables |
| `express-rate-limit` | API rate limiting |
| `helmet` | Security HTTP headers |
| `jsonwebtoken` | JWT authentication |
| `morgan` | HTTP request logging |
| `multer` | File & image upload |
| `sanitize-html` | Input sanitization |
| `socket.io` | Real-time WebSocket (Step 11) |
| `winston` | Error & application logging |
| `zod` | Request validation schemas |

### Development

| Package | Purpose |
|---------|---------|
| `prisma` | Database schema & migrations CLI |
| `tsx` | TypeScript execution & hot reload |
| `typescript` | Type safety |

## Frontend

### Production

| Package | Purpose |
|---------|---------|
| `next` | React framework (SSR, SEO, routing) |
| `react` / `react-dom` | UI library |
| `react-hook-form` | Form state management |
| `@hookform/resolvers` | Zod integration for RHF |
| `zod` | Client-side validation |
| `axios` | HTTP client for API calls |
| `socket.io-client` | Real-time client (Step 11) |
| `clsx` / `tailwind-merge` | Conditional CSS class utilities |

### Development

| Package | Purpose |
|---------|---------|
| `tailwindcss` | Utility-first CSS |
| `postcss` / `autoprefixer` | CSS processing |
| `eslint` / `eslint-config-next` | Linting |
| `typescript` | Type safety |

## Added in Later Steps

| Step | Packages |
|------|----------|
| 3 | `eslint`, `prettier`, `husky`, `lint-staged` (quality tooling) |
| 10 | `@dnd-kit/core`, `@dnd-kit/sortable` (drag & drop) |
| 12-13 | `@tanstack/react-query`, `react-intersection-observer` (pagination, infinite scroll) |
