import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { getHealthcheckSecret, isHealthcheckConfigured } from "@/lib/env.server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function extractBearer(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

function isAuthorized(provided: string | null): boolean {
  if (!provided || !isHealthcheckConfigured()) return false;
  const expected = getHealthcheckSecret();
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  // Constant-time compare requires equal lengths; length mismatch is a mismatch.
  if (providedBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(providedBuf, expectedBuf);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(extractBearer(request))) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    // Bounded, minimal PostgREST/database probe. Anonymous RLS may return no
    // rows, which is fine; an unavailable backend returns an error.
    const probe = supabase
      .from("organizations")
      .select("id", { head: true })
      .limit(1)
      .abortSignal(AbortSignal.timeout(3000));
    const result = await probe;
    if (result.error) throw new Error("connectivity probe failed");
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
