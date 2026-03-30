# Deployment Guide for Integrations Hub

This guide explains how to deploy the **Integrations Hub** to Cloudflare Pages and Workers.

## Prerequisites

1.  **Cloudflare Account**: Create a free account at [cloudflare.com](https://cloudflare.com).
2.  **Wrangler CLI**: Install Wrangler globally:
    ```bash
    npm install -g @cloudflare/wrangler
    ```
3.  **GitHub Account**: For OAuth integration (optional but recommended).

## Step 1: Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate your Cloudflare account.

## Step 2: Deploy the Cloudflare Worker

Navigate to the `worker` directory and deploy:

```bash
cd worker
wrangler deploy
```

This will deploy your backend API to Cloudflare Workers. Note the URL provided in the output (e.g., `https://integrations-hub-prod.your-account.workers.dev`).

## Step 3: Deploy the Frontend to Cloudflare Pages

### Option A: Using Git Integration (Recommended)

1.  Push your repository to GitHub.
2.  Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) > Pages.
3.  Click **Create a project** > **Connect to Git**.
4.  Select your repository.
5.  Set the build command to: `cd frontend && npm run build`
6.  Set the build output directory to: `frontend/dist`
7.  Click **Save and Deploy**.

### Option B: Using Wrangler (Direct Upload)

```bash
cd frontend
wrangler pages deploy dist
```

## Step 4: Configure Environment Variables

After deployment, configure your environment variables:

1.  Go to your Worker in the Cloudflare Dashboard.
2.  Click **Settings** > **Environment Variables**.
3.  Add the following variables:

| Variable | Description |
| --- | --- |
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret |
| `GOOGLE_CLIENT_ID` | Google OAuth App Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth App Client Secret |
| `MICROSOFT_CLIENT_ID` | Microsoft OAuth App Client ID |
| `MICROSOFT_CLIENT_SECRET` | Microsoft OAuth App Client Secret |
| `FRONTEND_ORIGIN` | Your frontend URL (e.g., `https://integrations-hub.pages.dev`) |

## Step 5: Update OAuth Redirect URIs

For each OAuth provider, update the redirect URI to:

```
https://your-worker-url.workers.dev/api/oauth/callback
```

## Step 6: Test the Deployment

1.  Visit your frontend URL: `https://integrations-hub.pages.dev`
2.  Click "Sign In" to test authentication.
3.  Connect a GitHub account to test OAuth flow.
4.  Use the repository browser to verify the integration works.

## Troubleshooting

### CORS Errors

If you see CORS errors, ensure the `FRONTEND_ORIGIN` environment variable is set correctly in your Worker.

### OAuth Callback Issues

Verify that the redirect URI in your OAuth provider settings matches exactly:
```
https://your-worker-url.workers.dev/api/oauth/callback
```

### Build Failures

If the frontend build fails, check:
1.  Node.js version (use Node 18+)
2.  All dependencies are installed: `npm install`
3.  No TypeScript errors: `npm run type-check`

## Next Steps

1.  Set up a custom domain for your Pages deployment.
2.  Enable DDoS protection and WAF rules.
3.  Monitor analytics in the Cloudflare Dashboard.
4.  Set up error tracking with Sentry or similar service.

For more information, visit the [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/).
