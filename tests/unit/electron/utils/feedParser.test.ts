import { describe, it, expect, vi } from "vitest"
import feedParser from "@/electron/services/feedParser"
import { ParserError } from "@/shared/types/feedParser"
import Parser from "rss-parser"

vi.mock("rss-parser")

describe("feedParser", () => {
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
    ;(Parser as unknown as vi.Mock).mockImplementation(() => ({
      parseURL: mockParseURL,
    }))

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
    ;(Parser as unknown as vi.Mock).mockImplementation((options) => {
      capturedTimeout = options?.timeout
      return { parseURL: mockParseURL }
    })

    await feedParser("https://example.com/feed.xml", 10000)

    expect(capturedTimeout).toBe(10000)
  })

  it("should throw ParserError when parsing fails", async () => {
    const mockParseURL = vi.fn().mockRejectedValue(new Error("Parse failed"))
    ;(Parser as unknown as vi.Mock).mockImplementation(() => ({
      parseURL: mockParseURL,
    }))

    await expect(
      feedParser("https://example.com/bad-feed.xml"),
    ).rejects.toThrow(ParserError)
    await expect(
      feedParser("https://example.com/bad-feed.xml"),
    ).rejects.toThrow("Feed Parsing Error")
  })
})
