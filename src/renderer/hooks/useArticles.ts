import { create } from "zustand"
import type { ArticleWithFeed } from "@/shared/types/article"
import {
  useArticleService,
  useDataStorage,
  useFeedSyncService,
} from "@/renderer/hooks/useApi"
import { useEffect } from "react"
import type { IpcBridge } from "@/electron/preload"
interface ArticlesState {
  articles: ArticleWithFeed[] | null
  hasInitialized: boolean
  setArticles: (articles: ArticleWithFeed[]) => void
  setHasInitialized: (value: boolean) => void
  getArticles: (
    articleService: IpcBridge["articleService"],
    ignoreRead: boolean,
  ) => Promise<void>
  markArticleAsRead: (articleId: string) => Promise<void>
}

const useArticlesStore = create<ArticlesState>((set) => ({
  articles: null,
  hasInitialized: false,
  setArticles: (articles) => set({ articles }),
  setHasInitialized: (value) => set({ hasInitialized: value }),
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
  const {
    articles,
    hasInitialized,
    setArticles,
    setHasInitialized,
    getArticles,
    markArticleAsRead,
  } = useArticlesStore()
  const dataStorage = useDataStorage()
  const articleService = useArticleService()
  const feedSyncService = useFeedSyncService()

  useEffect(() => {
    const initializeArticles = async () => {
      if (!hasInitialized) {
        const filterTypeResult = await dataStorage.getFilterType()
        const ignoreRead = filterTypeResult.data === "unread"

        await getArticles(articleService, ignoreRead)

        feedSyncService.syncFeeds().then(() => {
          getArticles(articleService, ignoreRead)
        })

        setHasInitialized(true)
      }
    }
    initializeArticles()
  }, [
    hasInitialized,
    articleService,
    dataStorage,
    feedSyncService,
    getArticles,
    setHasInitialized,
  ])

  return {
    articles,
    hasInitialized,
    setArticles,
    setHasInitialized,
    getArticles,
    markArticleAsRead,
  }
}
