import type { Article, Feed } from "@/../generated/prisma/browser"

export interface ArticleWithFeed extends Article {
  feed: Feed
}
