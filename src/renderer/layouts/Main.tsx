import { Outlet } from "react-router"

export default function MainLayout() {
  return (
    <div className="bg-zinc-50 h-screen">
      <Outlet></Outlet>
    </div>
  )
}
