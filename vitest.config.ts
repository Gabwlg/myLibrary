import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Test framework setup: see docs/adr/0002-vitest-as-test-framework.md for why
// Vitest (and why the v3 line), and why there is no DOM environment yet.
export default defineConfig({
  resolve: {
    // Mirror the `@/*` -> `src/*` alias from tsconfig.json so tests import the
    // same way the app code does.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
