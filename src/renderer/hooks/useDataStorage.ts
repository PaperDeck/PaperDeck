import type { IDataStorage } from "@/shared/types/dataStorage"
import { create } from "zustand"
import * as api from "@/renderer/hooks/useApi"
import type { IpcBridge } from "@/electron/preload"
import { useEffect } from "react"

interface DataStorageState extends IDataStorage {
  setTheme: (
    theme: IDataStorage["theme"],
    dataStorage: IpcBridge["dataStorage"],
  ) => void
  setFilterType: (
    filterType: IDataStorage["filterType"],
    dataStorage: IpcBridge["dataStorage"],
  ) => void
}

const useDataStorageStore = create<DataStorageState>((set) => ({
  theme: (localStorage.getItem("theme") as IDataStorage["theme"]) || "system",
  filterType:
    (localStorage.getItem("filterType") as IDataStorage["filterType"]) ||
    "unread",
  setTheme: (theme, dataStorage) => {
    localStorage.setItem("theme", theme)
    dataStorage.setTheme(theme)
    set({ theme })
  },
  setFilterType: (filterType, dataStorage) => {
    localStorage.setItem("filterType", filterType)
    dataStorage.setFilterType(filterType)
    set({ filterType })
  },
}))

export default function useDataStorage() {
  const { theme, filterType, setTheme, setFilterType } = useDataStorageStore()
  const dataStorage = api.useDataStorage()
  useEffect(() => {
    dataStorage.getTheme().then((storedTheme) => {
      if (storedTheme.success) {
        setTheme(storedTheme.data, dataStorage)
      } else {
        console.error(
          "Failed to get theme from data storage:",
          storedTheme.error,
        )
      }
    })
    dataStorage.getFilterType().then((storedFilterType) => {
      if (storedFilterType.success) {
        setFilterType(storedFilterType.data, dataStorage)
      } else {
        console.error(
          "Failed to get filter type from data storage:",
          storedFilterType.error,
        )
      }
    })
  }, [dataStorage, setTheme, setFilterType])
  return {
    theme,
    filterType,
    setTheme: (theme: IDataStorage["theme"]) => setTheme(theme, dataStorage),
    setFilterType: (filterType: IDataStorage["filterType"]) =>
      setFilterType(filterType, dataStorage),
  }
}
