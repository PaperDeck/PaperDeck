import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import articleService from "@/electron/services/articleService"
import feedService from "@/electron/services/feedService"

const testFeed = {
  title: "Test Feed",
  url: "https://example.com/test-feed",
}

const testArticles = [
  {
    id: "article-1",
    title: "Article 1",
    link: "https://example.com/article-1",
    summary: "Summary 1",
    content: "Content 1",
    image: "",
    rawDate: "2023-01-01T00:00:00Z",
    datePublished: new Date("2023-01-01T00:00:00Z"),
  },
  {
    id: "article-2",
    title: "Article 2",
    link: "https://example.com/article-2",
    summary: "Summary 2",
    content: "Content 2",
    image: "",
    rawDate: "2023-01-02T00:00:00Z",
    datePublished: new Date("2023-01-02T00:00:00Z"),
  },
]

let feedId: string

beforeAll(async () => {
  const feed = await feedService.addFeed(testFeed.title, testFeed.url)
  feedId = feed.id
})

afterAll(async () => {
  await articleService.deleteAllArticlesByFeedId(feedId)
  await feedService.deleteFeed(feedId)
})

beforeEach(async () => {
  await articleService.deleteAllArticlesByFeedId(feedId)
})

describe("ArticleService", () => {
  it("should save articles and upsert correctly", async () => {
    const saved = await articleService.saveArticles(feedId, testArticles)
    expect(saved).toHaveLength(2)
    expect(saved[0].id).toBe(testArticles[0].id)
    expect(saved[1].id).toBe(testArticles[1].id)

    const updatedArticles = [
      { ...testArticles[0], summary: "Updated Summary 1" },
      { ...testArticles[1], summary: "Updated Summary 2" },
    ]
    const updated = await articleService.saveArticles(feedId, updatedArticles)
    expect(updated[0].summary).toBe("Updated Summary 1")
    expect(updated[1].summary).toBe("Updated Summary 2")
  })

  it("should mark article as read", async () => {
    await articleService.saveArticles(feedId, testArticles)
    const article = testArticles[0]
    const updated = await articleService.markArticleAsRead(article.id)
    expect(updated.isRead).toBe(true)
    expect(updated.id).toBe(article.id)
  })

  it("should get articles by feedId with correct order and limit", async () => {
    await articleService.saveArticles(feedId, testArticles)
    const articles = await articleService.getArticlesByFeedId(feedId, 2)
    expect(articles).toHaveLength(2)
    expect(articles[0].id).toBe("article-2")
    expect(articles[1].id).toBe("article-1")
  })

  it("should delete all articles by feedId", async () => {
    await articleService.saveArticles(feedId, testArticles)
    const deleted = await articleService.deleteAllArticlesByFeedId(feedId)
    expect(deleted.count).toBe(2)
    const articles = await articleService.getArticlesByFeedId(feedId)
    expect(articles).toHaveLength(0)
  })
})
