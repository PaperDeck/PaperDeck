import Parser from "rss-parser"
import type { Feed, FeedItem } from "@/shared/types/feedParser"
import { ParserError } from "@/shared/types/feedParser"
import hashString from "@/electron/utils/hash"

export default async function feedParser(
  url: string,
  timeout: number = 5000,
): Promise<Feed> {
  const parser = new Parser({
    timeout,
    customFields: {
      item: [
        ["media:content", "mediaContent"],
        ["content:encoded", "contentEncoded"],
      ],
    },
  })

  try {
    const feed = await parser.parseURL(url)
    // Only enrich items with id, datePublished, and image
    return {
      ...feed,
      items: feed.items.map(enrichItem),
    }
  } catch (_error) {
    throw new ParserError("Feed Parsing Error")
  }
}

// Export for testing
export function enrichItem(item: Parser.Item & {contentEncoded?: string, mediaContent?: {url: string}}): FeedItem {
  // Generate ID from guid, link, or hash as fallback
  const id = item.guid ?? item.link ?? hashString([item.pubDate, item.isoDate, item.title].filter(Boolean).join("|"))
  
  // Convert date string to Date object
  let datePublished: Date | undefined
  const rawDate = item.pubDate ?? item.isoDate
  if (rawDate) {
    const parsed = new Date(rawDate)
    datePublished = !isNaN(parsed.getTime()) ? parsed : undefined
  }
  
  // Extract image URL
  const image = item.enclosure?.url ?? item.mediaContent?.url ?? ""
  
  return {
    ...item,
    id,
    datePublished,
    image,
  }
}
