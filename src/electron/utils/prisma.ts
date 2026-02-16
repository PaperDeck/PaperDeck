import "dotenv/config"
import { app } from "electron"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { PrismaClient, Prisma } from "@/../generated/prisma/client"
import path from "path"

const isProduction = app.isPackaged

const userDataPath = app.getPath("userData")
const databasePath = path.join(userDataPath, "database.db")

const connectionString = isProduction
  ? `file:${databasePath}`
  : `${process.env.DATABASE_URL}`

const adapter = new PrismaBetterSqlite3({ url: connectionString })
const prisma = new PrismaClient({ adapter })

export { prisma, Prisma }
