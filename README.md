# Atom (`espacios-me/a`)

Atom is now organized around one product spine:

**Sign in / SSO entry → Integrations control center → Messaging workspace**

This repo contains a single coherent full-stack path:
- `frontend/` React + Vite app (dark, mobile-first UI)
- `worker/` Cloudflare Worker API (session-backed auth, integrations state, messaging routes)

## Product status (truthful)

- Auth is **preview auth** with session cookies and SSO-style entry buttons.
- Integrations are **real app state in backend session storage**, but provider APIs are not yet fully wired.
- Messaging is **fully wired UI ↔ backend flow** with threads, messages, and assistant replies using connected integration context.
- Secondary pages (`panel`, `memory`, `friends`, `settings`) are intentionally minimal and non-competing.

## Local development

### Install
```bash
npm install
```

### Run frontend
```bash
npm run dev --workspace=frontend
```

### Run worker API
```bash
npm run dev --workspace=worker
```

If frontend and worker run on different origins, set `VITE_BACKEND_URL` for the frontend and `FRONTEND_ORIGIN` for the worker.

## Main routes

### Frontend
- `/` sign-in / SSO entry
- `/integrations` integrations control center
- `/messaging` messaging workspace
- `/panel`, `/memory`, `/friends`, `/settings` supporting pages

### Backend API
- `GET /api/auth/session`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/integrations`
- `POST /api/integrations/toggle`
- `GET /api/messaging/threads`
- `POST /api/messaging/threads`
- `GET /api/messaging/threads/:threadId`
- `POST /api/messaging/send`

## Contributor guardrails

- Build additively; preserve existing contributor work where possible.
- Do not delete major areas without explicit approval.
- Keep one product direction; avoid parallel competing flows.
- Keep docs aligned with the real code and route behavior.
