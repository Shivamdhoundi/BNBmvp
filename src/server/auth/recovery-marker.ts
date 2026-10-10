import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getHealthcheckSecret } from "@/lib/env.server";
import { createRecoveryMarker, isValidRecoveryMarker } from "@/lib/auth/password-recovery";

function sign(payload: string) {
  return createHmac("sha256", getHealthcheckSecret()).update(`password-recovery:${payload}`).digest("hex");
}

export function createSignedRecoveryMarker(userId: string, now = Date.now()) {
  const payload = createRecoveryMarker(userId, now);
  return `${payload}.${sign(payload)}`;
}

export function isValidSignedRecoveryMarker(marker: string | undefined, userId: string, now = Date.now()) {
  if (!marker || marker.length > 256) return false;
  const separator = marker.lastIndexOf(".");
  if (separator < 0) return false;
  const payload = marker.slice(0, separator);
  const supplied = marker.slice(separator + 1);
  if (!/^[a-f0-9]{64}$/.test(supplied) || !isValidRecoveryMarker(payload, userId, now)) return false;
  return timingSafeEqual(Buffer.from(supplied, "hex"), Buffer.from(sign(payload), "hex"));
}
