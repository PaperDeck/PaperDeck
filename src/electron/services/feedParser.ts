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
    return normalizeFeed(feed, url)
  } catch (_error) {
    throw new ParserError("Feed Parsing Error")
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeFeed(feed: any, url: string): Feed {
  const rawItems = feed.items ?? []
  
  // Extract image URL ensuring it's always a string
  let imageUrl = ""
  if (feed.image) {
    if (typeof feed.image === "string") {
      imageUrl = feed.image
    } else if (feed.image.url) {
      imageUrl = feed.image.url
    } else if (feed.image.link) {
      imageUrl = feed.image.link
    }
  }
  if (!imageUrl && feed.itunes?.image) {
    imageUrl = feed.itunes.image
  }
  
  return {
    title: feed.title ?? "",
    description: feed.description ?? "",
    link: feed.link ?? "",
    feedUrl: url,
    language: feed.language ?? "",
    image: imageUrl,
    items: Array.isArray(rawItems) ? rawItems.map(normalizeItem) : [],
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeItem(item: any): FeedItem {
  const fallbackSource = [item.pubDate, item.isoDate, item.title]
    .filter(Boolean)
    .join("|")
  const rawDate = item.pubDate ?? item.isoDate ?? ""
  let datePublished = undefined
  if (rawDate) {
    const parsed = new Date(rawDate)
    datePublished = !isNaN(parsed.getTime()) ? parsed : undefined
  }
  return {
    title: item.title ?? "",
    link: item.link ?? "",
    content:
      item.contentEncoded ??
      item.content ??
      item.contentSnippet ??
      item.summary ??
      "",
    summary: item.contentSnippet ?? item.summary ?? "",
    rawDate: rawDate,
    datePublished,
    image: item.enclosure?.url ?? item.mediaContent?.url ?? "",
    id: item.guid ?? item.link ?? hashString(fallbackSource),
  }
}
