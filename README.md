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
- `api/chat.js` — a small serverless backend function. It reads the Anthropic API key from a server-side
  environment variable (`ANTHROPIC_API_KEY`) that only the deployment owner sets, calls the Claude API, and
  relays the reply back to the page. The key is never exposed to the browser or to end users.
- When the assistant has gathered enough information, it summarizes the row back to the user for
  confirmation and then emits a structured result. The page detects that and unlocks **Download CSV /
  Download JSON / Download Markdown** buttons so the finished row can be handed to Legal/Privacy.

## Deploying it (one-time setup, ~5 minutes)

This repo is set up as a [Vercel](https://vercel.com) project (static page + one serverless function), which
has a free tier and needs no server management.

1. Go to **vercel.com**, sign up or log in (you can use the "Continue with GitHub" option).
2. Click **Add New… → Project**, then **Import** this repository
   (`rayener-ops/data-mapping-intake-agent`).
3. Before deploying, open **Environment Variables** and add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: an Anthropic API key from **console.anthropic.com → API Keys** (create one on whichever
     account/org should be billed for this tool's usage).
4. Click **Deploy**. Vercel gives you a live URL (e.g. `https://data-mapping-intake-agent.vercel.app`).
5. Share that URL with the team — that's the whole rollout. No one else needs a key or any setup.

To rotate or replace the key later, update the `ANTHROPIC_API_KEY` value in the Vercel project's
**Settings → Environment Variables** and redeploy (Vercel prompts you to).

### Alternative hosts

Any host that can run a small Node serverless/edge function alongside static files works the same way
(e.g. Netlify Functions, Cloudflare Pages Functions) — the pattern is the same: serve `index.html`/`app.js`/
`schema.js` as static files, run `api/chat.js` as a function, and set `ANTHROPIC_API_KEY` as a server-side
environment variable there.

## Local development

```bash
npm install -g vercel
vercel dev
```

This runs both the static page and the `api/chat.js` function locally at `http://localhost:3000`. Create a
`.env.local` file with `ANTHROPIC_API_KEY=sk-ant-...` for local testing (this file is git-ignored).

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
