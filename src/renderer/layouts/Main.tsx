import { Outlet } from "react-router"
import { ScrollArea } from "@/renderer/components/ui/scroll-area"

export default function MainLayout() {
  return (
    <ScrollArea className="bg-zinc-50 dark:bg-zinc-900 h-screen overflow-auto">
      <Outlet></Outlet>
    </ScrollArea>
  )
}
