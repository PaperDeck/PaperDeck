import { prisma } from "@/electron/utils/prisma"
import type FeedItem from "@/shared/types/feedItem"

class ArticleService {
  async saveArticles(feedUrl: string, articles: FeedItem[]) {
    const operations = articles.map((article) => {
      const pubDate = article.isoDate ? new Date(article.isoDate) : undefined
      const articleId = article.guid ?? article.link ?? ""
      return prisma.article.upsert({
        where: { id: articleId },
        update: {
          title: article.title ?? "",
          summary: article.summary ?? article.contentSnippet ?? "",
          link: article.link ?? "",
          content: article["content:encoded"] ?? article.content ?? "",
          pubDate,
        },
        create: {
          id: articleId,
          title: article.title ?? "",
          link: article.link ?? "",
          summary: article.summary ?? article.contentSnippet ?? "",
          pubDate,
          isRead: false,
          content: article.content ?? "",
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
  async getArticlesByFeedUrl(feedUrl: string, limit = 50) {
    return prisma.article.findMany({
      where: { feedUrl },
      orderBy: { pubDate: "desc" },
      take: limit,
    })
  }
  async deleteAllArticlesByFeedUrl(feedUrl: string) {
    return prisma.article.deleteMany({
      where: { feedUrl },
    })
  }
  async getAll(
    prop: { includeFeeds: boolean; ignoreRead: boolean } = {
      includeFeeds: false,
      ignoreRead: false,
    },
  ) {
    const { includeFeeds, ignoreRead } = prop
    return prisma.article.findMany({
      orderBy: { pubDate: "desc" },
      include: {
        feed: includeFeeds,
      },
      where: {
        isRead: ignoreRead ? false : undefined,
      },
    })
  }
}

const articleService = new ArticleService()

export default articleService
