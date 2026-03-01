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

  it("should get all articles with optional feed data", async () => {
    await articleService.saveArticles(feedUrl, testArticles)
    const articlesWithoutFeed = await articleService.getAll()
    expect(articlesWithoutFeed[0].feed).toBeUndefined()

    const articlesWithFeed = await articleService.getAll({
      includeFeeds: true,
      ignoreRead: false,
    })
    expect(articlesWithFeed[0].feed).toBeDefined()
    expect(articlesWithFeed[0].feed?.url).toBe(feedUrl)
  })
})
