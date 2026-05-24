import { drizzle } from "drizzle-orm/libsql"
import "dotenv/config"
import { app } from "electron"
import path from "path"

const isProduction = app.isPackaged

const userDataPath = app.getPath("userData")
const databasePath = path.join(userDataPath, "database.db")

const dataBaseUrl = isProduction
  ? `file:${databasePath}`
  : `file:${process.env.DATABASE_URL}`

const db = drizzle({
  connection: {
    url: dataBaseUrl,
  },
})

export default db
