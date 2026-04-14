import { defineConfig } from "drizzle-kit"
import "dotenv/config"

const dataBaseUrl = `${process.env.DATABASE_URL}`

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: dataBaseUrl,
  },
})
