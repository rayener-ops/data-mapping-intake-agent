# Data Mapping Intake Assistant

A standalone conversational agent (separate from Excel) that interviews a business associate about one
data processing activity (a site, app, tool, tracker, or vendor integration that touches personal
information) and produces a completed row for Valnet's Data Mapping Register — the Record of Processing
Activities covering GDPR (EU), CCPA/CPRA and comparable US state laws, and PIPEDA/Law 25 (Canada).

Anyone on the team can use the deployed link directly — no one needs their own API key. One Anthropic API
key is configured once, centrally, by whoever sets up the deployment.

## How it works

- `index.html` / `app.js` — the chat page. It never sees an API key.
- `schema.js` — the interview logic: question order, validation rules, the register's reference/drop-down
  lists, and a plain-language glossary of legal terms, sent as the system prompt.
- `functions/api/chat.js` — a small backend function (Cloudflare Pages Functions format) and
  `api/chat.js` — the same function in Vercel's format, kept as an alternative. Either one reads the
  Anthropic API key from a server-side environment variable/secret (`ANTHROPIC_API_KEY`) that only the
  deployment owner sets, calls the Claude API, and relays the reply back to the page. The key is never
  exposed to the browser or to end users.
- When the assistant has gathered enough information, it summarizes the row back to the user for
  confirmation and then emits a structured result. The page detects that and unlocks **Download CSV /
  Download JSON / Download Markdown** buttons so the finished row can be handed to Legal/Privacy.

## Deploying it (one-time setup, ~5 minutes) — Cloudflare Pages

This is the recommended option: **Cloudflare Pages' free tier does not require a credit card or paid
plan** for this kind of small static site + function (100,000 function requests/day free).

1. Go to **dash.cloudflare.com**, sign up or log in (free account).
2. In the sidebar, go to **Workers & Pages → Create → Pages → Connect to Git**.
3. Authorize Cloudflare to access GitHub and select this repository
   (`rayener-ops/data-mapping-intake-agent`).
4. Build settings: framework preset **None**, build command **(leave blank)**, build output directory
   **`/`** (the repo root — that's where `index.html` lives).
5. Before the first deploy, or right after under **Settings → Environment variables**, add a variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: an Anthropic API key from **console.anthropic.com → API Keys** (create one on whichever
     account/org should be billed for this tool's usage). Mark it as a **secret** so it isn't shown in
     the dashboard afterward.
6. Click **Save and Deploy**. Cloudflare gives you a live URL (e.g.
   `https://data-mapping-intake-agent.pages.dev`).
7. Share that URL with the team — that's the whole rollout. No one else needs a key or any setup.

To rotate or replace the key later, update the `ANTHROPIC_API_KEY` value under **Settings → Environment
variables** and redeploy (Cloudflare prompts you to, or it picks it up on the next deploy).

### Alternative: Vercel

Vercel works the same way using `api/chat.js` instead of `functions/api/chat.js`, but some Vercel accounts
now require a paid plan to deploy new projects — check your account before choosing this route. If it's
available: import the repo at **vercel.com → Add New → Project**, add the same `ANTHROPIC_API_KEY`
environment variable, and deploy.

### Other hosts

Any host that can run a small Node/edge function alongside static files works the same way (e.g. Netlify
Functions) — serve `index.html`/`app.js`/`schema.js` as static files, run the chat function, and set
`ANTHROPIC_API_KEY` as a server-side environment variable/secret there.

## Local development

```bash
npm install -g wrangler
wrangler pages dev . --binding ANTHROPIC_API_KEY=sk-ant-...
```

This runs both the static page and `functions/api/chat.js` locally.

## Using it

1. Open the deployed URL.
2. Click **Start intake**.
3. Answer the assistant's questions about the activity. It walks through: general info → data subjects →
   personal information categories → collection & purpose → sharing & international transfers →
   retention/access/security → automated decision-making → applicable law → notes/admin.
4. When it presents the finished row and you confirm, download the CSV/JSON/Markdown and send it to
   Legal/Privacy (or paste the row into the master Data Mapping Register).

## Cost and usage notes

Each conversation uses the Anthropic API under the configured key, billed per token to whichever account
owns that key — typically a few cents per completed intake with the default model
(`claude-sonnet-4-5-20250929`). There's no built-in per-user rate limiting; if usage volume becomes a
concern, ask Legal/IT before rolling this out broadly, or add authentication/rate limiting to `api/chat.js`.
