import ArticlesList from "@/renderer/pages/ArticlesList"
import { Navigate } from "react-router"
import MainLayout from "@/renderer/layouts/Main"
import Article from "@/renderer/pages/Article"

const routes = [
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/articles" replace />,
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
