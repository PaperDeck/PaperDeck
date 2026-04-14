import type { Article, Feed } from "@/schema"

export type ArticleWithFeed = Omit<Article, "content"> & {
  feed: Feed
  content?: string
  preview?: string
}
