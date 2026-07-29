# Cloudflare Worker proxy (production)

This Worker protects the Gemini API key and exposes a single POST endpoint for the frontend.

## 1) Requirements

- Cloudflare account
- Wrangler CLI installed (`npm i -g wrangler`)
- Pages project already deployed for this repo

## 2) Configure and deploy the Worker

From project root:

```bash
cd cloudflare
wrangler secret put GEMINI_API_KEY
wrangler deploy
```

Set your allowed frontend origin in `cloudflare/wrangler.toml`:

- `ALLOWED_ORIGIN = "https://your-domain.com"`

## 3) Connect frontend to the Worker endpoint

Option A (quick): set this in `index.html` before deploy:

```html
<script>
  window.IMAGE_API_PROXY = "https://a-colorear-image-proxy.<your-subdomain>.workers.dev";
</script>
```

Option B (recommended): route `/api/generate-image` to your Worker via Cloudflare so frontend can keep same-origin path.

## 4) Security controls to enable in Cloudflare dashboard

- WAF custom rule on Worker route
- Rate Limiting on `/api/generate-image`
- Turnstile validation (optional next step)

## Request contract

`POST /api/generate-image` (or your Worker URL) body:

```json
{ "prompt": "un dragon amigable" }
```

Response:

```json
{ "imageBase64": "..." }
```
