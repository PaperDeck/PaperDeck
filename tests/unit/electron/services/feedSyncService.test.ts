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
import type { Mock } from "vitest"
import feedSyncService from "@/electron/services/feedSyncService"
import feedService from "@/electron/services/feedService"
import articleService from "@/electron/services/articleService"
import type { Feed } from "@/electron/services/feed/types"
import { ParserError } from "@/electron/services/feed/types"
import * as feedParserModule from "@/electron/services/feed/parser"

const testFeed = {
  title: "FeedSync Test Feed",
  url: "https://example.com/sync-feed",
}

const parsedFeed = {
  title: "FeedSync Test Feed Title",
  description: "desc",
  link: "https://example.com/sync-feed",
  feedUrl: "https://example.com/sync-feed",
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

let feedId: string
let consoleErrorSpy: Mock

beforeAll(async () => {
  const feed = await feedService.addFeed(testFeed.title, testFeed.url)
  feedId = feed.id
})
afterAll(async () => {
  await feedService.deleteFeed(feedId)
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
    const updateFeedSpy = vi.spyOn(feedService, "updateFeed")
    const saveArticlesSpy = vi.spyOn(articleService, "saveArticles")

    await feedSyncService.syncFeeds()

    expect(updateFeedSpy).toHaveBeenCalledWith(
      feedId,
      parsedFeed.title,
      parsedFeed.feedUrl,
    )
    expect(saveArticlesSpy).toHaveBeenCalledWith(feedId, parsedFeed.items)
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
