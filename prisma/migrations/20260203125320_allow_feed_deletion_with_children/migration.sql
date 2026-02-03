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
    "feedId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Article_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Article" ("content", "createdAt", "feedId", "id", "isRead", "link", "pubDate", "summary", "title") SELECT "content", "createdAt", "feedId", "id", "isRead", "link", "pubDate", "summary", "title" FROM "Article";
DROP TABLE "Article";
ALTER TABLE "new_Article" RENAME TO "Article";
CREATE UNIQUE INDEX "Article_link_key" ON "Article"("link");
CREATE INDEX "Article_pubDate_idx" ON "Article"("pubDate");
CREATE INDEX "Article_isRead_idx" ON "Article"("isRead");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
