import { useEffect, useState } from "react"
import { useArticleService, useFeedSyncService } from "@/renderer/hooks/useApi"
import type { Article, Feed } from "@/../generated/prisma/browser"
import useRelativeTime from "@/renderer/hooks/useRelativeTime"
import truncateText from "@/renderer/utils/truncateText"
import extractText from "@/renderer/utils/extractText"
import { RefreshCcw } from "lucide-react"
import IconButton from "@/renderer/components/IconButton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/renderer/components/ui/tooltip"
import { useTranslation } from "react-i18next"
import { Skeleton } from "@/renderer/components/ui/skeleton"

type ArticleWithFeed = Article & {
  feed: Feed
}
export default function ArticlesList() {
  const [articles, setArticles] = useState<ArticleWithFeed[] | null>(null)
  const articleService = useArticleService()
  const feedSyncService = useFeedSyncService()
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useTranslation()
  const fromNow = useRelativeTime()
  useEffect(() => {
    const fetchArticles = async () => {
      const articles = await articleService.getAll(true)
      setArticles(articles.data)
    }
    fetchArticles()
  }, [articleService])
  const handleRefresh = async () => {
    setIsLoading(true)
    const result = await feedSyncService.syncFeeds()
    //TODO: Show sync result in UI instead of console
    console.log(
      `Sync result: ${result.data.successCount} feeds synced successfully, ${result.data.errorCount} feeds failed to sync.`,
    )
    const articles = await articleService.getAll(true)
    if (articles.success) {
      setArticles(articles.data)
    } else {
      console.error(
        "Failed to fetch articles after syncing feeds:",
        articles.error,
      )
    }
    setIsLoading(false)
  }
  return (
    <div>
      <div className="flex flex-col items-center pt-10">
        <div className="flex mb-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton onClick={handleRefresh} disabled={isLoading}>
                <RefreshCcw
                  size={32}
                  className={isLoading ? "animate-spin opacity-50" : ""}
                />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>{t("refreshFeeds")}</TooltipContent>
          </Tooltip>
        </div>
        <ul>
          {!articles &&
            [1, 2, 3, 4, 5].map((i) => (
              <li
                key={i}
                className="flex flex-col items-start p-5 mb-4 w-md rounded-lg bg-gray-200 dark:bg-neutral-700 animate-pulse"
              >
                <Skeleton className="w-[60%] h-6 mb-2" />
                <Skeleton className="w-[40%] h-4 mb-1" />
                <Skeleton className="w-[30%] h-3 mb-3" />
                <Skeleton className="w-full h-4" />
              </li>
            ))}
          {articles?.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("tryAddingSomeFeeds")}
            </p>
          )}
          {articles?.map((article) => (
            <li
              key={article.id}
              className="flex flex-col items-start p-5 mb-4 w-full min-w-sm max-w-md rounded-lg hover:shadow-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-250 cursor-pointer"
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
                {truncateText(
                  extractText(article.summary || article.content || ""),
                  50,
                )}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
