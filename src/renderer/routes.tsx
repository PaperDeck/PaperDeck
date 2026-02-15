import Articles from "@/renderer/pages/Articles"
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
      {
        path: "articles",
        element: <Articles />,
      },
    ],
  },
]

export default routes
