import type { Article, Feed } from "@/../generated/prisma/browser"

export type ArticleWithFeed = Article & {
  feed: Feed
}
