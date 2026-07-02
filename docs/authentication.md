# Authentication API

JWT-based authentication with bcrypt password hashing.

## Endpoints

| Method | Endpoint                | Auth | Description              |
| ------ | ----------------------- | ---- | ------------------------ |
| POST   | `/api/v1/auth/register` | No   | Register new user        |
| POST   | `/api/v1/auth/login`    | No   | Login and get JWT        |
| GET    | `/api/v1/auth/me`       | Yes  | Get current user profile |

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
    },
    "token": "eyJhbG..."
  }
}
```

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
    "user": { "id": "...", "email": "admin@example.com", "name": "Admin User", ... },
    "token": "eyJhbG..."
  }
}
```

## Get Profile (Protected)

```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

## Architecture

```
Route → validateBody → Controller → Service → Repository → MongoDB
                         ↑
              authenticate middleware (protected routes)
```

## Security

- Passwords hashed with **bcrypt** (12 salt rounds)
- JWT signed with `JWT_SECRET` from `.env`
- Input validated with **Zod** and sanitized with **sanitize-html**
- Generic error message on login failure (no email enumeration)

## Test Credentials (from seed)

| Email              | Password    |
| ------------------ | ----------- |
| admin@example.com  | password123 |
| member@example.com | password123 |
