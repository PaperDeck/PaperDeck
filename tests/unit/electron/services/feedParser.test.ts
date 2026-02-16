import { describe, it, expect, vi, beforeEach } from "vitest"
import feedParser from "@/electron/services/feedParser"
import axios from "axios"
import Parser from "rss-parser"
import { ParserError } from "@/shared/types/feedParser"

const feedUrl = "https://example.com/test-feed"

const parsedFeed: Parser.Output<Parser.Item> = {
  title: "Test Feed",
  description: "desc",
  link: feedUrl,
  feedUrl: feedUrl,
  items: [
    {
      guid: "article-1",
      title: "Article 1",
      link: "https://example.com/article-1",
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("feedParser", () => {
  it("parses feed successfully", async () => {
    vi.spyOn(axios, "get").mockResolvedValue({ data: "<xml/>" })
    vi.spyOn(Parser.prototype, "parseString").mockResolvedValue(parsedFeed)

    const result = await feedParser(feedUrl)

    expect(result).toEqual(parsedFeed)
  })

  it("throws ParserError on timeout (ECONNABORTED)", async () => {
    const axiosError = {
      code: "ECONNABORTED",
      message: "timeout",
      isAxiosError: true,
    }
    vi.spyOn(axios, "get").mockRejectedValue(axiosError)
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true)

    await expect(feedParser(feedUrl)).rejects.toThrow("Feed Parsing Timeout")
  })

  it("throws ParserError with status code for HTTP errors", async () => {
    const axiosError = {
      response: { status: 404 },
      message: "Not Found",
      isAxiosError: true,
    }
    vi.spyOn(axios, "get").mockRejectedValue(axiosError)
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true)

    try {
      await feedParser(feedUrl)
      // should not reach here
      expect.fail("Expected feedParser to throw an error")
    } catch (err) {
      expect(err).toBeInstanceOf(ParserError)
      if (err instanceof ParserError) {
        expect(err.message).toBe("HTTP Error: 404")
        expect(err.statusCode).toBe(404)
      }
    }
  })

  it("throws ParserError for generic network errors", async () => {
    const axiosError = { message: "Network unreachable", isAxiosError: true }
    vi.spyOn(axios, "get").mockRejectedValue(axiosError)
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true)

    await expect(feedParser(feedUrl)).rejects.toThrow(
      "Network Error: Network unreachable",
    )
  })

  it("wraps unexpected errors into ParserError", async () => {
    vi.spyOn(axios, "get").mockRejectedValue(new Error("boom"))
    vi.spyOn(axios, "isAxiosError").mockReturnValue(false)

    await expect(feedParser(feedUrl)).rejects.toThrow("Feed Parsing Error")
  })
})
