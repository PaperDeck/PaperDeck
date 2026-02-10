import { parseFeed } from "feedsmith"
import axios from "axios"
import type { Feed } from "./types"
import { normalizeFeed } from "./normalizer"
import { ParserError } from "./types"

export default async function feedParser(
  url: string,
  timeout: number = 5000,
  signal?: AbortSignal,
): Promise<Feed> {
  let feedContent = ""
  const response = await axios.get(url, { timeout, signal })
  feedContent = response.data
  try {
    // TODO: Specify format when calling to improve performance
    const { feed } = parseFeed(feedContent)
    return normalizeFeed(feed, url)
  } catch (_error) {
    throw new ParserError("Feed Parsing Error")
  }
}
