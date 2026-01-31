import { parseFeed } from "feedsmith"
import axios from "axios"
import hashString from "./hash"

export default async function feedParser(url: string): Promise<Feed> {
  let feedContent = ""
  try {
    const response = await axios.get(url)
    feedContent = response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new ParserError(
          `Server returned ${error.response.status} for ${url}`,
          error.response.status,
        )
      } else {
        throw new ParserError("Failed to receive response from feed URL")
      }
    } else {
      throw error
    }
  }
  try {
    // TODO: Specify format when calling to improve performance
    const { feed } = parseFeed(feedContent)
    return normalizeFeed(feed, url)
  } catch (_error) {
    throw new ParserError("Feed Parsing Error")
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeFeed(feed: any, url: string): Feed {
  return {
    title: feed.title ?? "",
    description: feed.description ?? feed.subtitle ?? "",
    link: feed.home_page_url ?? feed.link ?? "",
    feedUrl: url,
    language: feed.language ?? "",
    image: feed.icon ?? feed.favicon ?? feed.image?.url ?? "",
    items: Array.isArray(feed.items) ? feed.items.map(normalizeItem) : [],
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeItem(item: any): FeedItem {
  return {
    title: item.title ?? "",
    link: item.link ?? "",
    content:
      item.content_text ??
      item.content_html ??
      item.content ??
      item.description ??
      item.summary ??
      "",
    datePublished:
      item.date_published ?? item.published ?? item.pubDate ?? item.date ?? "",
    image: item.image ?? item.enclosure?.url ?? item.mediaContent?.url ?? "",
    id:
      item.id ??
      item.link ??
      hashString(item.title ?? item.description ?? JSON.stringify(item)),
  }
}

export interface Feed {
  title: string
  description?: string
  link?: string
  feedUrl?: string
  language?: string
  items: FeedItem[]
  image?: string
}

export interface FeedItem {
  id: string
  title: string
  link?: string
  content?: string
  datePublished?: string
  author?: string
  image?: string
}

class ParserError extends Error {
  statusCode?: number
  constructor(message: string, statusCode?: number) {
    super(message)
    this.statusCode = statusCode
  }
}
