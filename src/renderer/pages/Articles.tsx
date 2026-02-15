import { useEffect, useState } from "react"
import { useArticleService } from "@/renderer/hooks/useApi"
import type { Article, Feed } from "@/../generated/prisma/browser"
import useRelativeTime from "../hooks/useRelativeTime"

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
          <>
            <div
              key={article.id}
              className="flex flex-col items-start p-5 mb-4 w-full max-w-md rounded-lg hover:shadow hover:bg-white transition-all duration-250 cursor-pointer"
            >
              <h2 className="text-xl mb-1">{article.title}</h2>
              <p className="text-sm text-gray-600 mb-0.5">
                {article.feed.title}
              </p>
              {article.pubDate && (
                <p className="text-sm text-gray-500">
                  {fromNow(article.pubDate)}
                </p>
              )}
              <p className="mt-3 text-base">{article.summary}</p>
            </div>
          </>
        ))}
      </div>
    </div>
  )
}
