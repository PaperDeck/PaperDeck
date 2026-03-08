import { useState, useCallback, memo, useLayoutEffect, useRef } from "react"
import { useArticleService, useFeedSyncService } from "@/renderer/hooks/useApi"
import useRelativeTime from "@/renderer/hooks/useRelativeTime"
import { RefreshCcw, ListFilter, Check, MailCheck } from "lucide-react"
import IconButton from "@/renderer/components/IconButton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/renderer/components/ui/tooltip"
import { useTranslation } from "react-i18next"
import { Skeleton } from "@/renderer/components/ui/skeleton"
import useArticles from "@/renderer/hooks/useArticles"
import { useNavigate } from "react-router"
import useScrollAreaRef from "@/renderer/hooks/useScrollAreaRef"
import { cn } from "@/renderer/lib/utils"
import type { ArticleWithFeed } from "@/shared/types/article"
import {
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenu,
  DropdownMenuItem,
} from "@/renderer/components/ui/dropdown-menu"
import useDataStorage from "@/renderer/hooks/useDataStorage"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogMedia,
} from "@/renderer/components/ui/alert-dialog"
import { useOnInView } from "react-intersection-observer"
import { useVirtualizer } from "@tanstack/react-virtual"

const ARTICLES_PAGE_INDEX_STORAGE_KEY = "articles_page"

const ArticleRow = memo(
  function ArticleRow({
    article,
    style,
    filterType,
    onClick,
    measureElement,
    index,
    fromNow,
  }: {
    article: ArticleWithFeed
    style: React.CSSProperties
    filterType: "all" | "unread"
    index: number
    onClick: (article: ArticleWithFeed, index: number) => void
    measureElement: (element: HTMLElement | null) => void
    fromNow: (date: Date) => string
  }) {
    const handleClick = useCallback(
      () => onClick(article, index),
      [onClick, article, index],
    )
    const rowRef = useRef<HTMLButtonElement>(null)

    useLayoutEffect(() => {
      if (rowRef.current) {
        measureElement(rowRef.current)
      }
    }, [measureElement, article.id])
    return (
      <button
        className={cn(
          "flex flex-col items-start p-5 w-full rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-250 cursor-pointer text-start",
          article.isRead && filterType === "unread" && "opacity-60",
        )}
        style={style}
        onClick={handleClick}
        ref={rowRef}
        data-index={index}
      >
        <h2 className="text-xl mb-1 text-gray-900 dark:text-gray-100">
          {article.title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-0.5">
          {article.feed.title}
        </p>
        {article.pubDate && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {fromNow(article.pubDate)}
          </p>
        )}
        <p className="mt-3 text-base text-gray-700 dark:text-gray-300">
          {article.preview || ""}
        </p>
      </button>
    )
  },
  (prev, next) => {
    return (
      prev.article.id === next.article.id &&
      prev.article.isRead === next.article.isRead &&
      prev.filterType === next.filterType &&
      prev.index === next.index &&
      prev.style === next.style
    )
  },
)

export default function ArticlesList() {
  const articleService = useArticleService()
  const feedSyncService = useFeedSyncService()
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { t } = useTranslation()
  const { articles, getArticles, fetchResult, setArticles, hasMore } =
    useArticles()
  const { setFilterType, filterType } = useDataStorage()
  const navigate = useNavigate()
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isRestoring, setIsRestoring] = useState(true)
  const handleMarkAllAsRead = async () => {
    const result = await articleService.markAllArticlesAsRead()
    if (result.success) {
      setArticles([])
    } else {
      console.error("Failed to mark all articles as read:", result.error)
    }
  }
  const handleRefresh = async () => {
    setIsLoading(true)
    const result = await feedSyncService.syncFeeds()
    await getArticles({
      articleService,
      ignoreRead: filterType === "unread",
      append: false,
    })
    //TODO: Show sync result in UI instead of console
    console.log(
      `Sync result: ${result.data.successCount} feeds synced successfully, ${result.data.errorCount} feeds failed to sync.`,
    )
    setIsLoading(false)
  }
  const handleArticleClick = useCallback(
    (article: ArticleWithFeed, index: number) => {
      sessionStorage.setItem(ARTICLES_PAGE_INDEX_STORAGE_KEY, String(index))
      const encodeUrl = encodeURIComponent(article.id)
      navigate(`/article/${encodeUrl}`)
    },
    [navigate],
  )
  const handleFilterChange = async (newFilter: "all" | "unread") => {
    if (newFilter === filterType) return
    setFilterType(newFilter)
    await getArticles({
      articleService,
      ignoreRead: newFilter === "unread",
      replace: true,
    })
  }
  const handleLoadMore = async () => {
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
  }
  const fromNow = useRelativeTime()
  const inViewRef = useOnInView(async (inView) => {
    if (inView) {
      await handleLoadMore()
    }
  })
  const scrollAreaRef = useScrollAreaRef()
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: articles ? articles.length : 0,
    getScrollElement: () => scrollAreaRef.current,
    estimateSize: () => 200,
    overscan: 10,
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
  return (
    <div className="flex flex-col items-center pt-10">
      <div className="flex mb-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton
              onClick={handleRefresh}
              disabled={isLoading || !fetchResult}
            >
              <RefreshCcw
                size={32}
                className={
                  isLoading || !fetchResult ? "animate-spin opacity-50" : ""
                }
              />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent>{t("refreshFeeds")}</TooltipContent>
        </Tooltip>
      </div>
      <div className="flex gap-1 w-md mb-1 ml-5">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <IconButton>
                  <ListFilter size={24} />
                </IconButton>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>{t("filterArticles")}</TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            className="flex flex-col whitespace-nowrap w-40"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DropdownMenuItem
              className={cn(filterType === "all" && "font-bold")}
              onSelect={() => handleFilterChange("all")}
            >
              <Check
                size={16}
                className={filterType === "all" ? "" : "opacity-0"}
              />
              {t("allArticles")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className={cn(filterType === "unread" && "font-bold")}
              onSelect={() => handleFilterChange("unread")}
            >
              <Check
                size={16}
                className={filterType === "unread" ? "" : "opacity-0"}
              />
              {t("unreadArticles")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip>
          <TooltipTrigger
            asChild
            className={cn(
              (filterType === "all" || !articles || articles.length === 0) &&
                "hidden",
            )}
          >
            <IconButton onClick={() => setIsDialogOpen(true)}>
              <MailCheck size={24} />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent>{t("markAllRead")}</TooltipContent>
        </Tooltip>
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogMedia>
                <MailCheck />
              </AlertDialogMedia>
              <AlertDialogTitle>{t("areYouSure")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("markAllAsReadConfirmation")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleMarkAllAsRead}>
                {t("confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="flex items-center flex-col w-md mb-4">
        {articles && articles.length === 0 && (
          <>
            {fetchResult && fetchResult.allFeeds === 0 ? (
              <p className="text-md text-gray-500 dark:text-gray-400">
                {t("tryAddingSomeFeeds")}
              </p>
            ) : (
              <p className="text-md text-gray-500 dark:text-gray-400">
                {t("noNewArticles")}
              </p>
            )}
          </>
        )}
        {articles && articles.length > 0 && (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
            }}
            className={cn("w-full relative", isRestoring && "opacity-0")}
          >
            {virtualItems.map((virtualItem) => {
              const article = articles[virtualItem.index]
              return (
                <ArticleRow
                  key={virtualItem.key}
                  article={article}
                  filterType={filterType}
                  onClick={handleArticleClick}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  measureElement={virtualizer.measureElement}
                  index={virtualItem.index}
                  fromNow={fromNow}
                />
              )
            })}
          </div>
        )}
        {!isLoadingMore && !isRestoring && hasMore && (
          <div ref={inViewRef}></div>
        )}
        {(isLoadingMore || !fetchResult) && (
          <div className="flex flex-col w-full gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                className="flex flex-col items-start p-5 w-full rounded-lg bg-gray-200 dark:bg-neutral-700 animate-pulse"
                key={i}
              >
                <Skeleton className="w-[60%] h-6 mb-2" />
                <Skeleton className="w-[40%] h-4 mb-1" />
                <Skeleton className="w-[30%] h-3 mb-3" />
                <Skeleton className="w-full h-4" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
