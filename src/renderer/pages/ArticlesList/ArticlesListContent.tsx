import { type RefCallback } from "react"
import { useTranslation } from "react-i18next"
import { Rocket } from "lucide-react"
import { Skeleton } from "@/renderer/components/ui/skeleton"
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/renderer/components/ui/alert"
import { cn } from "@/renderer/lib/utils"
import type { ArticleWithFeed } from "@/shared/types/article"
import type { SyncResult } from "@/electron/services/feedSyncService"
import type { VirtualItem } from "@tanstack/react-virtual"
import ArticleRow from "./ArticleRow"

type ArticlesListContentProps = {
  activeProcess: { total: number; completed: number } | null
  articles: ArticleWithFeed[] | null
  fetchResult: SyncResult | null
  filterType: "all" | "unread"
  fromNow: (date: Date) => string
  hasMore: boolean
  inViewRef: RefCallback<HTMLDivElement>
  isLoadingMore: boolean
  isRestoring: boolean
  measureElement: (element: HTMLElement | null) => void
  onArticleClick: (article: ArticleWithFeed, index: number) => void
  totalSize: number
  virtualItems: VirtualItem[]
}

export default function ArticlesListContent({
  activeProcess,
  articles,
  fetchResult,
  filterType,
  fromNow,
  hasMore,
  inViewRef,
  isLoadingMore,
  isRestoring,
  measureElement,
  onArticleClick,
  totalSize,
  virtualItems,
}: ArticlesListContentProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center flex-col w-md mb-4">
      {activeProcess && activeProcess.total > 0 && (
        <Alert className="my-2">
          <Rocket />
          <AlertTitle>{t("fetchingFeedsTitle")}</AlertTitle>
          <AlertDescription>
            {t("fetchingFeeds", {
              completed: activeProcess.completed,
              total: activeProcess.total,
              percent: Math.round(
                (activeProcess.completed / activeProcess.total) * 100,
              ),
            })}
          </AlertDescription>
        </Alert>
      )}

      {articles && articles.length === 0 && (
        <>
          {fetchResult && fetchResult.allFeeds === 0 && (
            <p className="text-md text-gray-500 dark:text-gray-400">
              {t("tryAddingSomeFeeds")}
            </p>
          )}
          {fetchResult && fetchResult.allFeeds > 0 && (
            <p className="text-md text-gray-500 dark:text-gray-400">
              {t("noNewArticles")}
            </p>
          )}
        </>
      )}

      {articles && articles.length > 0 && (
        <div
          style={{
            height: `${totalSize}px`,
          }}
          className={cn("w-full relative", isRestoring && "opacity-0")}
        >
          {virtualItems.map((virtualItem) => {
            const article = articles[virtualItem.index]
            if (!article) return null

            return (
              <ArticleRow
                key={virtualItem.key}
                article={article}
                filterType={filterType}
                fromNow={fromNow}
                index={virtualItem.index}
                measureElement={measureElement}
                onClick={onArticleClick}
                top={virtualItem.start}
              />
            )
          })}
        </div>
      )}

      {!isLoadingMore && !isRestoring && hasMore && <div ref={inViewRef} />}

      {isLoadingMore && (
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
  )
}
