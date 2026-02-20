import ArticlesContext from "@/renderer/contexts/articlesContext"
import { useContext } from "react"

const useArticles = () => {
  const context = useContext(ArticlesContext)

  if (context === undefined) {
    throw new Error("useArticles must be used within a ArticlesProvider")
  }
  return context
}

export default useArticles
