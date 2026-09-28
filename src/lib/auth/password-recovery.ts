import { z } from "zod";

export const RECOVERY_PUBLIC_MESSAGE =
  "If an account exists for this email, we sent password reset instructions.";
export const RECOVERY_SESSION_ERROR =
  "This password reset link is invalid or expired. Request a new link to continue.";
export const RECOVERY_SUCCESS_PATH = "/auth/reset-password";
export const RECOVERY_RESTART_PATH = "/forgot-password?error=invalid_link";
export const RECOVERY_MARKER_COOKIE = "staypilot_recovery_session";
export const RECOVERY_MARKER_MAX_AGE_SECONDS = 15 * 60;

export const recoveryRequestSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(240),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(12, "Password must be at least 12 characters."),
    confirmation: z.string(),
  })
  .refine(({ password, confirmation }) => password === confirmation, {
    message: "Passwords do not match.",
    path: ["confirmation"],
  });

export type RecoveryState = {
  message?: string;
  fieldErrors?: { email?: string[] };
};

export type ResetState = {
  formError?: string;
  fieldErrors?: {
    password?: string[];
    confirmation?: string[];
  };
};

export function getCanonicalAppOrigin(
  environment: { NEXT_PUBLIC_APP_URL?: string; NODE_ENV?: string } = process.env,
) {
  const configured = environment.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) {
    if (environment.NODE_ENV !== "production") return "http://localhost:3000";
    throw new Error("Canonical application URL is not configured.");
  }

  const parsed = z.url().safeParse(configured);
  if (!parsed.success) throw new Error("Canonical application URL is invalid.");

  const url = new URL(parsed.data);
  const isLocalHttp = url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  if (url.username || url.password || (url.protocol !== "https:" && !isLocalHttp)) {
    throw new Error("Canonical application URL must use HTTPS.");
  }

  return url.origin;
}

export function buildRecoveryCallbackUrl(origin = getCanonicalAppOrigin()) {
  return new URL("/auth/recovery", origin).toString();
}

export function getRecoveryRedirectPath(input: {
  hasCode: boolean;
  exchangeSucceeded: boolean;
  redirectType: string | null;
}) {
  return input.hasCode && input.exchangeSucceeded && input.redirectType === "recovery"
    ? RECOVERY_SUCCESS_PATH
    : RECOVERY_RESTART_PATH;
}

export function createRecoveryMarker(userId: string, issuedAt = Date.now()) {
  return `${userId}.${issuedAt}`;
}

export function isValidRecoveryMarker(
  marker: string | undefined,
  userId: string,
  now = Date.now(),
) {
  if (!marker) return false;

  const separator = marker.lastIndexOf(".");
  if (separator < 1) return false;

  const markerUserId = marker.slice(0, separator);
  const issuedAt = Number(marker.slice(separator + 1));
  const age = now - issuedAt;

  return markerUserId === userId &&
    Number.isSafeInteger(issuedAt) &&
    age >= 0 &&
    age <= RECOVERY_MARKER_MAX_AGE_SECONDS * 1000;
}
