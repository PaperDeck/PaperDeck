import { describe, it, expect } from "vitest"
import { enrichItem } from "@/electron/services/feedParser"
import type Parser from "rss-parser"

describe("Feed Parser - Item Enrichment", () => {
  describe("enrichItem", () => {
    it("should add id, datePublished and image to items", () => {
      const item: Parser.Item = {
        title: "Hello World",
        link: "https://example.com/post",
        content: "<p>Content</p>",
        pubDate: "2024-05-20T10:00:00Z",
        guid: "item-123",
      }

      const result = enrichItem(item)

      expect(result.id).toBe("item-123")
      expect(result.title).toBe("Hello World")
      expect(result.link).toBe("https://example.com/post")
      expect(result.datePublished).toEqual(new Date("2024-05-20T10:00:00Z"))
      expect(result.image).toBe("")
      // Verify original fields are preserved
      expect(result.content).toBe("<p>Content</p>")
    })

    it("should extract images from enclosures", () => {
      const item: Parser.Item = {
        title: "Post with image",
        enclosure: { url: "https://example.com/image.jpg" },
      }

      const result = enrichItem(item)

      expect(result.image).toBe("https://example.com/image.jpg")
    })

    it("should generate ID when guid and link are missing", () => {
      const item: Parser.Item = {
        title: "No ID Post",
        pubDate: "2024-01-01",
      }

      const result = enrichItem(item)

      expect(result.id).toBeDefined()
      expect(result.id).not.toBe("")
    })

    it("should use link as ID when guid is missing", () => {
      const item: Parser.Item = {
        link: "https://test.com/1",
      }

      const result = enrichItem(item)

      expect(result.id).toBe("https://test.com/1")
    })

    it("should return undefined for invalid date formats", () => {
      const item: Parser.Item = {
        pubDate: "not-a-date",
        link: "test",
      }

      const result = enrichItem(item)

      expect(result.datePublished).toBeUndefined()
    })

    it("should fallback to isoDate when pubDate is missing", () => {
      const item: Parser.Item = {
        isoDate: "2024-07-01T12:00:00.000Z",
        link: "test",
      }

      const result = enrichItem(item)

      expect(result.datePublished).toEqual(
        new Date("2024-07-01T12:00:00.000Z"),
      )
    })

    it("should support mediaContent as an image source", () => {
      const item = {
        link: "test",
        mediaContent: { url: "https://example.com/media.jpg" },
      }

      const result = enrichItem(item)

      expect(result.image).toBe("https://example.com/media.jpg")
    })

    it("should preserve all rss-parser fields", () => {
      const item: Parser.Item = {
        title: "Test Article",
        link: "https://example.com/article",
        guid: "article-123",
        pubDate: "2024-01-01",
        creator: "John Doe",
        summary: "Article summary",
        content: "<p>Full content</p>",
        contentSnippet: "Plain text content",
        categories: ["tech", "news"],
      }

      const result = enrichItem(item)

      // All original fields should be preserved
      expect(result.title).toBe("Test Article")
      expect(result.link).toBe("https://example.com/article")
      expect(result.creator).toBe("John Doe")
      expect(result.summary).toBe("Article summary")
      expect(result.content).toBe("<p>Full content</p>")
      expect(result.contentSnippet).toBe("Plain text content")
      expect(result.categories).toEqual(["tech", "news"])
      // Plus our enrichments
      expect(result.id).toBe("article-123")
      expect(result.datePublished).toBeDefined()
      expect(result.image).toBe("")
    })

    it("should handle contentEncoded custom field", () => {
      const item = {
        link: "test",
        contentEncoded: "<div>Rich HTML content</div>",
      }

      const result = enrichItem(item)

      expect(result.contentEncoded).toBe("<div>Rich HTML content</div>")
    })
  })
})
