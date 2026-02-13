import { describe, it, expect } from "vitest"
import { normalizeFeed, normalizeItem } from "@/electron/services/feedParser"

describe("Feed Normalizer Units", () => {
  describe("normalizeItem", () => {
    it("should map standard fields correctly", () => {
      const rawItem = {
        title: "Hello World",
        link: "https://example.com/post",
        content: "<p>Content</p>",
        pubDate: "2024-05-20T10:00:00Z",
        guid: "item-123",
      }

      const result = normalizeItem(rawItem)

      expect(result.title).toBe("Hello World")
      expect(result.id).toBe("item-123")
      expect(result.datePublished).toEqual(new Date("2024-05-20T10:00:00Z"))
    })

    it("should prioritize contentEncoded over content, contentSnippet and summary", () => {
      const rawItem = {
        contentEncoded: "Encoded Content",
        content: "Content",
        contentSnippet: "Snippet Content",
        summary: "Summary Content",
      }
      const result = normalizeItem(rawItem)
      expect(result.content).toBe("Encoded Content")
    })

    it("should extract images from enclosures if available", () => {
      const rawItem = {
        enclosure: { url: "https://example.com/image.jpg" },
      }
      const result = normalizeItem(rawItem)
      expect(result.image).toBe("https://example.com/image.jpg")
    })

    it("should generate an ID if no unique identifier is provided", () => {
      const rawItem = {
        title: "No ID Post",
        pubDate: "2024-01-01",
      }
      const result = normalizeItem(rawItem)
      expect(result.id).toBeDefined()
    })

    it("should return undefined for invalid date formats", () => {
      const rawItem = { pubDate: "not-a-date" }
      const result = normalizeItem(rawItem)
      expect(result.datePublished).toBeUndefined()
    })

    it("should fallback to content if contentEncoded is missing", () => {
      const result = normalizeItem({ content: "<b>HTML</b>" })
      expect(result.content).toBe("<b>HTML</b>")
    })

    it("should use link as ID if guid is missing", () => {
      const result = normalizeItem({ link: "https://test.com/1" })
      expect(result.id).toBe("https://test.com/1")
    })

    it("should try multiple date fields and save rawDate", () => {
      const rawItem = { pubDate: "2024-06-01" }
      const result = normalizeItem(rawItem)
      expect(result.datePublished).toEqual(new Date("2024-06-01"))
      expect(result.rawDate).toBe("2024-06-01")
    })

    it("should support mediaContent as an image source", () => {
      const rawItem = { mediaContent: { url: "https://example.com/media.jpg" } }
      const result = normalizeItem(rawItem)
      expect(result.image).toBe("https://example.com/media.jpg")
    })

    it("should fallback to isoDate when pubDate is missing", () => {
      const rawItem = { isoDate: "2024-07-01T12:00:00.000Z" }
      const result = normalizeItem(rawItem)
      expect(result.datePublished).toEqual(new Date("2024-07-01T12:00:00.000Z"))
      expect(result.rawDate).toBe("2024-07-01T12:00:00.000Z")
    })

    it("should use contentSnippet for summary if available", () => {
      const rawItem = {
        contentSnippet: "Snippet text",
        summary: "Summary text",
      }
      const result = normalizeItem(rawItem)
      expect(result.summary).toBe("Snippet text")
    })
  })

  describe("normalizeFeed", () => {
    const mockUrl = "https://example.com/feed.rss"

    it("should normalize top-level feed metadata", () => {
      const rawFeed = {
        title: "My Blog",
        description: "A cool blog",
        link: "https://example.com",
        image: { url: "https://example.com/icon.png" },
        items: [],
      }

      const result = normalizeFeed(rawFeed, mockUrl)

      expect(result.title).toBe("My Blog")
      expect(result.feedUrl).toBe(mockUrl)
      expect(result.image).toBe("https://example.com/icon.png")
    })

    it("should handle missing items by returning an empty array", () => {
      const rawFeed = { title: "Empty Feed" }
      const result = normalizeFeed(rawFeed, mockUrl)
      expect(result.items).toEqual([])
    })

    it("should correctly map description field", () => {
      const rawFeed = {
        title: "Desc Feed",
        description: "The description",
      }
      const result = normalizeFeed(rawFeed, mockUrl)
      expect(result.description).toBe("The description")
    })

    it("should process a list of items", () => {
      const rawFeed = {
        title: "Feed with Items",
        items: [
          { title: "Item 1", link: "link1" },
          { title: "Item 2", link: "link2" },
        ],
      }
      const result = normalizeFeed(rawFeed, mockUrl)
      expect(result.items).toHaveLength(2)
      expect(result.items[0].title).toBe("Item 1")
      expect(result.items[1].link).toBe("link2")
    })

    it("should handle nested image objects and language in feed", () => {
      const rawFeed = {
        title: "Complex Feed",
        language: "zh-TW",
        image: { url: "https://example.com/deep-image.png" },
      }
      const result = normalizeFeed(rawFeed, "url")
      expect(result.language).toBe("zh-TW")
      expect(result.image).toBe("https://example.com/deep-image.png")
    })

    it("should use link field from feed", () => {
      const rawFeed = { link: "https://example.com/home" }
      const result = normalizeFeed(rawFeed, "url")
      expect(result.link).toBe("https://example.com/home")
    })

    it("should fallback to itunes image if image.url is not available", () => {
      const rawFeed = {
        title: "Podcast Feed",
        itunes: { image: "https://example.com/podcast-image.jpg" },
      }
      const result = normalizeFeed(rawFeed, mockUrl)
      expect(result.image).toBe("https://example.com/podcast-image.jpg")
    })
  })
})
