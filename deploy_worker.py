import requests
import sys

CF_TOKEN = "cfat_UGmaNBvDfHr2smOBJAQKZhl9KAVWDTBEIFoDgupxd8e3086e"
ACCOUNT_ID = "b1b843ec85bc39a3a4d370ba4f84f17a"
WORKER_NAME = "a"

# The corrected atom-worker.js with proper CORS origins
WORKER_CODE = r"""// atom-backend — vanilla JS, no dependencies
// Paste this directly into the Cloudflare Workers web editor
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://espacios-me-a.pages.dev',
  'https://b18b6a96.espacios-me-a.pages.dev',
  'https://espacios.me',
];
function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}
function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const { pathname } = new URL(request.url);
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    // GET /api/health
    if (request.method === 'GET' && pathname === '/api/health') {
      return json({ ok: true, service: 'atom-backend' }, 200, origin);
    }
    // POST /api/auth/login
    if (request.method === 'POST' && pathname === '/api/auth/login') {
      const body = await request.json().catch(() => ({}));
      return json({
        success: true,
        token: 'cf-worker-jwt-token',
        user: {
          name: 'Admin User',
          email: 'admin@espacios.me',
          provider: body.provider || 'unknown',
        },
      }, 200, origin);
    }
    // POST /api/test-keys  (Gemini only)
    if (request.method === 'POST' && pathname === '/api/test-keys') {
      const { apiKey } = await request.json().catch(() => ({}));
      if (!apiKey) return json({ success: false, message: 'No API key provided.' }, 400, origin);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "reply 'ok'" }] }] }),
      });
      if (res.ok) return json({ success: true, message: 'Gemini API Key is valid!' }, 200, origin);
      return json({ success: false, message: 'Invalid Gemini API Key.' }, 400, origin);
    }
    // POST /api/chat
    if (request.method === 'POST' && pathname === '/api/chat') {
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) return json({ error: 'GEMINI_API_KEY not configured.' }, 500, origin);
      const { messages, connectedApps } = await request.json().catch(() => ({}));
      const contents = (messages || []).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.text }],
      }));
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{
              text: `You are Atom, a helpful AI assistant. Connected apps: ${(connectedApps || []).join(', ')}. Be concise and direct.`,
            }],
          },
        }),
      });
      if (!res.ok) return json({ error: 'Gemini request failed.' }, 502, origin);
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
      return json({ reply: text }, 200, origin);
    }
    // GET /api/integrations/cloudflare/status
    if (request.method === 'GET' && pathname === '/api/integrations/cloudflare/status') {
      return json({
        status: 'All systems operational',
        active_workers: 10,
        cache_hit_ratio: '94%',
      }, 200, origin);
    }
    return json({ error: 'Not found.' }, 404, origin);
  },
};
"""

url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/{WORKER_NAME}"
headers = {
    "Authorization": f"Bearer {CF_TOKEN}",
}

# Upload as multipart form with module format
files = {
    "worker.js": ("worker.js", WORKER_CODE, "application/javascript+module"),
    "metadata": (None, '{"main_module":"worker.js"}', "application/json"),
}

resp = requests.put(url, headers=headers, files=files)
print("Status:", resp.status_code)
data = resp.json()
if data.get("success"):
    print("Worker deployed successfully!")
    print("Script ID:", data.get("result", {}).get("id"))
else:
    print("Errors:", data.get("errors"))
    print("Full response:", data)
