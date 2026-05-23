import db from "@/electron/utils/drizzle"
import { article, feed } from "@/schema"
import type { ArticleWithFeed } from "@/shared/types/article"
import type FeedItem from "@/shared/types/feedItem"
import truncateText from "@/shared/utils/truncateText"
import extractText from "@/electron/utils/extractText"
import lodash from "lodash"
import { and, desc, eq, lt, or, sql } from "drizzle-orm"
class ArticleService {
  async saveArticles(feedUrl: string, articles: FeedItem[]) {
    const CHUNK_SIZE = 100
    const chunks: FeedItem[][] = lodash.chunk(articles, CHUNK_SIZE)

    for (const chunk of chunks) {
      await db.transaction(async (tx) => {
        const rows = chunk.map((feedItem) => {
          const pubDate = feedItem.isoDate
            ? new Date(feedItem.isoDate).toISOString()
            : new Date().toISOString()
          const articleId = feedItem.guid ?? feedItem.link ?? ""
          const newContent = feedItem["content:encoded"] ?? feedItem.content

          return {
            id: articleId,
            title: feedItem.title ?? "",
            link: feedItem.link ?? "",
            summary: feedItem.summary ?? feedItem.contentSnippet ?? "",
            pubDate,
            isRead: false,
            content: newContent ?? "",
            feedUrl,
          }
        })

        await tx
          .insert(article)
          .values(rows)
          .onConflictDoUpdate({
            target: article.id,
            set: {
              title: sql`excluded.title`,
              summary: sql`excluded.summary`,
              link: sql`excluded.link`,
              pubDate: sql`excluded.pubDate`,
              content: sql`excluded.content`,
              feedUrl: sql`excluded.feedUrl`,
            },
          })
          .run()
      })
    }
  }
  async markArticleAsRead(articleId: string) {
    const [updatedArticle] = await db
      .update(article)
      .set({ isRead: true })
      .where(eq(article.id, articleId))
      .returning()

    if (!updatedArticle) {
      throw new Error("Article not found")
    }

    return updatedArticle
  }
  async markArticleAsUnread(articleId: string) {
    const [updatedArticle] = await db
      .update(article)
      .set({ isRead: false })
      .where(eq(article.id, articleId))
      .returning()

    if (!updatedArticle) {
      throw new Error("Article not found")
    }

    return updatedArticle
  }
  async markAllArticlesAsRead() {
    return db
      .update(article)
      .set({ isRead: true })
      .where(eq(article.isRead, false))
  }
  async deleteAllArticlesByFeedUrl(feedUrl: string) {
    return db.delete(article).where(eq(article.feedUrl, feedUrl))
  }
  async getArticleContentById(articleId: string) {
    const [result] = await db
      .select({
        content: article.content,
      })
      .from(article)
      .where(eq(article.id, articleId))
      .limit(1)

    return result ?? null
  }
  async getAll(
    prop: {
      includeFeeds?: boolean
      ignoreRead?: boolean
      cursor?: {
        id: string
        pubDate: string | Date
      }
      take?: number
      summaryPreview?: {
        length: number
      }
      selectRawSummary?: boolean
    } = {},
  ): Promise<{
    articles: ArticleWithFeed[]
    hasMore: boolean
  }> {
    const {
      includeFeeds = false,
      ignoreRead = false,
      cursor,
      take = 20,
      summaryPreview = null,
      selectRawSummary = false,
    } = prop

    const cursorPubDate = cursor
      ? cursor.pubDate instanceof Date
        ? cursor.pubDate.toISOString()
        : cursor.pubDate
      : null

    const cursorCondition = cursor
      ? or(
          lt(article.pubDate, cursorPubDate as string),
          and(
            eq(article.pubDate, cursorPubDate as string),
            lt(article.id, cursor.id),
          ),
        )
      : undefined

    const whereClause = and(
      ignoreRead ? eq(article.isRead, false) : undefined,
      cursorCondition,
    )

    const baseRows = includeFeeds
      ? await db
          .select({
            id: article.id,
            title: article.title,
            summary: article.summary,
            link: article.link,
            pubDate: article.pubDate,
            isRead: article.isRead,
            feedUrl: article.feedUrl,
            createdAt: article.createdAt,
            feedTitle: feed.title,
            feedCreatedAt: feed.createdAt,
          })
          .from(article)
          .leftJoin(feed, eq(article.feedUrl, feed.url))
          .where(whereClause)
          .orderBy(desc(article.pubDate), desc(article.id))
          .limit(take + 1)
      : await db
          .select({
            id: article.id,
            title: article.title,
            summary: article.summary,
            link: article.link,
            pubDate: article.pubDate,
            isRead: article.isRead,
            feedUrl: article.feedUrl,
            createdAt: article.createdAt,
          })
          .from(article)
          .where(whereClause)
          .orderBy(desc(article.pubDate), desc(article.id))
          .limit(take + 1)

    const result: ArticleWithFeed[] = baseRows.map((row) => {
      const articleItem = {
        id: row.id,
        title: row.title,
        summary: row.summary,
        link: row.link,
        pubDate: row.pubDate,
        isRead: row.isRead,
        feedUrl: row.feedUrl,
        createdAt: row.createdAt,
      } as ArticleWithFeed

      if (includeFeeds) {
        const rowWithFeed = row as typeof row & {
          feedTitle: string | null
          feedCreatedAt: string | null
        }
        articleItem.feed = {
          url: row.feedUrl,
          title: rowWithFeed.feedTitle ?? "",
          createdAt: rowWithFeed.feedCreatedAt ?? "",
        }
      }

      return articleItem
    })

    const hasMore = result.length > take
    if (hasMore) {
      result.pop()
    }
    result.forEach((article) => {
      if (!article.summary) return
      if (summaryPreview) {
        const text = extractText(article.summary)
        article.preview = truncateText(text, summaryPreview.length)
      }
      if (!selectRawSummary) {
        article.summary = null
      }
    })
    return {
      articles: result,
      hasMore,
    }
  }
}

const articleService = new ArticleService()

export default articleService
