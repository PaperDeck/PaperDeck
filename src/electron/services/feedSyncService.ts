import feedService from "./feedService"
import pLimit from "p-limit"
import feedParser, { ParserError } from "../utils/feedParser"
import articleService from "./articleService"
import axios from "axios"

// TODO: Let user configure concurrency limit
const DEFAULT_CONCURRENCY_LIMIT = 25
const limit = pLimit(DEFAULT_CONCURRENCY_LIMIT)

class FeedSyncService {
  async syncFeeds() {
    const feeds = await feedService.getFeeds()
    const syncPromises = feeds.map((feed) =>
      limit(async () => {
        try {
          const parsedFeed = await feedParser(feed.url)
          await feedService.updateFeed(feed.id, parsedFeed.title, feed.url)
          await articleService.saveArticles(feed.id, parsedFeed.items)
        } catch (error) {
          if (error instanceof ParserError) {
            console.error(`Failed to parse feed ${feed.url}: ${error.message}`)
          } else if (axios.isAxiosError(error)) {
            console.error(
              `Network error while fetching feed ${feed.url}: ${error.message}`,
            )
          } else {
            console.error(
              `Unexpected error while syncing feed ${feed.url}: ${error}`,
            )
          }
        }
      }),
    )
    await Promise.all(syncPromises)
  }
}

const feedSyncService = new FeedSyncService()

export default feedSyncService
