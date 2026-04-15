import { create } from "zustand"
import type { ArticleWithFeed } from "@/shared/types/article"
import {
  useArticleService,
  useDataStorage,
  useFeedSyncService,
} from "@/renderer/hooks/useApi"
import { useCallback, useEffect } from "react"
import type { IpcBridge } from "@/electron/preload"
import type { SyncResult } from "@/electron/services/feedSyncService"
import { useRef } from "react"
import { useFeedService } from "@/renderer/hooks/useApi"

interface FetchArticlesOptions {
  preloadBeforeSync?: boolean
  replace?: boolean
  append?: boolean
}

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
      pubDate: Date | string
    }
    take?: number
    replace?: boolean
    append?: boolean
  }) => Promise<void>
  markArticleAsRead: (articleId: string) => Promise<void>
  markArticleAsUnread: (articleId: string) => Promise<void>
  hasMore: boolean
  setFetchResult: (result: SyncResult) => void
  fetchResult: SyncResult | null
  syncProcess: {
    total: number
    completed: number
  }
  setSyncProcess: (total: number, completed: number) => void
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
      summaryPreview: {
        length: 100,
      },
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
  setFetchResult: (result) => set({ fetchResult: result }),
  fetchResult: null,
  syncProcess: {
    total: 0,
    completed: 0,
  },
  setSyncProcess: (total, completed) =>
    set({ syncProcess: { total, completed } }),
  markArticleAsUnread: async (articleId: string) => {
    set((state) => {
      const updatedArticles =
        state.articles?.map((article) =>
          article.id === articleId ? { ...article, isRead: false } : article,
        ) || null
      return { articles: updatedArticles }
    })
  },
}))

interface UseArticlesReturn extends ArticlesState {
  fetchResult: SyncResult | null
  fetchArticles: (options?: FetchArticlesOptions) => Promise<void>
}

export default function useArticles(): UseArticlesReturn {
  const initRef = useRef(false)
  const {
    articles,
    hasInitialized,
    setArticles,
    setHasInitialized,
    getArticles,
    markArticleAsRead,
    hasMore,
    setFetchResult,
    fetchResult,
    setSyncProcess,
    syncProcess,
    markArticleAsUnread,
  } = useArticlesStore()
  const dataStorage = useDataStorage()
  const articleService = useArticleService()
  const feedSyncService = useFeedSyncService()
  const feedService = useFeedService()

  const fetchArticles = useCallback(
    async (options: FetchArticlesOptions = {}) => {
      const {
        preloadBeforeSync = false,
        replace = true,
        append = false,
      } = options

      const filterTypeResult = await dataStorage.getFilterType()
      const ignoreRead = filterTypeResult.data === "unread"

      if (preloadBeforeSync) {
        await getArticles({
          articleService,
          ignoreRead,
          replace,
          append,
        })
      }

      const feedsResult = await feedService.getFeeds()
      if (!feedsResult.success) {
        console.error(
          "Failed to fetch feeds before syncing:",
          feedsResult.error,
        )
        return
      }
      const totalFeeds = feedsResult.data.length

      setSyncProcess(totalFeeds, 0)
      const syncResult = await feedSyncService.syncFeeds(setSyncProcess)
      setFetchResult(syncResult.data)

      const latestFilterTypeResult = await dataStorage.getFilterType()
      const latestIgnoreRead = latestFilterTypeResult.data === "unread"

      await getArticles({
        articleService,
        ignoreRead: latestIgnoreRead,
        replace,
        append,
      })

      setSyncProcess(0, 0)
    },
    [
      articleService,
      dataStorage,
      feedService,
      feedSyncService,
      getArticles,
      setFetchResult,
      setSyncProcess,
    ],
  )

  useEffect(() => {
    const initializeArticles = async () => {
      await fetchArticles({
        preloadBeforeSync: true,
        replace: false,
        append: false,
      })
    }
    if (!hasInitialized && !initRef.current) {
      setHasInitialized(true)
      initRef.current = true
      initializeArticles()
    }
  }, [
    hasInitialized,
    articleService,
    dataStorage,
    feedSyncService,
    getArticles,
    setHasInitialized,
    setFetchResult,
    setSyncProcess,
    fetchArticles,
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
    setFetchResult,
    syncProcess,
    setSyncProcess,
    fetchArticles,
    markArticleAsUnread,
  }
}
