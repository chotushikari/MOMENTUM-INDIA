import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(".") } },
  test: { include: ["tests/**/*.test.ts"] },
});

