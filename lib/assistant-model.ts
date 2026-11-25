export class AssistantUnavailable extends Error {
  constructor(
    readonly reason: "configuration" | "quota" | "transient" | "invalid",
    readonly retryAfterSeconds?: number,
  ) {
    super(reason);
  }
}

export function providerRetryDelay(value: string | null, now = Date.now()) {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.max(1, Math.ceil(seconds));
  const at = Date.parse(value);
  return Number.isFinite(at) ? Math.max(1, Math.ceil((at - now) / 1000)) : undefined;
}

export async function askModel(system: string, input: object, json = true, schema?: { name: string; schema: Record<string, unknown> }): Promise<string> {
  const openAI = Boolean(process.env.OPENAI_API_KEY);
  const key = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
  if (!key) throw new AssistantUnavailable("configuration");
  const url = openAI ? "https://api.openai.com/v1/chat/completions" : "https://api.groq.com/openai/v1/chat/completions";
  const body = JSON.stringify({
    model: openAI ? process.env.OPENAI_MODEL || "gpt-4.1-mini" : process.env.GROQ_MODEL || "openai/gpt-oss-120b",
    max_completion_tokens: 1600,
    temperature: 0,
    ...(schema ? { response_format: { type: "json_schema", json_schema: { ...schema, strict: true } } } : json ? { response_format: { type: "json_object" } } : {}),
    messages: [{ role: "system", content: system }, { role: "user", content: JSON.stringify(input) }],
  });
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(12000),
        body,
      });
      if (response.status === 429) {
        const retryAfter = providerRetryDelay(response.headers.get("retry-after"));
        await response.body?.cancel();
        // Retry only rejected model requests. No CRM write has happened here.
        if (attempt === 0 && retryAfter !== undefined && retryAfter <= 45) {
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
        throw new AssistantUnavailable("quota", retryAfter);
      }
      if (response.status === 401 || response.status === 403) throw new AssistantUnavailable("configuration");
      if (!response.ok) throw new AssistantUnavailable(response.status === 400 ? "invalid" : "transient");
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) throw new AssistantUnavailable("invalid");
      return content.trim();
    }
    throw new AssistantUnavailable("quota");
  } catch (error) {
    if (error instanceof AssistantUnavailable) throw error;
    throw new AssistantUnavailable("transient");
  }
}
