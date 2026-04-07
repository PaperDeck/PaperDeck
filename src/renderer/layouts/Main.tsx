import { Outlet, useLocation } from "react-router"
import { ScrollArea } from "@/renderer/components/ui/scroll-area"
import { useEffect } from "react"
import useDataStorage from "@/renderer/hooks/useDataStorage"
import useScrollAreaRef from "@/renderer/hooks/useScrollAreaRef"

export default function MainLayout() {
  const { pathname } = useLocation()
  const scrollAreaRef = useScrollAreaRef()
  const ignoredPathnames = ["/articles"]
  const { theme } = useDataStorage()
  useEffect(() => {
    if (ignoredPathnames.includes(pathname)) {
      return
    }
    scrollAreaRef.current?.scrollTo(0, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, scrollAreaRef])
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
  return (
    <ScrollArea className="bg-zinc-50 dark:bg-zinc-900 h-screen" horizontal>
      <Outlet></Outlet>
    </ScrollArea>
  )
}
