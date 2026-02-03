import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest"
import feedSyncService from "@/electron/services/feedSyncService"
import feedService from "@/electron/services/feedService"
import articleService from "@/electron/services/articleService"
import * as feedParserModule from "@/electron/utils/feedParser"

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

beforeAll(async () => {
  const feed = await feedService.addFeed(testFeed.title, testFeed.url)
  feedId = feed.id
})
afterAll(async () => {
  await feedService.deleteFeed(feedId)
})
beforeEach(() => {
  vi.restoreAllMocks()
})

describe("FeedSyncService", () => {
  it("should sync feeds and save articles", async () => {
    vi.spyOn(feedParserModule, "default").mockResolvedValue(
      parsedFeed as feedParserModule.Feed,
    )
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
      new feedParserModule.ParserError("Parse error"),
    )
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    await feedSyncService.syncFeeds()
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to parse feed"),
    )
  })

  it("should handle network errors gracefully", async () => {
    const axiosError = { isAxiosError: true, message: "Network fail" }
    vi.spyOn(feedParserModule, "default").mockRejectedValue(axiosError)
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    await feedSyncService.syncFeeds()
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Network error while fetching feed"),
    )
  })

  it("should handle unexpected errors gracefully", async () => {
    vi.spyOn(feedParserModule, "default").mockRejectedValue(
      new Error("Unknown error"),
    )
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    await feedSyncService.syncFeeds()
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unexpected error while syncing feed"),
    )
  })
})
