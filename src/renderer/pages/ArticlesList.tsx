import { useEffect, useState } from "react"
import { useArticleService, useFeedSyncService } from "@/renderer/hooks/useApi"
import useRelativeTime from "@/renderer/hooks/useRelativeTime"
import truncateText from "@/renderer/utils/truncateText"
import extractText from "@/renderer/utils/extractText"
import { RefreshCcw, ListFilter, Check } from "lucide-react"
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
import useScrollRestoration from "@/renderer/hooks/useScrollRestoration"
import { cn } from "@/renderer/lib/utils"
import type { ArticleWithFeed } from "@/shared/types/article"
import {
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenu,
  DropdownMenuItem,
} from "@/renderer/components/ui/dropdown-menu"
import { useDataStorage } from "@/renderer/hooks/useApi"
export default function ArticlesList() {
  const articleService = useArticleService()
  const feedSyncService = useFeedSyncService()
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState<"all" | "unread">("unread")
  const { t } = useTranslation()
  const { articles, setArticles } = useArticles()
  const dataStorage = useDataStorage()
  const navigate = useNavigate()
  const fromNow = useRelativeTime()
  useScrollRestoration("articles-list")
  const getArticles = async (ignoreRead: boolean) => {
    const articles = await articleService.getAll({
      includeFeeds: true,
      ignoreRead: ignoreRead,
    })
    if (articles.success) {
      setArticles(articles.data)
    } else {
      console.error(
        "Failed to fetch articles after syncing feeds:",
        articles.error,
      )
    }
  }
  const handleRefresh = async () => {
    setIsLoading(true)
    const result = await feedSyncService.syncFeeds()
    await getArticles(filter === "unread")
    //TODO: Show sync result in UI instead of console
    console.log(
      `Sync result: ${result.data.successCount} feeds synced successfully, ${result.data.errorCount} feeds failed to sync.`,
    )
    setIsLoading(false)
  }
  const handleArticleClick = (article: ArticleWithFeed) => {
    const encodeUrl = encodeURIComponent(article.id)
    navigate(`/article/${encodeUrl}`)
    setTimeout(() => {
      article.isRead = true
    }, 100)
  }
  const handleFilterChange = async (newFilter: "all" | "unread") => {
    if (newFilter === filter) return
    setFilter(newFilter)
    const result = await dataStorage.setFilterType(newFilter)
    if (!result.success) {
      console.error("Failed to save filter type:", result.error)
    }
    await getArticles(newFilter === "unread")
  }
  useEffect(() => {
    const fetchFilterType = async () => {
      const filterTypeResult = await dataStorage.getFilterType()
      if (filterTypeResult.success) {
        setFilter(filterTypeResult.data)
      } else {
        console.error("Failed to fetch filter type:", filterTypeResult.error)
      }
    }
    fetchFilterType()
  }, [dataStorage])
  return (
    <div>
      <div className="flex flex-col items-center pt-10">
        <div className="flex mb-5">
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
        <div className="w-md mb-1 ml-5">
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
                className={cn(filter === "all" && "font-bold")}
                onSelect={() => handleFilterChange("all")}
              >
                <Check
                  size={16}
                  className={filter === "all" ? "" : "opacity-0"}
                />
                {t("allArticles")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn(filter === "unread" && "font-bold")}
                onSelect={() => handleFilterChange("unread")}
              >
                <Check
                  size={16}
                  className={filter === "unread" ? "" : "opacity-0"}
                />
                {t("unreadArticles")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div>
          {!articles &&
            [1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex flex-col items-start p-5 mb-4 w-md rounded-lg bg-gray-200 dark:bg-neutral-700 animate-pulse"
              >
                <Skeleton className="w-[60%] h-6 mb-2" />
                <Skeleton className="w-[40%] h-4 mb-1" />
                <Skeleton className="w-[30%] h-3 mb-3" />
                <Skeleton className="w-full h-4" />
              </div>
            ))}
          {articles?.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("tryAddingSomeFeeds")}
            </p>
          )}
          {articles?.map((article) => (
            <button
              key={article.id}
              className={cn(
                "flex flex-col items-start p-5 mb-4 w-full min-w-sm max-w-md rounded-lg hover:shadow-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-250 cursor-pointer text-start",
                article.isRead && filter === "unread" && "opacity-60",
              )}
              onClick={() => handleArticleClick(article)}
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
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
