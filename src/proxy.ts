import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicSupabaseEnv, isSupabaseConfigured } from "@/lib/env";
import { contentSecurityPolicy } from "@/lib/security-headers";

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(nonce, process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NODE_ENV === "development");
  request.headers.set("x-nonce", nonce);
  request.headers.set("Content-Security-Policy", csp);
  let response = NextResponse.next({ request: { headers: request.headers } });
  const finish = (target = response) => {
    if (target !== response) response.cookies.getAll().forEach(cookie => target.cookies.set(cookie));
    target.headers.set("Content-Security-Policy", csp);
    target.headers.set("Cache-Control", "private, no-store, max-age=0");
    return target;
  };
  if (!isSupabaseConfigured()) return finish();

  // Public pages receive CSP without an auth round-trip. Session-consuming
  // pages refresh cookies here; actions and the database enforce authorization.
  const { pathname: earlyPathname } = request.nextUrl;
  const needsAuthCheck =
    earlyPathname.startsWith("/dashboard") ||
    earlyPathname === "/sign-in" ||
    earlyPathname === "/sign-up" || earlyPathname.startsWith("/mfa") ||
    earlyPathname === "/select-profile" || earlyPathname.startsWith("/api/v1/");
  if (!needsAuthCheck) return finish();

  const env = getPublicSupabaseEnv();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: sessionClaims } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(sessionClaims?.claims?.sub);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") && !isSignedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return finish(NextResponse.redirect(url));
  }

  if ((pathname === "/sign-in" || pathname === "/sign-up") && isSignedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return finish(NextResponse.redirect(url));
  }

  return finish();
}

export const config = {
  // HTML/API responses need CSP and private caching; static assets do not.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2)$).*)"],
};
