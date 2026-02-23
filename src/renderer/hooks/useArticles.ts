import { create } from "zustand"
import type { ArticleWithFeed } from "@/shared/types/article"
import { useArticleService, useDataStorage } from "@/renderer/hooks/useApi"
import { useEffect } from "react"
import type { IpcBridge } from "@/electron/preload"
interface ArticlesState {
  articles: ArticleWithFeed[] | null
  setArticles: (articles: ArticleWithFeed[]) => void
  getArticles: (
    articleService: IpcBridge["articleService"],
    ignoreRead: boolean,
  ) => Promise<void>
  markArticleAsRead: (articleId: string) => Promise<void>
}

const useArticlesStore = create<ArticlesState>((set) => ({
  articles: null,
  setArticles: (articles) => set({ articles }),
  getArticles: async (
    articleService: IpcBridge["articleService"],
    ignoreRead: boolean,
  ) => {
    const result = await articleService.getAll({
      includeFeeds: true,
      ignoreRead: ignoreRead,
    })

    if (!result.success) {
      console.error("Failed to fetch articles:", result.error)
      return
    }
    set({ articles: result.data })
  },
  markArticleAsRead: async (articleId: string) => {
    set((state) => {
      const updatedArticles =
        state.articles?.map((article) =>
          article.id === articleId ? { ...article, isRead: true } : article,
        ) || null
      return { articles: updatedArticles }
    })
  },
}))

export default function useArticles(): ArticlesState {
  const { articles, setArticles, getArticles, markArticleAsRead } =
    useArticlesStore()
  const dataStorage = useDataStorage()
  const articleService = useArticleService()
  useEffect(() => {
    const loadArticles = async () => {
      const filterTypeResult = await dataStorage.getFilterType()
      getArticles(articleService, filterTypeResult.data === "unread")
    }
    if (articles === null) {
      loadArticles()
    }
  }, [articleService, articles, dataStorage, getArticles])
  return {
    articles,
    setArticles,
    getArticles,
    markArticleAsRead,
  }
}
