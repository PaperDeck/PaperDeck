import { Outlet, useLocation } from "react-router"
import { ScrollArea } from "@/renderer/components/ui/scroll-area"
import { useEffect, useRef } from "react"

export default function MainLayout() {
  const { pathname } = useLocation()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const ignoredPathnames = ["/articles"]
  useEffect(() => {
    if (ignoredPathnames.includes(pathname)) {
      return
    }
    scrollAreaRef.current?.scrollTo(0, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, scrollAreaRef])
  return (
    <ScrollArea
      ref={scrollAreaRef}
      className="bg-zinc-50 dark:bg-zinc-900 h-screen overflow-auto"
    >
      <Outlet></Outlet>
    </ScrollArea>
  )
}
