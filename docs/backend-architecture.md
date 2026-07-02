# Backend Architecture

## Layered Architecture

```
Request → Route → Controller → Service → Repository → Database
```

| Layer | Responsibility |
|-------|---------------|
| **Route** | Define endpoints, attach middleware. No business logic. |
| **Controller** | Parse request, call service, format response. |
| **Service** | Business logic, orchestration, validation rules. |
| **Repository** | Data access, queries, CRUD operations. |
| **Validator** | Zod schemas for request body/params/query. |
| **Middleware** | Auth, rate-limit, sanitization, error handling. |

## API Versioning

All routes are mounted under `/api/v1`.

## Standard Response Format

```typescript
// Success
interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

// Error
interface ApiErrorResponse {
  success: false;
  message: string;
  errors: string[];
}
```

## Security Checklist

- [ ] Helmet (HTTP headers)
- [ ] Rate limiting
- [ ] JWT authentication
- [ ] Input validation (Zod)
- [ ] Input sanitization
- [ ] Password hashing (bcrypt)
- [ ] Protected routes middleware

## File Upload

- Images → `src/uploads/images/`
- Files → `src/uploads/files/`
