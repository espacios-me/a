import requests
import json

CF_TOKEN = "cfat_UGmaNBvDfHr2smOBJAQKZhl9KAVWDTBEIFoDgupxd8e3086e"
ACCOUNT_ID = "b1b843ec85bc39a3a4d370ba4f84f17a"
PROJECT_NAME = "espacios-me-a"

url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{PROJECT_NAME}"
headers = {
    "Authorization": f"Bearer {CF_TOKEN}",
    "Content-Type": "application/json",
}

# Patch the Pages project with:
# - build_config: root_dir=frontend, build_command=npm run build, destination_dir=dist
# - env var: VITE_BACKEND_URL = https://a.thekeifferjapeth.workers.dev
payload = {
    "build_config": {
        "root_dir": "frontend",
        "build_command": "npm run build",
        "destination_dir": "dist",
    },
    "deployment_configs": {
        "production": {
            "env_vars": {
                "GEMINI_API_KEY": {
                    "type": "secret_text",
                    "value": ""
                },
                "VITE_BACKEND_URL": {
                    "type": "plain_text",
                    "value": "https://a.thekeifferjapeth.workers.dev"
                }
            }
        },
        "preview": {
            "env_vars": {
                "VITE_BACKEND_URL": {
                    "type": "plain_text",
                    "value": "https://a.thekeifferjapeth.workers.dev"
                }
            }
        }
    }
}

resp = requests.patch(url, headers=headers, json=payload)
print("Status:", resp.status_code)
data = resp.json()
if data.get("success"):
    r = data.get("result", {})
    print("Pages project updated successfully!")
    print("Name:", r.get("name"))
    print("Build config:", json.dumps(r.get("build_config", {}), indent=2))
    prod_env = r.get("deployment_configs", {}).get("production", {}).get("env_vars", {})
    print("Production env vars:", list(prod_env.keys()))
else:
    print("Errors:", data.get("errors"))
    print("Full response:", json.dumps(data, indent=2))
