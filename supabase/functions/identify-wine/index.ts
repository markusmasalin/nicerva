// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";

const MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-haiku-4-5-20251001";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// Base64 has no line breaks in the request payload, so ~10MB of image data
// is roughly 10 * 1024 * 1024 base64 characters.
const MAX_IMAGE_BASE64_LENGTH = 10 * 1024 * 1024;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROMPT = `You are looking at a photo of a wine label. Extract as much information as you can about the wine and every piece of text visible on the label.

You may receive one or two images: the front label and optionally the back label of the same wine bottle. Combine information from both — the back label often contains the vintage or grape composition when the front doesn't.

Return exactly this JSON structure and nothing else:

{
  "wine": {
    "name": string | null,
    "producer": string | null,
    "vintage": number | null,
    "country": string | null,
    "region": string | null,
    "appellation": string | null,
    "grapes": string[] | null,
    "type": "red" | "white" | "rose" | "sparkling" | "dessert" | "fortified" | null,
    "confidence": "high" | "medium" | "low"
  },
  "detectedText": string[]
}

"detectedText" must contain every piece of raw text you can read on the label, one entry per line or fragment, regardless of whether you could map it into the "wine" fields.

Return region in Finnish (e.g. "Toscana" not "Tuscany" if there's a natural Finnish form, otherwise use the original name).

The "country" field should be a two-letter ISO 3166-1 alpha-2 code (e.g. "IT" for Italy, "FR" for France, "ES" for Spain, "DE" for Germany, "US" for United States), not a country name in any language.

Return ONLY valid JSON. Do not wrap the response in markdown. Do not include explanations, notes or surrounding text.`;

interface IdentifyWineRequestBody {
  image?: unknown;
  mediaType?: unknown;
  backImage?: unknown;
  backMediaType?: unknown;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

const ISO_COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

// Malli voi silti joskus palauttaa maan nimen koodin sijaan — parempi
// pudottaa arvo null:ksi kuin päästää virheellinen koodi läpi näennäisesti
// oikeana.
function sanitizeWineCountry(wine: unknown): void {
  if (!wine || typeof wine !== "object") return;
  const record = wine as Record<string, unknown>;
  if (typeof record.country !== "string" || !ISO_COUNTRY_CODE_PATTERN.test(record.country)) {
    record.country = null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed. Use POST." }, 405);
  }

  let body: IdentifyWineRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  const { image, mediaType, backImage, backMediaType } = body;

  if (!isNonEmptyString(image)) {
    return jsonResponse({ error: "Missing or empty required field: image." }, 400);
  }

  if (!isNonEmptyString(mediaType)) {
    return jsonResponse({ error: "Missing or empty required field: mediaType." }, 400);
  }

  if (image.length > MAX_IMAGE_BASE64_LENGTH) {
    return jsonResponse({ error: "image is too large. Maximum size is ~10MB." }, 400);
  }

  const content: Array<Record<string, unknown>> = [
    {
      type: "image",
      source: { type: "base64", media_type: mediaType, data: image },
    },
  ];

  const backImageProvided = backImage !== undefined || backMediaType !== undefined;
  if (backImageProvided) {
    if (!isNonEmptyString(backImage)) {
      return jsonResponse({ error: "backImage must be a non-empty string when provided." }, 400);
    }
    if (!isNonEmptyString(backMediaType)) {
      return jsonResponse({ error: "backMediaType must be a non-empty string when provided." }, 400);
    }
    if (backImage.length > MAX_IMAGE_BASE64_LENGTH) {
      return jsonResponse({ error: "backImage is too large. Maximum size is ~10MB." }, 400);
    }
    content.push({
      type: "image",
      source: { type: "base64", media_type: backMediaType, data: backImage },
    });
  }

  content.push({ type: "text", text: PROMPT });

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return jsonResponse({ error: "Server is not configured with an Anthropic API key." }, 400);
  }

  const startedAt = Date.now();
  let anthropicResponse: Response;
  try {
    anthropicResponse = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        temperature: 0,
        messages: [
          {
            role: "user",
            content,
          },
        ],
      }),
    });
  } catch {
    return jsonResponse({ error: "Failed to reach the Anthropic API." }, 500);
  }
  const processingTime = Date.now() - startedAt;

  if (!anthropicResponse.ok) {
    return jsonResponse({ error: "The Anthropic API request failed." }, 500);
  }

  let anthropicBody: {
    content?: Array<{ type: string; text?: string }>;
  };
  try {
    anthropicBody = await anthropicResponse.json();
  } catch {
    return jsonResponse({ error: "Failed to parse the Anthropic API response." }, 500);
  }

  const textBlock = anthropicBody.content?.find((block) => block.type === "text");
  if (!textBlock?.text) {
    return jsonResponse({ error: "The Anthropic API response did not contain any text." }, 500);
  }

  let parsed: { wine: unknown; detectedText: unknown };
  try {
    parsed = JSON.parse(stripJsonFences(textBlock.text));
  } catch {
    return jsonResponse({ error: "Failed to parse the wine label data as JSON." }, 500);
  }

  sanitizeWineCountry(parsed.wine);

  return jsonResponse(
    {
      wine: parsed.wine,
      detectedText: parsed.detectedText,
      model: MODEL,
      processingTime,
    },
    200,
  );
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/identify-wine' \
    --header 'Content-Type: application/json' \
    --data '{"image":"<base64 data>","mediaType":"image/jpeg"}'

*/
