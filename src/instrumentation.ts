import type { Instrumentation } from "next";

// Host-collected structured logs: no cookies, query strings, PII or raw errors.
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const digest = error && typeof error === "object" && "digest" in error ? String(error.digest) : undefined;
  console.error(JSON.stringify({ event: "request_failed", digest, method: request.method,
    route: context.routePath, type: context.routeType, timestamp: new Date().toISOString() }));
};
