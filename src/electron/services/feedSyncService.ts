import feedService from "@/electron/services/feedService"
import pLimit from "p-limit"
import feedParser from "@/electron/services/feedParser"
import { ParserError } from "@/shared/types/feedParser"
import articleService from "@/electron/services/articleService"

// TODO: Let user configure concurrency limit
const DEFAULT_CONCURRENCY_LIMIT = 25
const limit = pLimit(DEFAULT_CONCURRENCY_LIMIT)

export interface SyncResult {
  allFeeds: number
  successCount: number
  errorCount: number
  errors: ParserError[]
}

class FeedSyncService {
  async syncFeeds(): Promise<SyncResult> {
    const feeds = await feedService.getFeeds()
    const allErrors: ParserError[] = []
    let errorCount = 0
    const syncPromises = feeds.map((feed) =>
      limit(async () => {
        try {
          const parsedFeed = await feedParser(feed.url)
          await feedService.updateFeed(feed.url, parsedFeed.title ?? "")
          await articleService.saveArticles(feed.url, parsedFeed.items)
        } catch (error) {
          if (error instanceof ParserError) {
            allErrors.push(error)
          } else {
            console.error(`Unexpected error syncing feed ${feed.url}:`, error)
          }
          errorCount++
        }
      }),
    )
    await Promise.all(syncPromises)
    return {
      allFeeds: feeds.length,
      successCount: feeds.length - errorCount,
      errorCount,
      errors: allErrors,
    }
  }
}

const feedSyncService = new FeedSyncService()

export default feedSyncService
