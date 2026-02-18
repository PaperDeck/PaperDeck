import type { Article } from "@/../generated/prisma/browser"
import type FeedItem from "@/shared/types/feedItem"

export type ArticleWithFeed = Article & {
  feed: FeedItem
}
