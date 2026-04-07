import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import electron from "vite-plugin-electron/simple"
import renderer from "vite-plugin-electron-renderer"
import path from "path"
import { fileURLToPath } from "url"
import tailwindcss from "@tailwindcss/vite"
import { createHtmlPlugin } from "vite-plugin-html"
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  root: path.join(__dirname, "src/renderer"),
  base: "./",
  plugins: [
    react(),
    electron({
      main: {
        entry: path.join(__dirname, "src/electron/main.ts"),
        onstart({ startup }) {
          startup([".", "--inspect"])
        },
        vite: {
          build: {
            outDir: path.join(__dirname, "dist/electron"),
            rollupOptions: {
              external: [
                "better-sqlite3",
                path.resolve(__dirname, "generated/prisma/client"),
              ],
            },
          },
          resolve: {
            alias: {
              "@": path.resolve(__dirname, "./src"),
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, "src/electron/preload.ts"),
        vite: {
          build: {
            outDir: path.join(__dirname, "dist/electron"),
            emptyOutDir: false,
          },
        },
      },
    }),
    createHtmlPlugin({
      minify: true,
    }),
    renderer(),
    tailwindcss(),
  ],
  build: {
    outDir: path.join(__dirname, "dist/renderer"),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
