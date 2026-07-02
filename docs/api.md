# REST API Reference

All protected endpoints require `Authorization: Bearer <token>`.

## Projects

| Method | Endpoint               | Description                    |
| ------ | ---------------------- | ------------------------------ |
| GET    | `/api/v1/projects`     | List user projects (paginated) |
| POST   | `/api/v1/projects`     | Create project                 |
| GET    | `/api/v1/projects/:id` | Get project                    |
| PATCH  | `/api/v1/projects/:id` | Update project (admin)         |
| DELETE | `/api/v1/projects/:id` | Delete project (admin)         |

**Query params (list):** `page`, `limit`

## Boards

| Method | Endpoint                             | Description                    |
| ------ | ------------------------------------ | ------------------------------ |
| GET    | `/api/v1/projects/:projectId/boards` | List boards                    |
| POST   | `/api/v1/projects/:projectId/boards` | Create board                   |
| GET    | `/api/v1/boards/:id`                 | Get board with columns & tasks |
| PATCH  | `/api/v1/boards/:id`                 | Update board                   |
| DELETE | `/api/v1/boards/:id`                 | Delete board (admin)           |

## Columns

| Method | Endpoint                          | Description           |
| ------ | --------------------------------- | --------------------- |
| POST   | `/api/v1/boards/:boardId/columns` | Create column         |
| PATCH  | `/api/v1/columns/:id`             | Update column         |
| DELETE | `/api/v1/columns/:id`             | Delete column (admin) |

## Tasks

| Method | Endpoint                          | Description            |
| ------ | --------------------------------- | ---------------------- |
| GET    | `/api/v1/columns/:columnId/tasks` | List tasks (paginated) |
| POST   | `/api/v1/columns/:columnId/tasks` | Create task            |
| GET    | `/api/v1/tasks/:id`               | Get task               |
| PATCH  | `/api/v1/tasks/:id`               | Update / move task     |
| DELETE | `/api/v1/tasks/:id`               | Delete task            |

## Pagination Response

```json
{
  "success": true,
  "message": "Projects retrieved",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

## Access Control

- **Member**: can view and create/update tasks, boards, columns
- **Admin/Owner**: can delete projects, boards, columns

## Architecture

```
Route → authenticate → validate → Controller → Service → Repository → MongoDB
```
