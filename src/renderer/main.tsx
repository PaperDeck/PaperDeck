import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import {
  createHashRouter,
  RouterProvider,
  createBrowserRouter,
} from "react-router"
import "@/renderer/lib/i18n"
import routes from "@/renderer/routes"
import "@/renderer/style.css"
import { Toaster } from "react-hot-toast"

const router = import.meta.env.DEV
  ? createBrowserRouter(routes)
  : createHashRouter(routes)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Toaster />
    <RouterProvider router={router} />
  </StrictMode>,
)
