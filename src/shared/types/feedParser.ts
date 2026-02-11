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
  link: string
  content: string
  summary: string
  datePublished?: Date
  image: string
  rawDate: string
}

export class ParserError extends Error {
  statusCode?: number
  constructor(message: string) {
    super(message)
  }
}
