import { useEffect, useState } from "react"
import ThemeProviderContext from "@/renderer/contexts/themeContext"
import type { IDataStorage } from "@/shared/types/dataStorage"
import { useDataStorage } from "@/renderer/hooks/useApi"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: IDataStorage["theme"]
  storageKey?: string
}

export default function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  const dataStorage = useDataStorage()

  const [theme, setTheme] = useState<IDataStorage["theme"]>("system")
  useEffect(() => {
    dataStorage.getTheme().then((storedTheme) => {
      if (storedTheme) {
        setTheme(storedTheme.data)
      }
    })
  }, [dataStorage])

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: IDataStorage["theme"]) => {
      dataStorage.setTheme(theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
