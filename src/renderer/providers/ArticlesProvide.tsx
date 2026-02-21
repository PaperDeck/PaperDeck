import ArticlesContext from "@/renderer/contexts/articlesContext"
import type { ArticleWithFeed } from "@/shared/types/article"
import { useEffect, useState } from "react"
import { useArticleService, useDataStorage } from "@/renderer/hooks/useApi"
type ArticlesProviderProps = {
  children: React.ReactNode
}

export default function ArticlesProvider({ children }: ArticlesProviderProps) {
  const [articles, setArticles] = useState<ArticleWithFeed[] | null>(null)
  const dataStorage = useDataStorage()
  const articleService = useArticleService()
  useEffect(() => {
    const fetchArticles = async () => {
      const filterTypeResult = await dataStorage.getFilterType()
      const articles = await articleService.getAll({
        includeFeeds: true,
        ignoreRead: filterTypeResult.data === "unread",
      })
      setArticles(articles.data)
    }
    fetchArticles()
  }, [articleService, dataStorage])
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
