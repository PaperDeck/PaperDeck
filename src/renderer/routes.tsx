import Home from "@/renderer/pages/Home"
import MainLayout from "@/renderer/layouts/Main"

const routes = [
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
    ],
  },
]

export default routes
