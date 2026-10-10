export function contentSecurityPolicy(nonce: string, supabaseUrl: string | undefined, development: boolean) {
  const backend = supabaseUrl ? new URL(supabaseUrl).origin : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    // Calendar positioning uses inline styles. Scripts remain nonce-only.
    "style-src 'self' 'unsafe-inline'",
    `connect-src 'self' ${backend}${development ? " ws: http://localhost:* http://127.0.0.1:*" : ""}`,
    "img-src 'self' data: blob:", "font-src 'self'", "object-src 'none'",
    "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'",
  ].join("; ");
}
