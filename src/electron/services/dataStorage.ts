import Store from "electron-store"
import type { IDataStorage } from "@/shared/types/dataStorage"

const schema = {
  theme: {
    type: "string",
    enum: ["light", "dark", "system"],
    default: "system",
  },
  filterType: {
    type: "string",
    enum: ["all", "unread"],
    default: "unread",
  },
  autoUpdate: {
    type: "boolean",
    default: true,
  },
}

class DataStorage {
  private store: Store<IDataStorage>
  constructor() {
    this.store = new Store<IDataStorage>({ schema })
  }
  getTheme() {
    return this.store.get("theme")
  }
  setTheme(theme: IDataStorage["theme"]) {
    this.store.set("theme", theme)
  }
  getFilterType() {
    return this.store.get("filterType")
  }
  setFilterType(filterType: IDataStorage["filterType"]) {
    this.store.set("filterType", filterType)
  }
  getAutoUpdate() {
    return this.store.get("autoUpdate")
  }
  setAutoUpdate(autoUpdate: IDataStorage["autoUpdate"]) {
    this.store.set("autoUpdate", autoUpdate)
  }
}

export default new DataStorage()
