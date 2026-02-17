import ArticlesList from "@/renderer/pages/ArticlesList"
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
        element: <ArticlesList />,
      },
    ],
  },
]

export default routes
