# Atom integrations platform

This repo now ships a cleaner integrations system designed for calm operations and real deployment.

## What changed

### Frontend
- Rebuilt the integrations dashboard with a dark premium layout that works on mobile and desktop.
- Added a proper sign-in experience with Google, GitHub, and demo entry.
- Added integration health, diagnostics, toggles, disconnect actions, and request cards.
- Wired the chat page to the Worker so the assistant can see enabled integrations.

### Backend
- Added signed session cookies for dashboard auth.
- Added OAuth start and callback flows for Google Workspace and GitHub.
- Added integration state endpoints, diagnostics endpoints, toggle endpoints, and disconnect endpoints.
- Preserved demo mode so product review still works before secrets are configured.

## Architecture

### Frontend
- `frontend/src/hooks/useAuth.ts` keeps the session in sync with the worker.
- `frontend/src/lib/api.ts` centralizes typed API calls and SSO redirects.
- `frontend/src/pages/IntegrationsDashboard.tsx` is the main control surface.
- `frontend/src/pages/Chat.tsx` sends live messages to the worker with connected app context.

### Worker
- `worker/src/index.ts` handles:
  - signed session cookies
  - OAuth start and callback routes
  - integration state and diagnostics
  - WhatsApp send endpoint
  - Gemini chat endpoint

## Environment variables

Set these in the Cloudflare Worker.

### Required
- `FRONTEND_ORIGIN`
- `APP_SESSION_SECRET`
- `GEMINI_API_KEY`

### Google Workspace SSO
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

### GitHub SSO
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_REDIRECT_URI`

### Optional
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_ID`
- `GEMINI_MODEL`

## Local development

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Set:

```bash
VITE_BACKEND_URL=http://127.0.0.1:8787
```

### Worker
```bash
cd worker
npm install
npm run dev
```

## OAuth setup

### Google Workspace
1. Create OAuth credentials in Google Cloud.
2. Add `https://YOUR_WORKER_DOMAIN/api/auth/sso/callback` as an authorized redirect URI.
3. Add the Google env vars to the worker.

### GitHub
1. Create an OAuth app in GitHub.
2. Set the authorization callback URL to `https://YOUR_WORKER_DOMAIN/api/auth/sso/callback`.
3. Add the GitHub env vars to the worker.

## Deployment

### Frontend
Deploy the Vite app to Cloudflare Pages and set:

- `VITE_BACKEND_URL=https://YOUR_WORKER_DOMAIN`

### Worker
Deploy with Wrangler after configuring the env vars:

```bash
cd worker
npm run deploy
```

## Review checklist

- Sign in with Google or GitHub.
- Confirm the dashboard loads a connected provider state.
- Toggle an integration on and off.
- Disconnect a provider.
- Open `/chat` and send a message.
- Verify cookies are being sent with credentials from the frontend origin.

## Fallback behavior

If OAuth credentials are not configured yet, the product remains usable through demo mode. This keeps design review, product QA, and stakeholder walkthroughs moving while secrets are being wired.
