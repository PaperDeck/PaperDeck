/*
  Warnings:

  - You are about to drop the column `feedId` on the `Article` table. All the data in the column will be lost.
  - The primary key for the `Feed` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Feed` table. All the data in the column will be lost.
  - Added the required column `feedUrl` to the `Article` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "pubDate" DATETIME,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "feedUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Article_feedUrl_fkey" FOREIGN KEY ("feedUrl") REFERENCES "Feed" ("url") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Article" ("content", "createdAt", "id", "isRead", "link", "pubDate", "summary", "title") SELECT "content", "createdAt", "id", "isRead", "link", "pubDate", "summary", "title" FROM "Article";
DROP TABLE "Article";
ALTER TABLE "new_Article" RENAME TO "Article";
CREATE UNIQUE INDEX "Article_link_key" ON "Article"("link");
CREATE INDEX "Article_pubDate_idx" ON "Article"("pubDate");
CREATE INDEX "Article_isRead_idx" ON "Article"("isRead");
CREATE TABLE "new_Feed" (
    "url" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Feed" ("createdAt", "title", "url") SELECT "createdAt", "title", "url" FROM "Feed";
DROP TABLE "Feed";
ALTER TABLE "new_Feed" RENAME TO "Feed";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
