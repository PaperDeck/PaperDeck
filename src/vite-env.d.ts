import type { IpcBridge } from "@/electron/preload"

declare global {
  interface Window {
    ipcBridge: IpcBridge
  }
}
