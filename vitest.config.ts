/// <reference types="vitest" />
import { defineConfig } from "vitest/config"
import path from "node:path"

/**
 * Vitest config.
 *
 * Intentionally minimal — a single `tests/` glob with path aliases mirroring
 * tsconfig so tests can import from "@/lib/...". The node environment is
 * enough for the current suite; JSDOM can be added later when the first
 * component test lands.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**", "app/api/**"],
      exclude: ["**/*.test.ts", "**/*.d.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
