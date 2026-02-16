import { vi } from "vitest"
import type { App } from "electron"

vi.mock(import("electron"), async () => {
  return {
    app: {
      isPackaged: false,
      getPath: (name: string) => {
        return `mocked_path_for_${name}`
      },
    } as App,
  }
})
