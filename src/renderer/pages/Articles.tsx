import { useEffect, useState } from "react"
import { useArticleService } from "@/renderer/hooks/useApi"
import type { Article, Feed } from "@/../generated/prisma/browser"
import useRelativeTime from "../hooks/useRelativeTime"
import truncateText from "@/renderer/utils/truncateText"
import extractText from "@/renderer/utils/extractText"

type ArticleWithFeed = Article & {
  feed: Feed
}
export default function Articles() {
  const [articles, setArticles] = useState<ArticleWithFeed[]>([])
  const articleService = useArticleService()
  const fromNow = useRelativeTime()
  useEffect(() => {
    const fetchArticles = async () => {
      const articles = await articleService.getAll(true)
      setArticles(articles.data)
    }
    fetchArticles()
  }, [articleService])
  return (
    <div>
      <div className="flex flex-col items-center pt-10">
        {articles.map((article) => (
          <div
            key={article.id}
            className="flex flex-col items-start p-5 mb-4 w-full max-w-md rounded-lg hover:shadow-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-250 cursor-pointer"
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
          </div>
        ))}
      </div>
    </div>
  )
}
