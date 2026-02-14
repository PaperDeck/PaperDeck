import { describe, it, expect, vi, beforeEach } from "vitest"
import { ParserError } from "@/shared/types/feedParser"

// Mock rss-parser before importing feedParser
vi.mock("rss-parser", () => {
  return {
    default: vi.fn().mockImplementation(function (this: unknown) {
      return this
    }),
  }
})

describe("feedParser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should parse a feed successfully and return rss-parser output", async () => {
    const mockFeed = {
      title: "Test Feed",
      description: "Test Description",
      link: "https://example.com",
      items: [
        {
          title: "Test Item",
          link: "https://example.com/item",
          guid: "item-1",
          pubDate: "2024-01-01T00:00:00Z",
          isoDate: "2024-01-01T00:00:00Z",
          content: "Test content",
          contentSnippet: "Test snippet",
        },
      ],
    }

    const mockParseURL = vi.fn().mockResolvedValue(mockFeed)
    const { default: Parser } = await import("rss-parser")
    ;(Parser as unknown as vi.Mock).mockImplementation(function (
      this: { parseURL: typeof mockParseURL },
    ) {
      this.parseURL = mockParseURL
      return this
    })

    const feedParser = (await import("@/electron/services/feedParser")).default

    const result = await feedParser("https://example.com/feed.xml")

    expect(result.title).toBe("Test Feed")
    expect(result.items).toHaveLength(1)
    expect(result.items[0].title).toBe("Test Item")
    expect(mockParseURL).toHaveBeenCalledWith("https://example.com/feed.xml")
  })

  it("should use custom timeout when provided", async () => {
    const mockFeed = { title: "Test", items: [] }
    const mockParseURL = vi.fn().mockResolvedValue(mockFeed)

    let capturedTimeout: number | undefined
    const { default: Parser } = await import("rss-parser")
    ;(Parser as unknown as vi.Mock).mockImplementation(function (
      this: { parseURL: typeof mockParseURL },
      options?: { timeout?: number },
    ) {
      capturedTimeout = options?.timeout
      this.parseURL = mockParseURL
      return this
    })

    const feedParser = (await import("@/electron/services/feedParser")).default

    await feedParser("https://example.com/feed.xml", 10000)

    expect(capturedTimeout).toBe(10000)
  })

  it("should throw ParserError when parsing fails", async () => {
    const mockParseURL = vi.fn().mockRejectedValue(new Error("Parse failed"))
    const { default: Parser } = await import("rss-parser")
    ;(Parser as unknown as vi.Mock).mockImplementation(function (
      this: { parseURL: typeof mockParseURL },
    ) {
      this.parseURL = mockParseURL
      return this
    })

    const feedParser = (await import("@/electron/services/feedParser")).default

    await expect(
      feedParser("https://example.com/bad-feed.xml"),
    ).rejects.toThrow(ParserError)
    await expect(
      feedParser("https://example.com/bad-feed.xml"),
    ).rejects.toThrow("Feed Parsing Error")
  })
})
