const MODEL_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

function corsHeaders(origin, allowedOrigin) {
  const allowOrigin = allowedOrigin && origin === allowedOrigin ? origin : allowedOrigin || "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders
    }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "";
    const c = corsHeaders(origin, allowedOrigin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: c });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, c);
    }

    if (!env.GEMINI_API_KEY) {
      return json({ error: "Missing GEMINI_API_KEY secret" }, 500, c);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400, c);
    }

    const prompt = String(payload?.prompt || "").trim();
    if (!prompt) {
      return json({ error: "prompt is required" }, 400, c);
    }

    const geminiPayload = {
      contents: [
        {
          parts: [
            {
              text: `${prompt} black and white, thick lines, coloring page`
            }
          ]
        }
      ],
      generationConfig: { temperature: 0.4 }
    };

    try {
      const geminiResp = await fetch(`${MODEL_URL}?key=${env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(geminiPayload)
      });

      const geminiData = await geminiResp.json();
      if (!geminiResp.ok) {
        return json(
          { error: "Gemini request failed", details: geminiData },
          geminiResp.status,
          c
        );
      }

      const imageBase64 = geminiData?.candidates?.[0]?.content?.parts?.find(
        (p) => p.inlineData?.data
      )?.inlineData?.data;

      if (!imageBase64) {
        return json({ error: "No image data returned", details: geminiData }, 502, c);
      }

      return json({ imageBase64 }, 200, c);
    } catch (err) {
      return json(
        {
          error: "Upstream fetch failed",
          details: err instanceof Error ? err.message : String(err)
        },
        502,
        c
      );
    }
  }
};
