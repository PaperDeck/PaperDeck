import { useState, useCallback, useLayoutEffect } from "react"
import { useArticleService } from "@/renderer/hooks/useApi"
import useRelativeTime from "@/renderer/hooks/useRelativeTime"
import useArticles from "@/renderer/hooks/useArticles"
import { useNavigate } from "react-router"
import useScrollAreaRef from "@/renderer/hooks/useScrollAreaRef"
import type { ArticleWithFeed } from "@/shared/types/article"
import useDataStorage from "@/renderer/hooks/useDataStorage"
import { useOnInView } from "react-intersection-observer"
import { useVirtualizer } from "@tanstack/react-virtual"
import ArticlesToolbar from "./ArticlesList/ArticlesToolbar"
import ArticlesListContent from "./ArticlesList/ArticlesListContent"

const ARTICLES_PAGE_INDEX_STORAGE_KEY = "articles_page"

export default function ArticlesList() {
  const articleService = useArticleService()
  const [isLoading, setIsLoading] = useState(false)
  const {
    articles,
    getArticles,
    fetchArticles,
    fetchResult,
    setArticles,
    hasMore,
    syncProcess,
  } = useArticles()
  const { setFilterType, filterType } = useDataStorage()
  const navigate = useNavigate()
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isRestoring, setIsRestoring] = useState(true)
  const activeProcess = syncProcess.total > 0 ? syncProcess : null

  const handleMarkAllAsRead = useCallback(async () => {
    const result = await articleService.markAllArticlesAsRead()
    if (result.success) {
      setArticles([])
    } else {
      console.error("Failed to mark all articles as read:", result.error)
    }
  }, [articleService, setArticles])

  const handleRefresh = useCallback(async () => {
    setIsLoading(true)
    await fetchArticles({
      preloadBeforeSync: false,
      replace: false,
      append: false,
    })
    setIsLoading(false)
  }, [fetchArticles])

  const handleArticleClick = useCallback(
    (article: ArticleWithFeed, index: number) => {
      sessionStorage.setItem(ARTICLES_PAGE_INDEX_STORAGE_KEY, String(index))
      const encodeUrl = encodeURIComponent(article.id)
      navigate(`/article/${encodeUrl}`)
    },
    [navigate],
  )
  const handleFilterChange = useCallback(
    async (newFilter: "all" | "unread") => {
      if (newFilter === filterType) return
      setFilterType(newFilter)
      await getArticles({
        articleService,
        ignoreRead: newFilter === "unread",
        replace: true,
      })
    },
    [articleService, filterType, getArticles, setFilterType],
  )

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    await getArticles({
      articleService,
      ignoreRead: filterType === "unread",
      cursor:
        articles && articles.length > 0
          ? {
              id: articles[articles.length - 1].id,
              pubDate: articles[articles.length - 1].pubDate,
            }
          : undefined,
    })
    setIsLoadingMore(false)
  }, [
    isLoadingMore,
    hasMore,
    getArticles,
    articleService,
    filterType,
    articles,
  ])

  const handleSettingsClick = useCallback(() => {
    navigate("/settings")
  }, [navigate])

  const fromNow = useRelativeTime()
  const inViewRef = useOnInView(
    useCallback(
      async (inView) => {
        if (inView) {
          await handleLoadMore()
        }
      },
      [handleLoadMore],
    ),
  )
  const scrollAreaRef = useScrollAreaRef()
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: articles ? articles.length : 0,
    getScrollElement: () => scrollAreaRef.current,
    estimateSize: () => 200,
    overscan: 5,
  })
  const virtualItems = virtualizer.getVirtualItems()
  useLayoutEffect(() => {
    const index = Number(
      sessionStorage.getItem(ARTICLES_PAGE_INDEX_STORAGE_KEY),
    )
    if (isNaN(index) || index <= 0) {
      setIsRestoring(false)
      return
    }
    virtualizer.scrollToIndex(index, { align: "start" })
    const timeoutId = setTimeout(() => {
      setIsRestoring(false)
      sessionStorage.removeItem(ARTICLES_PAGE_INDEX_STORAGE_KEY)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [virtualizer])
  const handleNewFeedAdded = useCallback(() => {
    getArticles({
      articleService,
      ignoreRead: filterType === "unread",
      replace: true,
    })
  }, [articleService, filterType, getArticles])

  return (
    <div className="flex flex-col items-center pt-10">
      <ArticlesToolbar
        articleCount={articles?.length ?? 0}
        fetchResult={fetchResult}
        filterType={filterType}
        isLoading={isLoading}
        onFilterChange={handleFilterChange}
        onMarkAllAsRead={handleMarkAllAsRead}
        onRefresh={handleRefresh}
        handleSettingsClick={handleSettingsClick}
        handleNewFeedAdded={handleNewFeedAdded}
      />
      <ArticlesListContent
        activeProcess={activeProcess}
        articles={articles}
        fetchResult={fetchResult}
        filterType={filterType}
        fromNow={fromNow}
        hasMore={hasMore}
        inViewRef={inViewRef}
        isLoadingMore={isLoadingMore}
        isRestoring={isRestoring}
        measureElement={virtualizer.measureElement}
        onArticleClick={handleArticleClick}
        totalSize={virtualizer.getTotalSize()}
        virtualItems={virtualItems}
      />
    </div>
  )
}
