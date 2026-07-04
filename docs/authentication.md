# Authentication API

JWT-based authentication with HttpOnly cookies, refresh token rotation, and bcrypt password hashing.

## Endpoints

| Method | Endpoint                | Auth | Description                    |
| ------ | ----------------------- | ---- | ------------------------------ |
| POST   | `/api/v1/auth/register` | No   | Register new user              |
| POST   | `/api/v1/auth/login`    | No   | Login and set cookies          |
| POST   | `/api/v1/auth/refresh`  | No*  | Rotate tokens via cookie       |
| POST   | `/api/v1/auth/logout`   | No*  | Revoke refresh + clear cookies |
| GET    | `/api/v1/auth/me`       | Yes  | Get current user profile       |

\* Uses the `refresh_token` HttpOnly cookie.

## Cookies

| Cookie          | Path           | Lifetime | Purpose           |
| --------------- | -------------- | -------- | ----------------- |
| `access_token`  | `/`            | 15m      | API + socket auth |
| `refresh_token` | `/api/v1/auth` | 7d       | Token rotation    |

Both cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production.

## Register

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "...",
      "email": "...",
      "name": "...",
      "avatar": null,
      "createdAt": "..."
    }
  }
}
```

Set-Cookie headers include `access_token` and `refresh_token`.

## Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "email": "admin@example.com", "name": "Admin User", ... }
  }
}
```

## Refresh

```http
POST /api/v1/auth/refresh
Cookie: refresh_token=...
```

Issues a new access/refresh token pair and rotates the stored refresh token.

## Logout

```http
POST /api/v1/auth/logout
Cookie: refresh_token=...
```

## Get Profile (Protected)

```http
GET /api/v1/auth/me
Cookie: access_token=...
```

Clients may also send `Authorization: Bearer <access_token>` for API tooling.

## Architecture

```
Route → validateBody → Controller → Service → Repository → MongoDB
                         ↑              ↓
              authenticate middleware   RefreshToken collection
                         ↑
              HttpOnly cookies (access + refresh)
```

## Security

- Passwords hashed with **bcrypt** (12 salt rounds)
- Access JWT signed with `JWT_SECRET` (default 15m expiry)
- Refresh tokens are opaque, hashed (SHA-256) in MongoDB, rotated on refresh
- Input validated with **Zod** and sanitized with **sanitize-html**
- Generic error message on login failure (no email enumeration)
- Frontend sends requests with `credentials: include`

## Environment

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

## Test Credentials (from seed)

| Email              | Password    |
| ------------------ | ----------- |
| admin@example.com  | password123 |
| member@example.com | password123 |
