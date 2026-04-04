import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import articleService from "@/electron/services/articleService"
import feedService from "@/electron/services/feedService"
import { randomUUID } from "crypto"

const feedUrl = `https://example.com/${randomUUID()}`

const testFeed = {
  title: "Test Feed",
  url: feedUrl,
}

const testArticles = [
  {
    guid: "article-1",
    title: "Article 1",
    link: `${feedUrl}/article-1`,
    summary: "Summary 1",
    content: "Content 1",
    image: "",
    rawDate: "2023-01-01T00:00:00Z",
    datePublished: new Date("2023-01-01T00:00:00Z"),
  },
  {
    guid: "article-2",
    title: "Article 2",
    link: `${feedUrl}/article-2`,
    summary: "Summary 2",
    content: "Content 2",
    image: "",
    rawDate: "2023-01-02T00:00:00Z",
    datePublished: new Date("2023-01-02T00:00:00Z"),
  },
]

beforeAll(async () => {
  await feedService.addFeed(testFeed.title, testFeed.url)
})

afterAll(async () => {
  await articleService.deleteAllArticlesByFeedUrl(feedUrl)
  await feedService.deleteFeed(feedUrl)
})

beforeEach(async () => {
  await articleService.deleteAllArticlesByFeedUrl(feedUrl)
})

describe.sequential("ArticleService", () => {
  it("should save articles and upsert correctly", async () => {
    const saved = await articleService.saveArticles(feedUrl, testArticles)
    expect(saved).toHaveLength(2)
    expect(saved[0].id).toBe(testArticles[0].guid)
    expect(saved[1].id).toBe(testArticles[1].guid)

    const updatedArticles = [
      { ...testArticles[0], summary: "Updated Summary 1" },
      { ...testArticles[1], summary: "Updated Summary 2" },
    ]
    const updated = await articleService.saveArticles(feedUrl, updatedArticles)
    expect(updated[0].summary).toBe("Updated Summary 1")
    expect(updated[1].summary).toBe("Updated Summary 2")
  })

  it("should mark article as read", async () => {
    await articleService.saveArticles(feedUrl, testArticles)
    const article = testArticles[0]
    const updated = await articleService.markArticleAsRead(article.guid)
    expect(updated.isRead).toBe(true)
    expect(updated.id).toBe(article.guid)
  })

  it("should mark article as unread", async () => {
    await articleService.saveArticles(feedUrl, testArticles)
    const article = testArticles[0]
    await articleService.markArticleAsRead(article.guid)
    const updated = await articleService.markArticleAsUnread(article.guid)
    expect(updated.isRead).toBe(false)
    expect(updated.id).toBe(article.guid)
  })

  it("should get all articles with optional feed data", async () => {
    await articleService.saveArticles(feedUrl, testArticles)
    const articlesWithoutFeed = (await articleService.getAll()).articles
    expect(articlesWithoutFeed[0].feed).toBeUndefined()

    const articlesWithFeed = (
      await articleService.getAll({
        includeFeeds: true,
        ignoreRead: false,
      })
    ).articles
    expect(articlesWithFeed[0].feed).toBeDefined()
    expect(articlesWithFeed[0].feed?.url).toBe(feedUrl)
  })

  it("should paginate articles with cursor-based getAll", async () => {
    const extraArticles = [
      {
        guid: "article-3",
        title: "Article 3",
        link: `${feedUrl}/article-3`,
        summary: "Summary 3",
        content: "Content 3",
        image: "",
        rawDate: "2023-01-03T00:00:00Z",
        datePublished: new Date("2023-01-03T00:00:00Z"),
      },
      {
        guid: "article-4",
        title: "Article 4",
        link: `${feedUrl}/article-4`,
        summary: "Summary 4",
        content: "Content 4",
        image: "",
        rawDate: "2023-01-04T00:00:00Z",
        datePublished: new Date("2023-01-04T00:00:00Z"),
      },
    ]
    await articleService.saveArticles(feedUrl, [
      ...testArticles,
      ...extraArticles,
    ])
    const firstPage = await articleService.getAll({
      take: 1,
      ignoreRead: false,
    })
    expect(firstPage.articles).toHaveLength(1)
    expect(firstPage.hasMore).toBe(true)
    const secondPage = await articleService.getAll({
      take: 1,
      cursor: {
        id: firstPage.articles[0].id,
        pubDate: firstPage.articles[0].pubDate,
      },
      ignoreRead: false,
    })
    expect(secondPage.articles).toHaveLength(1)
    const remainingPage = await articleService.getAll({
      take: 10,
      cursor: {
        id: secondPage.articles[0].id,
        pubDate: secondPage.articles[0].pubDate,
      },
      ignoreRead: false,
    })
    expect(remainingPage.articles.length).toBeGreaterThanOrEqual(1)
    expect(remainingPage.hasMore).toBe(false)
  })
  it("should get article content by id", async () => {
    await articleService.saveArticles(feedUrl, testArticles)
    const article = testArticles[0]
    const contentResult = await articleService.getArticleContentById(
      article.guid,
    )
    expect(contentResult).toBeDefined()
    expect(contentResult?.content).toBe(article.content)
  })
  it("should provide summaryPreview when fetching articles", async () => {
    const longSummary = "L".repeat(500)
    const articlesWithSummaries = [
      {
        ...testArticles[0],
        guid: "article-short-summary",
        summary: "Short summary",
      },
      {
        ...testArticles[1],
        guid: "article-long-summary",
        summary: longSummary,
      },
    ]
    await articleService.saveArticles(feedUrl, articlesWithSummaries)
    const { articles } = await articleService.getAll({
      includeFeeds: false,
      ignoreRead: false,
      summaryPreview: { length: 100 },
      selectRawSummary: true,
    })
    const short = articles.find((a) => a.id === "article-short-summary")
    const long = articles.find((a) => a.id === "article-long-summary")
    expect(short).toBeDefined()
    expect(long).toBeDefined()
    expect(short?.preview).toBeDefined()
    expect(short?.preview).toBe(short?.summary)
    expect(long?.preview).toBeDefined()
    expect(long!.preview!.length).toBeLessThan(longSummary.length)
  })
  it("should delete all articles by feed URL", async () => {
    await articleService.saveArticles(feedUrl, testArticles)
    await articleService.deleteAllArticlesByFeedUrl(feedUrl)
    const { articles } = await articleService.getAll({
      includeFeeds: true,
      ignoreRead: false,
    })
    const remainingForFeed = articles.filter((a) => a.feed?.url === feedUrl)
    expect(remainingForFeed).toHaveLength(0)
  })
})
