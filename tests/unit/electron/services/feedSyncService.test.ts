import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "vitest"
import { randomUUID } from "crypto"
import type { Mock } from "vitest"
import feedSyncService from "@/electron/services/feedSyncService"
import feedService from "@/electron/services/feedService"
import articleService from "@/electron/services/articleService"
import type { Feed } from "@/shared/types/feedParser"
import { ParserError } from "@/shared/types/feedParser"
import * as feedParserModule from "@/electron/services/feed/parser"

const feedUrl = `https://example.com/${randomUUID()}`

const testFeed = {
  title: "FeedSync Test Feed",
  url: feedUrl,
  createdAt: new Date(),
}

const parsedFeed = {
  title: "FeedSync Test Feed Title",
  description: "desc",
  link: feedUrl,
  feedUrl: feedUrl,
  language: "en",
  image: "",
  items: [
    {
      id: "sync-article-1",
      title: "Sync Article 1",
      link: "https://example.com/sync-article-1",
      content: "Content 1",
      summary: "Summary 1",
      datePublished: new Date("2023-01-01T00:00:00Z"),
      image: "",
      rawDate: "2023-01-01T00:00:00Z",
    },
  ],
}

let consoleErrorSpy: Mock

beforeAll(async () => {
  await feedService.addFeed(testFeed.title, testFeed.url)
})
afterAll(async () => {
  await feedService.deleteFeed(feedUrl)
})
beforeEach(() => {
  vi.clearAllMocks()
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
})
afterEach(() => {
  consoleErrorSpy.mockRestore()
})

describe("FeedSyncService", () => {
  it("should sync feeds and save articles", async () => {
    vi.spyOn(feedParserModule, "default").mockResolvedValue(parsedFeed as Feed)
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
    await feedSyncService.syncFeeds()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to parse feed"),
    )
  })

  it("should handle network errors gracefully", async () => {
    const axiosError = { isAxiosError: true, message: "Network fail" }
    vi.spyOn(feedParserModule, "default").mockRejectedValue(axiosError)

    await feedSyncService.syncFeeds()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Network error while fetching feed"),
    )
  })

  it("should handle unexpected errors gracefully", async () => {
    vi.spyOn(feedParserModule, "default").mockRejectedValue(
      new Error("Unknown error"),
    )
    await feedSyncService.syncFeeds()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unexpected error while syncing feed"),
    )
  })
})
