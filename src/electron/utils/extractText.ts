import * as cheerio from "cheerio"

export default function extractText(html: string): string {
  if (!html) return ""
  const $ = cheerio.load(html)
  const text = $.text()
  return text.replace(/\s+/g, " ").trim()
}
