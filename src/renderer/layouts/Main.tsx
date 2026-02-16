import { Outlet } from "react-router"

export default function MainLayout() {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 h-screen overflow-auto">
      <Outlet></Outlet>
    </div>
  )
}
