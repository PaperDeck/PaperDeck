import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest"
import { randomUUID } from "crypto"
import feedSyncService from "@/electron/services/feedSyncService"
import feedService from "@/electron/services/feedService"
import articleService from "@/electron/services/articleService"
import { ParserError } from "@/shared/types/feedParser"
import * as feedParserModule from "@/electron/services/feedParser"
import Parser from "rss-parser"

const feedUrl = `https://example.com/${randomUUID()}`

const testFeed = {
  title: "FeedSync Test Feed",
  url: feedUrl,
  createdAt: new Date(),
}

const parsedFeed: Parser.Output<Record<string, unknown>> = {
  title: "FeedSync Test Feed Title",
  description: "desc",
  link: feedUrl,
  feedUrl: feedUrl,
  items: [
    {
      guid: "sync-article-1",
      title: "Sync Article 1",
      link: "https://example.com/sync-article-1",
      content: "Content 1",
      contentSnippet: "Summary 1",
      isoDate: "2023-01-01T00:00:00Z",
      pubDate: "2023-01-01T00:00:00Z",
    },
  ],
}

beforeAll(async () => {
  await feedService.addFeed(testFeed.title, testFeed.url)
})
afterAll(async () => {
  await feedService.deleteFeed(feedUrl)
})
beforeEach(() => {
  vi.clearAllMocks()
})

describe("FeedSyncService", () => {
  it("should sync feeds and save articles", async () => {
    vi.spyOn(feedParserModule, "default").mockResolvedValue(parsedFeed)
    vi.spyOn(feedService, "getFeeds").mockResolvedValue([testFeed])
    const updateFeedSpy = vi.spyOn(feedService, "updateFeed")
    const saveArticlesSpy = vi.spyOn(articleService, "saveArticles")

    await feedSyncService.syncFeeds()

    expect(updateFeedSpy).toHaveBeenCalledWith(
      parsedFeed.feedUrl,
      parsedFeed.title,
    )

    expect(saveArticlesSpy).toHaveBeenCalledWith(feedUrl, parsedFeed.items)
  })

  it("should handle parser errors gracefully", async () => {
    vi.spyOn(feedParserModule, "default").mockRejectedValue(
      new ParserError("Parse error"),
    )
    const result = await feedSyncService.syncFeeds()
    expect(result.errorCount).toBe(1)
    expect(result.errors[0].message).toBe("Parse error")
  })

  it("should handle generic errors gracefully", async () => {
    vi.spyOn(feedParserModule, "default").mockRejectedValue(
      new ParserError("Network error"),
    )

    const result = await feedSyncService.syncFeeds()
    expect(result.errorCount).toBe(1)
    expect(result.errors[0].message).toBe("Network error")
  })

  it("should handle network errors with error codes gracefully", async () => {
    vi.spyOn(feedParserModule, "default").mockRejectedValue(
      new ParserError("Network error", 404),
    )

    const result = await feedSyncService.syncFeeds()
    expect(result.errorCount).toBe(1)
    expect(result.errors[0].message).toBe("Network error")
    expect(result.errors[0].statusCode).toBe(404)
  })

  it("should handle unexpected errors gracefully", async () => {
    vi.spyOn(feedParserModule, "default").mockRejectedValue(
      new Error("Unknown error"),
    )
    vi.spyOn(console, "error").mockImplementation(() => {})
    const result = await feedSyncService.syncFeeds()
    expect(result.errorCount).toBe(1)
    expect(result.errors).toHaveLength(0)
  })
})
