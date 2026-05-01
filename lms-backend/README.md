# Lumen LMS Backend

## Active runtime

The frontend currently targets the Node/Express backend in `server.js`.

This backend is in-memory and meant for local development and demo flows.

## Run it

```bash
npm install
npm start
```

Server URL:

```text
http://localhost:8082
```

Health check:

```text
GET /api/health
```

## Demo users

```text
Admin:   admin@example.com / password123
Faculty: faculty@example.com / password123
Student: student@example.com / password123
```

## Included API areas

- `/api/auth`
- `/api/courses`
- `/api/assignments`
- `/api/submissions`
- `/api/quizzes`
- `/api/attendance`
- `/api/announcements`
- `/api/performance`
- `/api/admin`

## Notes

- Data resets when the server restarts.
- Multipart upload endpoints are mocked and stored as simple in-memory records.
- The Spring Boot source remains in this folder as a separate, non-default backend path.
