import Parser from "rss-parser"
import { ParserError } from "@/shared/types/feedParser"
import axios from "axios"

export default async function feedParser(url: string, timeout: number = 10000) {
  const parser = new Parser({
    customFields: {
      item: ["content:encoded"],
    },
  })

  try {
    const response = await axios.get(url, {
      timeout: timeout,
      responseType: "text",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        Accept: "application/xml, text/xml, */*",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    })
    const feed = await parser.parseString(response.data)
    return feed
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        throw new ParserError("Feed Parsing Timeout")
      } else if (error.response) {
        throw new ParserError(
          `HTTP Error: ${error.response.status}`,
          error.response.status,
        )
      } else {
        throw new ParserError(`Network Error: ${error.message}`)
      }
    }
    throw new ParserError("Feed Parsing Error")
  }
}

type ParserOutputType = Parser.Output<Record<string, unknown>> & {
  items: (Parser.Item & { "content:encoded": string })[]
}

export type { ParserOutputType }
