const MAX_PROMPT_LENGTH = 300;
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

    // Solo aceptamos peticiones desde la web de la app (bloquea otras webs y scripts simples).
    if (allowedOrigin && origin !== allowedOrigin) {
      return json({ error: "Origen no permitido" }, 403, c);
    }

    // Límite por IP y tope global por minuto para proteger el crédito de Gemini.
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (env.IP_LIMITER && !(await env.IP_LIMITER.limit({ key: ip })).success) {
      return json({ error: "Has pedido muchos dibujos seguidos. Espera un minuto y vuelve a intentarlo." }, 429, { ...c, "Retry-After": "60" });
    }
    if (env.GLOBAL_LIMITER && !(await env.GLOBAL_LIMITER.limit({ key: "global" })).success) {
      return json({ error: "Hay mucha gente dibujando ahora mismo. Inténtalo en un minuto." }, 429, { ...c, "Retry-After": "60" });
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
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return json({ error: `La descripción es demasiado larga (máximo ${MAX_PROMPT_LENGTH} caracteres).` }, 400, c);
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
        console.error("Gemini error", geminiResp.status, JSON.stringify(geminiData));
        return json({ error: "Gemini request failed" }, 502, c);
      }

      const imageBase64 = geminiData?.candidates?.[0]?.content?.parts?.find(
        (p) => p.inlineData?.data
      )?.inlineData?.data;

      if (!imageBase64) {
        console.error("Gemini returned no image", JSON.stringify(geminiData));
        return json({ error: "No image data returned" }, 502, c);
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
