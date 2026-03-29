# Atom on Cloudflare Pages + Workers

This repo contains a cleaned starter setup for:

- **Frontend**: React + Vite app (`frontend/`)
- **Backend**: Cloudflare Worker API powered by Hono (`worker/`)

## Deploy architecture

- Host the React app on **Cloudflare Pages**.
- Deploy the Hono API as a **Cloudflare Worker**.
- Set `VITE_BACKEND_URL` in Pages to your Worker URL.

## 1) Frontend setup
- Point `BACKEND_URL` in the frontend to your deployed Worker URL.

---

## Prerequisites

- GitHub account
- Cloudflare account
- Node.js locally installed

## 1) Create the frontend (Vite + React + Tailwind)

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

npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install lucide-react
```

Then:
- configure `tailwind.config.js` and `src/index.css`
- replace `src/App.jsx` with `frontend/src/App.jsx` from this repo
- add `public/_redirects` for SPA routing (included in this repo)

## 2) Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Atom UI"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## 3) Deploy frontend to Cloudflare Pages

In **Cloudflare Dashboard → Workers & Pages → Create Application → Pages → Connect to Git**:

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
Save and deploy.

## 4) Deploy backend Worker

Create a Worker project and use `worker/src/index.ts`.
Set these environment variables (secrets/bindings):

- `GEMINI_API_KEY`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_ID`

Example dev run:

```bash
cd worker
npm install
npm run dev
```

## 5) Frontend/backend wiring

In `frontend/src/App.jsx`:

- dev: `const BACKEND_URL = "http://localhost:8787"`
- prod: set this to your deployed Worker URL

---

## Files in this repo

- `frontend/src/App.jsx`: Atom UI and API integration client
- `frontend/public/_redirects`: SPA fallback for Pages
- `worker/src/index.ts`: Hono Worker API (auth, key testing, chat, WhatsApp send, status)
