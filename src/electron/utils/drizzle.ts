import { drizzle } from "drizzle-orm/better-sqlite3"
import "dotenv/config"
import { app } from "electron"
import path from "path"
import Database from "better-sqlite3"

const isProduction = app.isPackaged

const userDataPath = app.getPath("userData")
const databasePath = path.join(userDataPath, "database.db")

const dataBaseUrl = isProduction
  ? `${databasePath}`
  : `${process.env.DATABASE_URL}`

const sqlite = new Database(dataBaseUrl)

const db = drizzle({
  client: sqlite,
})

export default db
