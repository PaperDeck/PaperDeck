import { defineConfig } from "vitest/config"
import dotenv from "dotenv"

dotenv.config({
  path: ".env.test",
})

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      exclude: ["generated/**"],
    },
    fileParallelism: false,
    setupFiles: ["./tests/setup.ts"],
    env: process.env,
  },
  resolve: {
    alias: {
      "@": "./src",
    },
  },
})
