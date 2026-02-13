import type Parser from "rss-parser"

// Custom fields we extract from RSS feeds
type CustomFields = {
  contentEncoded?: string
  mediaContent?: { url: string }
}

// Feed type extends rss-parser's Output with our custom fields
export type Feed = Parser.Output<CustomFields> & {
  items: FeedItem[]
}

// FeedItem extends rss-parser's Item with required fields we need
export interface FeedItem extends Parser.Item {
  id: string // Generated from guid, link, or hash (required for database)
  datePublished?: Date // Converted from pubDate/isoDate string
  image: string // Extracted from enclosure/mediaContent
}

export class ParserError extends Error {
  statusCode?: number
  constructor(message: string) {
    super(message)
  }
}
