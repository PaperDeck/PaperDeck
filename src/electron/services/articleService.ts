import { prisma } from "@/electron/utils/prisma"
import type FeedItem from "@/shared/types/feedItem"

class ArticleService {
  async saveArticles(feedUrl: string, articles: FeedItem[]) {
    const operations = articles.map((article) => {
      const pubDate = article.isoDate ? new Date(article.isoDate) : new Date()
      const articleId = article.guid ?? article.link ?? ""
      const newContent = article["content:encoded"] ?? article.content
      return prisma.article.upsert({
        where: { id: articleId },
        update: {
          title: article.title ?? "",
          summary: article.summary ?? article.contentSnippet ?? "",
          link: article.link ?? "",
          ...(newContent && { content: newContent }),
          pubDate,
        },
        create: {
          id: articleId,
          title: article.title ?? "",
          link: article.link ?? "",
          summary: article.summary ?? article.contentSnippet ?? "",
          pubDate,
          isRead: false,
          content: newContent ?? "",
          feed: {
            connect: { url: feedUrl },
          },
        },
      })
    })
    const results = await prisma.$transaction(operations)
    return results
  }
  async markArticleAsRead(articleId: string) {
    return prisma.article.update({
      where: { id: articleId },
      data: { isRead: true },
    })
  }
  async markAllArticlesAsRead() {
    return prisma.article.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    })
  }
  async deleteAllArticlesByFeedUrl(feedUrl: string) {
    return prisma.article.deleteMany({
      where: { feedUrl },
    })
  }
  async getArticleCotentById(articleId: string) {
    return prisma.article.findUnique({
      where: { id: articleId },
      select: { content: true },
    })
  }
  async getAll(
    prop: {
      includeFeeds: boolean
      ignoreRead: boolean
      cursor?: {
        id: string
        pubDate: Date
      }
      take?: number
    } = {
      includeFeeds: false,
      ignoreRead: false,
    },
  ) {
    const { includeFeeds, ignoreRead, cursor, take = 20 } = prop
    const result = await prisma.article.findMany({
      orderBy: [{ pubDate: "desc" }, { id: "desc" }],
      take: take + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor.id } : undefined,
      where: {
        isRead: ignoreRead ? false : undefined,
      },
      select: {
        id: true,
        title: true,
        summary: true,
        link: true,
        pubDate: true,
        isRead: true,
        feedUrl: true,
        ...(includeFeeds && {
          feed: {
            select: {
              title: true,
              url: true,
            },
          },
        }),
      },
    })
    const hasMore = result.length > take
    if (hasMore) {
      result.pop()
    }
    return {
      articles: result,
      hasMore,
    }
  }
}

const articleService = new ArticleService()

export default articleService
