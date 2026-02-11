import { describe, it, expect } from "vitest"
import feedService from "@/electron/services/feedService"
import { randomUUID } from "crypto"

const cleanFeeds = async (url: string) => {
  try {
    await feedService.deleteFeed(url)
  } catch {
    console.warn(`Feed with url ${url} could not be deleted during cleanup.`)
  }
}

describe("FeedService", () => {
  it("should add a new feed", async () => {
    const title = crypto.randomUUID()
    const url = `https://example.com/${randomUUID()}`
    const feed = await feedService.addFeed(title, url)

    expect(feed.title).toBe(title)
    expect(feed.url).toBe(url)

    await cleanFeeds(feed.url)
  })

  it("should retrieve all feeds", async () => {
    const title = crypto.randomUUID()
    const url = `https://example.com/${randomUUID()}`
    const newFeed = await feedService.addFeed(title, url)

    const feeds = await feedService.getFeeds()
    expect(Array.isArray(feeds)).toBe(true)
    expect(feeds.some((f) => f.title === title && f.url === url)).toBe(true)

    await cleanFeeds(newFeed.url)
  })

  it("should update an existing feed", async () => {
    const oldTitle = crypto.randomUUID()
    const feed = await feedService.addFeed(
      oldTitle,
      `https://example.com/${randomUUID()}`,
    )

    const newTitle = crypto.randomUUID()
    const updatedFeed = await feedService.updateFeed(feed.url, newTitle)

    expect(updatedFeed.title).toBe(newTitle)

    await cleanFeeds(updatedFeed.url)
  })

  it("should delete a feed", async () => {
    const title = crypto.randomUUID()
    const feed = await feedService.addFeed(
      title,
      `https://example.com/${randomUUID()}`,
    )

    const deletedFeed = await feedService.deleteFeed(feed.url)
    expect(deletedFeed.url).toBe(feed.url)

    const feeds = await feedService.getFeeds()
    expect(feeds.some((f) => f.url === feed.url)).toBe(false)
  })

  it("should handle deleting non-existent feed gracefully", async () => {
    const fakeId = "non-existent-id"
    await expect(feedService.deleteFeed(fakeId)).rejects.toThrow()
  })
})
