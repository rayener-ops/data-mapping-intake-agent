// Cloudflare Pages Function. Deployed alongside the static site, this
// handles POST requests to /api/chat. It holds the Anthropic API key
// server-side (as a Cloudflare "secret" environment variable configured
// once in the Pages project settings) so no one using the page ever sees
// or needs their own key.
//
// The browser calls POST /api/chat with { messages, model, system } and
// gets back { text }. The system prompt (interview logic / register
// schema) lives in schema.js and is sent from the browser as part of the
// request, so this function stays generic.

export async function onRequestPost(context) {
  const { request, env } = context;

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonResponse(
      {
        error:
          "This deployment is not configured with an ANTHROPIC_API_KEY. Ask whoever manages it to set that secret in the Cloudflare Pages project settings.",
      },
      500
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { messages, model, system } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonResponse({ error: "Missing 'messages' array" }, 400);
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-sonnet-4-5-20250929",
        max_tokens: 2048,
        system: system || undefined,
        messages,
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      const detail = (data && data.error && data.error.message) || JSON.stringify(data);
      return jsonResponse({ error: `Anthropic API error: ${detail}` }, upstream.status);
    }

    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    return jsonResponse({ text }, 200);
  } catch (err) {
    return jsonResponse({ error: `Failed to reach Anthropic API: ${err.message || err}` }, 502);
  }
}

export async function onRequestGet() {
  return jsonResponse({ error: "Method not allowed. POST only." }, 405);
}

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
