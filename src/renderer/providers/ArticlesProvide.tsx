import ArticlesContext from "@/renderer/contexts/articlesContext"
import type { ArticleWithFeed } from "@/shared/types/article"
import { useEffect, useState } from "react"
import { useArticleService } from "@/renderer/hooks/useApi"
type ArticlesProviderProps = {
  children: React.ReactNode
}

export default function ArticlesProvider({ children }: ArticlesProviderProps) {
  const [articles, setArticles] = useState<ArticleWithFeed[] | null>(null)
  const articleService = useArticleService()
  useEffect(() => {
    const fetchArticles = async () => {
      const articles = await articleService.getAll(true)
      setArticles(articles.data)
    }
    fetchArticles()
  }, [articleService])
  const value = {
    articles,
    setArticles,
  }
  return (
    <ArticlesContext.Provider value={value}>
      {children}
    </ArticlesContext.Provider>
  )
}
