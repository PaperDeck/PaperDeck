import Parser from "rss-parser"
export default interface FeedItem extends Parser.Item {
  "content:encoded"?: string
}
