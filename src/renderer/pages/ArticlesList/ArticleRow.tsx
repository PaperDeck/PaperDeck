import { memo, useCallback } from "react"
import type { CSSProperties } from "react"
import { cn } from "@/renderer/lib/utils"
import type { ArticleWithFeed } from "@/shared/types/article"

type ArticleRowProps = {
  article: ArticleWithFeed
  top: number
  filterType: "all" | "unread"
  index: number
  onClick: (article: ArticleWithFeed, index: number) => void
  measureElement: (element: HTMLElement | null) => void
  fromNow: (date: Date) => string
}

function ArticleRowComponent({
  article,
  top,
  filterType,
  onClick,
  measureElement,
  index,
  fromNow,
}: ArticleRowProps) {
  const handleClick = useCallback(
    () => onClick(article, index),
    [onClick, article, index],
  )

  const style: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    transform: `translateY(${top}px)`,
  }
  return (
    <button
      className={cn(
        "flex flex-col items-start p-5 w-full rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-250 cursor-pointer text-start",
        article.isRead && filterType === "unread" && "opacity-60",
      )}
      style={style}
      onClick={handleClick}
      ref={measureElement}
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
}

const ArticleRow = memo(ArticleRowComponent, (prev, next) => {
  return (
    prev.article.id === next.article.id &&
    prev.article.isRead === next.article.isRead &&
    prev.filterType === next.filterType &&
    prev.index === next.index &&
    prev.top === next.top &&
    prev.fromNow === next.fromNow
  )
})

export default ArticleRow
