import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServiceRoleKey } from "@/lib/env.server";

export class RateLimitError extends Error {
  constructor(public readonly unavailable = false) {
    super(unavailable ? "This service is temporarily unavailable. Please try again shortly." : "Too many attempts. Please try again in a few minutes.");
  }
}

export async function enforceRateLimit(scope: string, identity: string, limit: number, windowSeconds = 900) {
  try {
    // Irreversible keyed hashes keep email addresses and IPs out of the database.
    const key = createHmac("sha256", getServiceRoleKey()).update(`${scope}:${identity}`).digest("hex");
    const { data, error } = await createAdminClient().rpc("consume_request_limit", {
      input_key: key, input_limit: limit, input_window_seconds: windowSeconds,
    });
    if (error || typeof data !== "boolean") {
      console.error(JSON.stringify({ event: "rate_limit_backend_unavailable" }));
      throw new RateLimitError(true);
    }
    if (!data) throw new RateLimitError();
  } catch (error) {
    if (error instanceof RateLimitError) throw error;
    throw new RateLimitError(true);
  }
}

export async function enforceAuthRateLimit(scope: string, email: string) {
  const h = await headers();
  // Vercel overwrites this header. On other hosts use a conservative shared
  // bucket until a trusted proxy integration is explicitly configured.
  const ip = process.env.VERCEL === "1" ? h.get("x-vercel-forwarded-for") ?? "unknown" : "self-hosted";
  await enforceRateLimit(`${scope}:ip`, ip, 50);
  await enforceRateLimit(`${scope}:account`, email.trim().toLowerCase(), 10);
}
