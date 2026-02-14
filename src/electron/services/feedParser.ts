import Parser from "rss-parser"
import { ParserError } from "@/shared/types/feedParser"

const parser = new Parser({ timeout: 5000 })

export default async function feedParser(
  url: string,
  timeout: number = 5000,
): Promise<Parser.Output<Record<string, unknown>>> {
  try {
    const parserWithTimeout = new Parser({ timeout })
    const feed = await parserWithTimeout.parseURL(url)
    return feed
  } catch (_error) {
    throw new ParserError("Feed Parsing Error")
  }
}
