# Atom on Cloudflare Pages + Workers

This repo contains a cleaned starter setup for:

- **Frontend**: React + Vite app (`frontend/`)
- **Backend**: Cloudflare Worker API powered by Hono (`worker/`)

## Deploy architecture

- Host the React app on **Cloudflare Pages**.
- Deploy the Hono API as a **Cloudflare Worker**.
- Set `VITE_BACKEND_URL` in Pages to your Worker URL.

## 1) Frontend setup

```bash
npm create vite@latest atom-chat -- --template react
cd atom-chat
npm install
npm install lucide-react
```

Copy `frontend/src/App.jsx` and `frontend/public/_redirects` into your project.

## 2) Important config for `/coms` path hosting

If your app is served at `https://espacios.me/coms`, Vite must use a `/coms/` base path.
This repo includes a safe `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/coms/',
})
```

## 3) Cloudflare Pages build settings

- Root directory: your frontend folder
- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`

### Environment variable (Pages)

Add this in Pages settings:

- `VITE_BACKEND_URL=https://your-worker-name.your-subdomain.workers.dev`

## 4) Worker setup

Use `worker/src/index.ts` and configure these env vars in Worker settings:

- `GEMINI_API_KEY` (Secret)
- `FRONTEND_ORIGIN` (Plain text, example: `https://espacios.me`)

## 5) SPA routing on Pages

`frontend/public/_redirects`:

```txt
/* /index.html 200
```

This ensures client-side routes resolve correctly.
