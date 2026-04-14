import "dotenv/config"
import { unlink } from "fs/promises"
import path from "path"

async function resetTestDatabase() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.log(
      "[resetTestDatabase] DATABASE_URL not found, nothing to delete.",
    )
    return
  }

  const databaseFilePath = path.resolve(databaseUrl)

  try {
    await unlink(databaseFilePath)
    console.log(
      `[resetTestDatabase] Deleted database file: ${databaseFilePath}`,
    )
  } catch (error) {
    if (error.code === "ENOENT") {
      return
    }

    throw error
  }
}

resetTestDatabase().catch(() => {
  console.error("[resetTestDatabase] Failed to reset test database", error)
  process.exitCode = 1
})
