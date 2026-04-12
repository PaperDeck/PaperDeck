-- CreateTable
CREATE TABLE "Feed" (
    "url" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Article" (
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

-- CreateIndex
CREATE INDEX "Article_pubDate_id_idx" ON "Article"("pubDate", "id");

-- CreateIndex
CREATE INDEX "Article_isRead_idx" ON "Article"("isRead");
