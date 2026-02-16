import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const emptyDbPath = path.join(__dirname, "../resources/empty.db")

try {
  if (fs.existsSync(emptyDbPath)) {
    fs.unlinkSync(emptyDbPath)
  }
  execSync("npx prisma db push", {
    env: {
      ...process.env,
      DATABASE_URL: `file:${emptyDbPath}`,
      stdio: "inherit",
    },
  })
} catch (error) {
  console.error("Error generating empty.db:", error)
  process.exit(1)
}
