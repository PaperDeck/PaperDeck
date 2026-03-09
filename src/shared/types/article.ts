import type { Article, Feed } from "@/../generated/prisma/browser"

export type ArticleWithFeed = Omit<Article, "content"> & {
  feed: Feed
  content?: string
  preview?: string
}
