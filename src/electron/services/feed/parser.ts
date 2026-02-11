import { parseFeed } from "feedsmith"
import axios from "axios"
import type { Feed } from "../../../shared/types/feedParser"
import { normalizeFeed } from "./normalizer"
import { ParserError } from "../../../shared/types/feedParser"

export default async function feedParser(
  url: string,
  timeout: number = 5000,
): Promise<Feed> {
  let feedContent = ""
  const response = await axios.get(url, { timeout })
  feedContent = response.data
  try {
    // TODO: Specify format when calling to improve performance
    const { feed } = parseFeed(feedContent)
    return normalizeFeed(feed, url)
  } catch (_error) {
    throw new ParserError("Feed Parsing Error")
  }
}
