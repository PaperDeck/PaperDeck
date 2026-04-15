import { relations, sql } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const feed = sqliteTable("Feed", {
  url: text("url").primaryKey(),
  title: text("title").notNull(),
  createdAt: text("createdAt")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
})

export const article = sqliteTable(
  "Article",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    link: text("link").notNull(),
    summary: text("summary"),
    content: text("content"),
    pubDate: text("pubDate").notNull(),
    isRead: integer("isRead", { mode: "boolean" }).notNull().default(false),
    feedUrl: text("feedUrl")
      .notNull()
      .references(() => feed.url, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: text("createdAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("Article_pubDate_id_idx").on(table.pubDate, table.id),
    index("Article_isRead_idx").on(table.isRead),
  ],
)

export const feedRelations = relations(feed, ({ many }) => ({
  articles: many(article),
}))

export const articleRelations = relations(article, ({ one }) => ({
  feed: one(feed, {
    fields: [article.feedUrl],
    references: [feed.url],
  }),
}))

export type Feed = typeof feed.$inferSelect
export type NewFeed = typeof feed.$inferInsert

export type Article = typeof article.$inferSelect
export type NewArticle = typeof article.$inferInsert
