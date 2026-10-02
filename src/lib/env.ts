import { z } from "zod";

// These values are intentionally public and are included in the browser bundle.
// They must still be configured explicitly so an unconfigured deployment cannot
// silently connect to the wrong Supabase project.

const publicSupabaseSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

function resolvePublicSupabaseEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function isSupabaseConfigured() {
  return publicSupabaseSchema.safeParse(resolvePublicSupabaseEnv()).success;
}

export function getPublicSupabaseEnv() {
  const result = publicSupabaseSchema.safeParse(resolvePublicSupabaseEnv());

  if (!result.success) {
    throw new Error("Supabase is not configured. Copy .env.example to .env.local and add your project credentials.");
  }

  return result.data;
}
