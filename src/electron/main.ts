import { app, BrowserWindow, ipcMain } from "electron"
import path from "node:path"
import { fileURLToPath } from "node:url"
import articleService from "@/electron/services/articleService"
import feedService from "@/electron/services/feedService"
import feedSyncService from "@/electron/services/feedSyncService"
import feedParser from "./services/feed/parser"
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.mjs"),
    },
  })
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"))
  }
}

app.whenReady().then(() => {
  registerService("articleService", articleService)
  registerService("feedService", feedService)
  registerService("feedSyncService", feedSyncService)
  ipcMain.handle("feedParser", async (_event, url: string) => {
    return await feedParser(url)
  })

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

function registerService<T>(channelName: string, service: T) {
  ipcMain.handle(
    channelName,
    (_event: unknown, methodName: keyof T, ...args: Array<unknown>) => {
      if (service && typeof service[methodName] === "function") {
        try {
          return service[methodName](...args)
        } catch (err) {
          console.error(
            `Service Error [${channelName}.${String(methodName)}]:`,
            err,
          )
          throw err
        }
      }
      throw new Error(
        `Method ${String(methodName)} not found on ${channelName}`,
      )
    },
  )
}
