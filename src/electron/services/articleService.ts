import { prisma } from "@/electron/utils/prisma"
import type { FeedItem } from "@/electron/services/feed/types"

class ArticleService {
  async saveArticles(feedUrl: string, articles: FeedItem[]) {
    const operations = articles.map((article) => {
      return prisma.article.upsert({
        where: { id: article.id },
        update: {
          title: article.title,
          summary: article.summary,
          link: article.link,
        },
        create: {
          id: article.id,
          title: article.title,
          link: article.link,
          summary: article.summary,
          pubDate: article.datePublished,
          isRead: false,
          feedUrl,
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
}

const articleService = new ArticleService()

export default articleService
