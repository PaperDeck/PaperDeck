/*
  Warnings:

  - Made the column `pubDate` on table `Article` required. This step will fail if there are existing NULL values in that column.

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
    "pubDate" DATETIME NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "feedUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Article_feedUrl_fkey" FOREIGN KEY ("feedUrl") REFERENCES "Feed" ("url") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Article" ("content", "createdAt", "feedUrl", "id", "isRead", "link", "pubDate", "summary", "title") SELECT "content", "createdAt", "feedUrl", "id", "isRead", "link", "pubDate", "summary", "title" FROM "Article";
DROP TABLE "Article";
ALTER TABLE "new_Article" RENAME TO "Article";
CREATE INDEX "Article_pubDate_idx" ON "Article"("pubDate");
CREATE INDEX "Article_isRead_idx" ON "Article"("isRead");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
