import { create } from "zustand"
import type { ArticleWithFeed } from "@/shared/types/article"
import {
  useArticleService,
  useDataStorage,
  useFeedSyncService,
} from "@/renderer/hooks/useApi"
import { useEffect } from "react"
import type { IpcBridge } from "@/electron/preload"
import { useState } from "react"
import type { SyncResult } from "@/electron/services/feedSyncService"

interface ArticlesState {
  articles: ArticleWithFeed[] | null
  hasInitialized: boolean
  setArticles: (articles: ArticleWithFeed[]) => void
  setHasInitialized: (value: boolean) => void
  getArticles: (prop: {
    articleService: IpcBridge["articleService"]
    ignoreRead: boolean
    cursor?: {
      id: string
      pubDate: Date
    }
    take?: number
    replace?: boolean
    append?: boolean
  }) => Promise<void>
  markArticleAsRead: (articleId: string) => Promise<void>
  hasMore: boolean
}

const useArticlesStore = create<ArticlesState>((set) => ({
  articles: null,
  hasInitialized: false,
  hasMore: false,
  setArticles: (articles) => set({ articles }),
  setHasInitialized: (value) => set({ hasInitialized: value }),
  getArticles: async (prop) => {
    const {
      articleService,
      ignoreRead,
      cursor,
      take,
      replace = false,
      append = true,
    } = prop
    const result = await articleService.getAll({
      includeFeeds: true,
      ignoreRead,
      cursor,
      take,
    })
    if (!result.success) {
      console.error("Failed to fetch articles:", result.error)
      return
    }
    set((state) => {
      const existingArticles = state.articles || []

      if (replace || !existingArticles.length) {
        return {
          articles: result.data.articles,
          hasMore: result.data.hasMore,
        }
      }

      const mergedArticles = Array.from(
        new Map(
          [...existingArticles, ...result.data.articles].map((a) => [a.id, a]),
        ).values(),
      )
      if (!append) {
        mergedArticles.sort(
          (a, b) =>
            new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
        )
      }
      return {
        articles: mergedArticles,
        hasMore: result.data.hasMore,
      }
    })
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

interface UseArticlesReturn extends ArticlesState {
  fetchResult: SyncResult | null
}

export default function useArticles(): UseArticlesReturn {
  const {
    articles,
    hasInitialized,
    setArticles,
    setHasInitialized,
    getArticles,
    markArticleAsRead,
    hasMore,
  } = useArticlesStore()
  const dataStorage = useDataStorage()
  const articleService = useArticleService()
  const feedSyncService = useFeedSyncService()
  const [fetchResult, setFetchResult] = useState(null)
  useEffect(() => {
    const initializeArticles = async () => {
      if (!hasInitialized) {
        const filterTypeResult = await dataStorage.getFilterType()
        const ignoreRead = filterTypeResult.data === "unread"

        await getArticles({ articleService, ignoreRead })

        feedSyncService.syncFeeds().then((result) => {
          setFetchResult(result.data)
          getArticles({ articleService, ignoreRead, append: false })
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
    fetchResult,
    hasMore,
  }
}
