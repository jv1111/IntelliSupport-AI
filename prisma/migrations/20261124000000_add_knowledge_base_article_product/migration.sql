ALTER TABLE "knowledge_base_articles"
ADD COLUMN "productId" TEXT;

CREATE INDEX "knowledge_base_articles_productId_idx"
ON "knowledge_base_articles"("productId");

ALTER TABLE "knowledge_base_articles"
ADD CONSTRAINT "knowledge_base_articles_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "products"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
