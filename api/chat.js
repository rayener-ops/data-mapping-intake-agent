// Serverless function (Vercel Node runtime). Holds the Anthropic API key
// server-side (an environment variable configured once in the hosting
// dashboard) so no one using the page ever sees or needs their own key.
//
// The browser calls POST /api/chat with { messages, model } and gets back
// { text }. The system prompt (interview logic / register schema) lives in
// schema.js and is sent from the browser as part of the request so this
// function stays generic — it never needs to know about the Data Mapping
// Register specifically.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error:
        "Server is not configured with an ANTHROPIC_API_KEY environment variable. Ask whoever manages this deployment to set one.",
    });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      res.status(400).json({ error: "Invalid JSON body" });
      return;
    }
  }

  const { messages, model, system } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Missing 'messages' array" });
    return;
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
      res.status(upstream.status).json({ error: `Anthropic API error: ${detail}` });
      return;
    }

    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    res.status(200).json({ text });
  } catch (err) {
    res.status(502).json({ error: `Failed to reach Anthropic API: ${err.message || err}` });
  }
}
