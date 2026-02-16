import Store from "electron-store"
import type { IDataStorage } from "@/shared/types/dataStorage"

const schema = {
  theme: {
    type: "string",
    enum: ["light", "dark", "system"],
    default: "system",
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
}

export default new DataStorage()
