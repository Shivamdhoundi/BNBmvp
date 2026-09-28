import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Integration/RLS/E2E suites live outside unit scope and require a
    // disposable test Supabase project; they must never run against production.
    exclude: ["node_modules/**", ".next/**", "tests/integration/**", "tests/e2e/**"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
