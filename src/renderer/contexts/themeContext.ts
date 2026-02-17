import { createContext } from "react"
import type { IDataStorage } from "@/shared/types/dataStorage"

type ThemeProviderState = {
  theme: IDataStorage["theme"]
  setTheme: (theme: IDataStorage["theme"]) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export default ThemeProviderContext
