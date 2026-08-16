// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";

// Tekstipohjainen täydennys (Vaihe 2) käyttää Sonnetia, ei Haikua — identify-wine
// (Vaihe 1, kuvapohjainen kirjaimellinen luku) käyttää Haikua omassa
// funktiossaan. Eri env-muuttuja kuin identify-wine:ssä, jotta mallit voi
// vaihtaa toisistaan riippumatta.
const MODEL = Deno.env.get("ANTHROPIC_ENRICH_MODEL") ?? "claude-sonnet-5";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnrichWineRequestBody {
  name?: unknown;
  producer?: unknown;
  vintage?: unknown;
  country?: unknown;
  region?: unknown;
  appellation?: unknown;
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

// Sama periaate kuin identify-wine:n sanitizeWineCountry — malli voi silti
// joskus palauttaa maan nimen koodin sijaan.
function sanitizeWineCountry(wine: unknown): void {
  if (!wine || typeof wine !== "object") return;
  const record = wine as Record<string, unknown>;
  if (typeof record.country !== "string" || !ISO_COUNTRY_CODE_PATTERN.test(record.country)) {
    record.country = null;
  }
}

function buildPrompt(input: {
  name: string;
  producer: string;
  vintage: number | null;
  country: string | null;
  region: string | null;
  appellation: string | null;
}): string {
  return `You are a wine expert. A user has already identified the following wine, either by scanning its label or typing it in themselves. Some fields are already known; others are missing.

Known information:
- Name: ${input.name}
- Producer: ${input.producer}
- Vintage: ${input.vintage ?? "unknown"}
- Country: ${input.country ?? "unknown"}
- Region: ${input.region ?? "unknown"}
- Appellation: ${input.appellation ?? "unknown"}

Using your knowledge of this producer and this wine, fill in ONLY the fields listed above as "unknown": region, country, appellation, and also determine the grapes and type. Do not change or contradict any field that is already known — echo it back exactly as given. If you cannot determine a missing field with reasonable confidence, leave it null rather than guessing.

Return exactly this JSON structure and nothing else:

{
  "wine": {
    "name": string,
    "producer": string,
    "vintage": number | null,
    "country": string | null,
    "region": string | null,
    "appellation": string | null,
    "grapes": string[] | null,
    "type": "red" | "white" | "rose" | "sparkling" | "dessert" | "fortified" | null,
    "confidence": "high" | "medium" | "low"
  }
}

Return region in Finnish (e.g. "Toscana" not "Tuscany" if there's a natural Finnish form, otherwise use the original name).

The "country" field should be a two-letter ISO 3166-1 alpha-2 code (e.g. "IT" for Italy, "FR" for France, "ES" for Spain, "DE" for Germany, "US" for United States), not a country name in any language.

Return ONLY valid JSON. Do not wrap the response in markdown. Do not include explanations, notes or surrounding text.`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed. Use POST." }, 405);
  }

  let body: EnrichWineRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  const { name, producer, vintage, country, region, appellation } = body;

  if (!isNonEmptyString(name)) {
    return jsonResponse({ error: "Missing or empty required field: name." }, 400);
  }

  if (!isNonEmptyString(producer)) {
    return jsonResponse({ error: "Missing or empty required field: producer." }, 400);
  }

  if (vintage !== undefined && typeof vintage !== "number") {
    return jsonResponse({ error: "vintage must be a number when provided." }, 400);
  }

  if (country !== undefined && !isNonEmptyString(country)) {
    return jsonResponse({ error: "country must be a non-empty string when provided." }, 400);
  }

  if (region !== undefined && !isNonEmptyString(region)) {
    return jsonResponse({ error: "region must be a non-empty string when provided." }, 400);
  }

  if (appellation !== undefined && !isNonEmptyString(appellation)) {
    return jsonResponse({ error: "appellation must be a non-empty string when provided." }, 400);
  }

  const prompt = buildPrompt({
    name,
    producer,
    vintage: (vintage as number | undefined) ?? null,
    country: (country as string | undefined) ?? null,
    region: (region as string | undefined) ?? null,
    appellation: (appellation as string | undefined) ?? null,
  });

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return jsonResponse({ error: "Server is not configured with an Anthropic API key." }, 400);
  }

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
            content: prompt,
          },
        ],
      }),
    });
  } catch {
    return jsonResponse({ error: "Failed to reach the Anthropic API." }, 500);
  }

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

  let parsed: { wine: unknown };
  try {
    parsed = JSON.parse(stripJsonFences(textBlock.text));
  } catch {
    return jsonResponse({ error: "Failed to parse the wine enrichment data as JSON." }, 500);
  }

  sanitizeWineCountry(parsed.wine);

  return jsonResponse(
    {
      wine: parsed.wine,
      model: MODEL,
    },
    200,
  );
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/enrich-wine' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Barolo","producer":"Giacomo Conterno"}'

*/
