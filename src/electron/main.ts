import { app, BrowserWindow, ipcMain } from "electron"
import path from "path"
import { fileURLToPath } from "url"
import articleService from "@/electron/services/articleService"
import feedService from "@/electron/services/feedService"
import feedSyncService from "@/electron/services/feedSyncService"
import feedParser from "@/electron/services/feedParser"
import fs from "fs"
import dataStorage from "@/electron/services/dataStorage"
import openInBrowser from "@/electron/utils/openInBrowser"
import fetchImage from "@/electron/utils/fetchImage"
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export type ServiceResponse<T = unknown> =
  | { success: true; data: T; error: null }
  | {
      success: false
      data: null
      error: {
        message: string
        code?: string | number
        details?: unknown
        stack?: string | undefined
      }
    }

const isProduction = app.isPackaged
const userDataPath = app.getPath("userData")
const databasePath = path.join(userDataPath, "database.db")
const resourcePath = path.join(
  process.resourcesPath,
  "app.asar.unpacked",
  "resources",
)

function initDatabase() {
  if (fs.existsSync(databasePath)) {
    return
  }
  try {
    const emptyDbPath = path.join(resourcePath, "empty.db")
    fs.copyFileSync(emptyDbPath, databasePath)
    fs.chmodSync(databasePath, 0o600)
  } catch (err) {
    console.error("Failed to initialize database:", err)
  }
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.mjs"),
      spellcheck: false,
    },
  })
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"))
  }
}

app.whenReady().then(() => {
  if (isProduction) {
    initDatabase()
  }
  registerService("articleService", articleService)
  registerService("feedService", feedService)
  registerService("feedSyncService", feedSyncService)
  registerFunction("feedParser", feedParser)
  registerFunction("openInBrowser", openInBrowser)
  registerFunction("fetchImage", fetchImage)
  registerService("dataStorage", dataStorage)

  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

function wrapHandler<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (...args: any[]) => any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (...args: any[]) => Promise<ServiceResponse<T>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (...args: any[]): Promise<ServiceResponse<T>> => {
    try {
      const result = await handler(...args)
      return {
        success: true,
        data: result,
        error: null,
      }
    } catch (err) {
      let errorCode = undefined
      let errorDetails = undefined
      let stackTrace = undefined
      if (err instanceof Error) {
        stackTrace = err.stack
      }
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (typeof err.code === "string" || typeof err.code === "number")
      ) {
        errorCode = err.code
      }
      if (typeof err === "object" && err !== null && "details" in err) {
        errorDetails = err.details
      }
      return {
        success: false,
        data: null,
        error: {
          message: err instanceof Error ? err.message : String(err),
          code: errorCode || "UNKNOWN_ERROR",
          details: errorDetails,
          stack: stackTrace,
        },
      }
    }
  }
}

function registerService<T>(channelName: string, service: T) {
  ipcMain.handle(
    channelName,
    wrapHandler(
      async (
        _event: unknown,
        methodName: keyof T,
        ...args: Array<unknown>
      ): Promise<unknown> => {
        const method = service[methodName]
        if (typeof method !== "function") {
          throw new Error(`Method ${String(methodName)} not found on service`)
        }
        return await method.apply(service, args)
      },
    ),
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function registerFunction<T extends (...args: any[]) => any>(
  channelName: string,
  func: T,
) {
  ipcMain.handle(
    channelName,
    wrapHandler(async (_event: unknown, ...args: Parameters<T>) => {
      return await func(...args)
    }),
  )
}
