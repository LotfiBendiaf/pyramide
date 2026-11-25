import { createHash } from "node:crypto";

export function assistantCreationId(kind: string, owner: string, data: object) {
  const canonical = JSON.stringify(data, (_key, value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return value;
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)));
  });
  return createHash("sha256").update(`${kind}:${owner}:${canonical}`).digest("hex").slice(0, 24);
}
