# Atom on Cloudflare Pages + Workers

This repo contains a cleaned, non-duplicated starter setup for:

- **Frontend**: React + Vite app (`frontend/`)
- **Backend**: Cloudflare Worker API powered by Hono (`worker/`)

## Deploy architecture

- Host the React app on **Cloudflare Pages**.
- Deploy the Hono API as a **Cloudflare Worker**.
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
