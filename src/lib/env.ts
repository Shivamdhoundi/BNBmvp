import { z } from "zod";

// These values are intentionally public and are included in the browser bundle.
// Environment variables override them when configured by the deployment platform.
const DEFAULT_SUPABASE_URL = "https://mmewrudedcifohamfetc.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_18R7H_Wv4eFaX0Rk6vuBpw_ViBCVp8K";

const publicSupabaseSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

function resolvePublicSupabaseEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY,
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
