import db from "@/electron/utils/drizzle"
import { feed } from "@/schema"
import { eq } from "drizzle-orm"
import { FEED_ALREADY_EXISTS_ERROR_CODE } from "@/shared/consts"

class FeedService {
  async addFeed(title: string, url: string) {
    try {
      const [createdFeed] = await db
        .insert(feed)
        .values({
          title,
          url,
        })
        .returning()

      return createdFeed
    } catch (error) {
      const err = error as { code?: string }
      if (err?.code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
        throw Object.assign(new Error("Feed already exists"), {
          code: FEED_ALREADY_EXISTS_ERROR_CODE,
        })
      }
      throw error
    }
  }
  async getFeeds() {
    return await db.select().from(feed)
  }
  async deleteFeed(url: string) {
    const result = await db.delete(feed).where(eq(feed.url, url)).returning()
    if (result.length === 0) {
      throw new Error("Feed not found")
    }
    return result[0]
  }
  async updateFeed(url: string, title: string) {
    const [updatedFeed] = await db
      .update(feed)
      .set({ title })
      .where(eq(feed.url, url))
      .returning()

    if (!updatedFeed) {
      throw new Error("Feed not found")
    }

    return updatedFeed
  }
}

const feedService = new FeedService()

export default feedService
