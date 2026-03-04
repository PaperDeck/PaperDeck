-- DropIndex
DROP INDEX "Article_pubDate_idx";

-- CreateIndex
CREATE INDEX "Article_pubDate_id_idx" ON "Article"("pubDate", "id");
