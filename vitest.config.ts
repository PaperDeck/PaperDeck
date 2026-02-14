import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      exclude: ["generated/**"],
    },
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": "./src",
    },
  },
})
