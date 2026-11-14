ALTER TABLE "knowledge_base_articles"
ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'published';

ALTER TABLE "knowledge_base_articles"
ALTER COLUMN "status" SET DEFAULT 'draft';
