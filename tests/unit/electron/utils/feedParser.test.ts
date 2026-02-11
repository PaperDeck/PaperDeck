import { describe, it, expect } from "vitest"
import { normalizeFeed, normalizeItem } from "@/electron/services/feedParser"

describe("Feed Normalizer Units", () => {
  describe("normalizeItem", () => {
    it("should map standard fields correctly", () => {
      const rawItem = {
        title: "Hello World",
        link: "https://example.com/post",
        content_html: "<p>Content</p>",
        date_published: "2024-05-20T10:00:00Z",
        guid: { value: "item-123" },
      }

      const result = normalizeItem(rawItem)

      expect(result.title).toBe("Hello World")
      expect(result.id).toBe("item-123")
      expect(result.datePublished).toEqual(new Date("2024-05-20T10:00:00Z"))
    })

    it("should prioritize content_text over description and summary", () => {
      const rawItem = {
        content_text: "Text Content",
        description: "Description Content",
        summary: "Summary Content",
      }
      const result = normalizeItem(rawItem)
      expect(result.content).toBe("Text Content")
    })

    it("should extract images from enclosures if top-level image is missing", () => {
      const rawItem = {
        enclosure: { url: "https://example.com/image.jpg" },
      }
      const result = normalizeItem(rawItem)
      expect(result.image).toBe("https://example.com/image.jpg")
    })

    it("should generate an ID if no unique identifier is provided", () => {
      const rawItem = {
        title: "No ID Post",
        published: "2024-01-01",
      }
      const result = normalizeItem(rawItem)
      expect(result.id).toBeDefined()
    })

    it("should return an empty string for invalid date formats", () => {
      const rawItem = { date_published: "not-a-date" }
      const result = normalizeItem(rawItem)
      expect(result.datePublished).toBeUndefined()
    })

    it("should fallback to content_html if content_text is missing", () => {
      const result = normalizeItem({ content_html: "<b>HTML</b>" })
      expect(result.content).toBe("<b>HTML</b>")
    })

    it("should use link as ID if guid and id are missing", () => {
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
  })

  describe("normalizeFeed", () => {
    const mockUrl = "https://example.com/feed.rss"

    it("should normalize top-level feed metadata", () => {
      const rawFeed = {
        title: "My Blog",
        description: "A cool blog",
        home_page_url: "https://example.com",
        icon: "https://example.com/icon.png",
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

    it("should correctly map fallback fields for description (subtitle)", () => {
      const rawFeed = {
        title: "Subtitle Feed",
        subtitle: "The fallback description",
      }
      const result = normalizeFeed(rawFeed, mockUrl)
      expect(result.description).toBe("The fallback description")
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

    it("should fallback to link if home_page_url is missing", () => {
      const rawFeed = { link: "https://example.com/home" }
      const result = normalizeFeed(rawFeed, "url")
      expect(result.link).toBe("https://example.com/home")
    })
  })
})
