# Swag Pet

Swag Pet is an open-source desktop pet project.

## Repository Layout

```text
swag-pet/
  frontend/  Electron + React + TypeScript desktop pet client
  backend/   Reserved for the future Java Spring Boot + Spring AI service
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Useful checks:

```bash
cd frontend
npm run typecheck
npm run test
npm run build
```

## Backend

The backend is intentionally empty for V1. It is reserved for the future Spring Boot service that will connect Spring AI to DeepSeek and expose pet chat, state, action, and event APIs.
