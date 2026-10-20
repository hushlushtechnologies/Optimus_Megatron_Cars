/**
 * Removes characters that have meaning inside a PostgREST .or() filter or an
 * ilike pattern. Left in, a search for "Smith, John" would break the query.
 */
export function sanitizeSearchTerm(raw?: string): string {
  return (raw ?? "")
    .replace(/[%,()\\*"]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
