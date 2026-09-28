// Pure audit metadata sanitization. No server-only imports so it can be unit
// tested and reused. Contains no secrets or side effects.

// Keys that must never be written to audit metadata.
const FORBIDDEN_METADATA_KEYS = new Set([
  "password",
  "confirmation",
  "token",
  "token_hash",
  "access_token",
  "refresh_token",
  "service_role_key",
  "secret",
  "card_number",
  "cvv",
  "totp_secret",
]);

/**
 * Removes sensitive keys and non-primitive noise from audit metadata.
 * Only string, number, boolean, and null values (and arrays of primitives)
 * are retained.
 */
export function sanitizeAuditMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_METADATA_KEYS.has(lowerKey)) continue;
    if (Array.isArray(value)) {
      safe[key] = value.filter((item) => ["string", "number", "boolean"].includes(typeof item));
      continue;
    }
    if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
      safe[key] = value;
    }
  }
  return safe;
}
