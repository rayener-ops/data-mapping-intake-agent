# Data Mapping Intake Assistant

A standalone, single-page conversational agent that interviews a business associate about one data
processing activity (a site, app, tool, tracker, or vendor integration that touches personal information)
and produces a completed row for Valnet's Data Mapping Register — the Record of Processing Activities
covering GDPR (EU), CCPA/CPRA and comparable US state laws, and PIPEDA/Law 25 (Canada).

This replaces the old workflow of business teams manually filling out a shared Excel template. It is
**independent of Excel** — a static web page you can open anywhere, and it exports the finished row as
CSV, JSON, or a Markdown summary at the end.

## How it works

- The page is a single static site (`index.html` + `schema.js` + `app.js`), no build step, no backend.
- The full interview logic — question order, validation rules, the register's reference/drop-down lists,
  and a plain-language glossary of legal terms — lives in `schema.js` as the system prompt for the model.
- When you open the page, you enter your own Anthropic API key. The page calls the Claude API
  (`https://api.anthropic.com/v1/messages`) **directly from your browser**
  (using the `anthropic-dangerous-direct-browser-access` header) — there is no server in between, and
  your key is never sent anywhere except Anthropic's API.
- Your API key and the conversation are kept only in `sessionStorage` for that browser tab — nothing is
  written to disk or committed to this repo. Closing the tab (or clicking "Reset session") clears
  everything.
- Once the assistant has gathered enough information, it summarizes the row back to you for confirmation
  and then emits a structured result. The page detects that and unlocks **Download CSV / Download JSON /
  Download Markdown** buttons so you can hand the finished row to Legal/Privacy.

## Using it

1. Open the deployed page (see the repo's GitHub Pages URL), or open `index.html` locally in a browser.
2. Paste in an Anthropic API key you're authorized to use for Valnet's internal purposes, pick a model,
   and click **Start intake**.
3. Answer the assistant's questions about the activity. It walks through: general info → data subjects →
   personal information categories → collection & purpose → sharing & international transfers →
   retention/access/security → automated decision-making → applicable law → notes/admin.
4. When it presents the finished row and you confirm, download the CSV/JSON/Markdown and send it to
   Legal/Privacy (or paste the row into the master Data Mapping Register).

## Security note

Because this is a pure static page with no backend, the API key you enter is visible to your own browser
(e.g. in DevTools network requests) for the duration of your session. That's an intentional trade-off for
a zero-infrastructure internal tool — don't use a key you wouldn't want visible in your own browser, and
don't share your key with others. If Valnet later wants centralized key management, submission storage, or
an audit trail, the interview logic in `schema.js` can be reused behind a small backend (e.g. a serverless
function that holds the key server-side) instead of calling the API directly from the browser.

## Local development

No build tooling is required. From this folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in a browser.

## Deployment

This repo is set up to serve `index.html` via GitHub Pages from the `main` branch.
