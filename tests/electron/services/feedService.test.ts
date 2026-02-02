import { describe, it, expect } from "vitest"
import feedService from "@/electron/services/feedService"

const cleanFeeds = async (id: string) => {
  try {
    await feedService.deleteFeed(id)
  } catch {
    console.warn(`Feed with id ${id} could not be deleted during cleanup.`)
  }
}

describe("FeedService", () => {
  it("should add a new feed", async () => {
    const title = crypto.randomUUID()
    const url = "https://example.com/feed"
    const feed = await feedService.addFeed(title, url)

    expect(feed.title).toBe(title)
    expect(feed.url).toBe(url)

    await cleanFeeds(feed.id)
  })

  it("should retrieve all feeds", async () => {
    const title = crypto.randomUUID()
    const url = "https://example.com/another-feed"
    const newFeed = await feedService.addFeed(title, url)

    const feeds = await feedService.getFeeds()
    expect(Array.isArray(feeds)).toBe(true)
    expect(feeds.some((f) => f.title === title && f.url === url)).toBe(true)

    await cleanFeeds(newFeed.id)
  })

  it("should update an existing feed", async () => {
    const oldTitle = crypto.randomUUID()
    const feed = await feedService.addFeed(
      oldTitle,
      "https://example.com/will-update-feed",
    )

    const newTitle = crypto.randomUUID()
    const newUrl = "https://new-url.com/feed"
    const updatedFeed = await feedService.updateFeed(feed.id, newTitle, newUrl)

    expect(updatedFeed.title).toBe(newTitle)
    expect(updatedFeed.url).toBe(newUrl)

    await cleanFeeds(updatedFeed.id)
  })

  it("should delete a feed", async () => {
    const title = crypto.randomUUID()
    const feed = await feedService.addFeed(
      title,
      "https://example.com/delete-feed",
    )

    const deletedFeed = await feedService.deleteFeed(feed.id)
    expect(deletedFeed.id).toBe(feed.id)

    const feeds = await feedService.getFeeds()
    expect(feeds.some((f) => f.id === feed.id)).toBe(false)
  })

  it("should handle deleting non-existent feed gracefully", async () => {
    const fakeId = "non-existent-id"
    await expect(feedService.deleteFeed(fakeId)).rejects.toThrow()
  })
})
