import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicSupabaseEnv, isSupabaseConfigured } from "@/lib/env";

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next({ request });

  // The proxy only needs Supabase to (a) guard /dashboard/* and (b) redirect an
  // already-signed-in user away from the auth pages. Every other path (public
  // marketing/auth pages, and _next/data routes that always run the proxy) can
  // skip the auth.getClaims() network call entirely. Auth remains enforced in
  // the dashboard layout and inside every Server Action, so this only removes
  // redundant round-trips, not authorization.
  const { pathname: earlyPathname } = request.nextUrl;
  const needsAuthCheck =
    earlyPathname.startsWith("/dashboard") ||
    earlyPathname === "/sign-in" ||
    earlyPathname === "/sign-up";
  if (!needsAuthCheck) return NextResponse.next({ request });

  const env = getPublicSupabaseEnv();
  let response = NextResponse.next({ request });
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
          response = NextResponse.next({ request });
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
    return NextResponse.redirect(url);
  }

  if ((pathname === "/sign-in" || pathname === "/sign-up") && isSignedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Only run the proxy on the paths it actually acts on. This keeps the
  // Supabase auth round-trip off public/static routes. Security is still
  // enforced server-side in the dashboard layout and Server Actions.
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
};
