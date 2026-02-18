import ArticlesList from "@/renderer/pages/ArticlesList"
import Home from "@/renderer/pages/Home"
import MainLayout from "@/renderer/layouts/Main"
import Article from "@/renderer/pages/Article"

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
      {
        path: "article/:id",
        element: <Article />,
      },
    ],
  },
]

export default routes
