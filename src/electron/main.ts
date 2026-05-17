import { app, BrowserWindow, ipcMain, Menu } from "electron"
import path from "path"
import { fileURLToPath } from "url"
import articleService from "@/electron/services/articleService"
import feedService from "@/electron/services/feedService"
import feedSyncService from "@/electron/services/feedSyncService"
import feedParser from "@/electron/services/feedParser"
import dataStorage from "@/electron/services/dataStorage"
import openInBrowser from "@/electron/utils/openInBrowser"
import importExportService from "@/electron/services/importExportService"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import db from "@/electron/utils/drizzle"
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
const unpackedPath = path.join(process.resourcesPath, "app.asar.unpacked")
const drizzlePath = app.isPackaged
  ? path.join(unpackedPath, "drizzle")
  : path.join(app.getAppPath(), "drizzle")
const resourcesPath = app.isPackaged
  ? path.join(unpackedPath, "resources")
  : path.join(app.getAppPath(), "resources")

function initDatabase() {
  try {
    console.log("Running database migrations...")
    migrate(db, {
      migrationsFolder: drizzlePath,
    })
    console.log("Database migrations completed successfully.")
  } catch (error) {
    console.error("Database migration failed:", error)
    app.quit()
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
    icon: path.join(resourcesPath, "icon.png"),
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
    Menu.setApplicationMenu(null)
  }
  registerService("articleService", articleService)
  registerService("feedService", feedService)
  registerService("feedSyncService", feedSyncService, {
    callbackBridges: {
      syncFeeds: {
        eventChannel: "feedSyncProgress",
      },
    },
  })
  registerService("dataStorage", dataStorage)
  registerService("importExportService", importExportService)
  registerFunction("feedParser", feedParser)
  registerFunction("openInBrowser", openInBrowser)

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

type CallbackBridge = {
  eventChannel: string
}

type RegisterServiceOptions<T> = {
  callbackBridges?: Partial<Record<Extract<keyof T, string>, CallbackBridge>>
}

function registerService<T>(
  channelName: string,
  service: T,
  options?: RegisterServiceOptions<T>,
) {
  ipcMain.handle(
    channelName,
    wrapHandler(
      async (
        event: {
          sender: { send: (channel: string, ...args: unknown[]) => void }
        },
        methodName: keyof T,
        ...args: Array<unknown>
      ): Promise<unknown> => {
        const method = service[methodName]
        if (typeof method !== "function") {
          throw new Error(`Method ${String(methodName)} not found on service`)
        }

        const methodNameStr = String(methodName) as Extract<keyof T, string>
        const callbackBridge = options?.callbackBridges?.[methodNameStr]

        if (callbackBridge) {
          const bridgedCallback = (...callbackArgs: Array<unknown>) => {
            event.sender.send(callbackBridge.eventChannel, ...callbackArgs)
          }
          return await method.apply(service, [...args, bridgedCallback])
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
