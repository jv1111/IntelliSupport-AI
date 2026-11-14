-- CreateEnum
CREATE TYPE "ArticleScope" AS ENUM ('generic', 'specific');

-- CreateEnum
CREATE TYPE "ArticleCategoryTag" AS ENUM ('troubleshooting', 'installation_setup', 'others');

-- CreateTable
CREATE TABLE "knowledge_base_articles" (
    "id" TEXT NOT NULL,
    "scope" "ArticleScope" NOT NULL,
    "categoryTag" "ArticleCategoryTag" NOT NULL,
    "title" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_base_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "knowledge_base_articles_userId_createdAt_idx" ON "knowledge_base_articles"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "knowledge_base_articles" ADD CONSTRAINT "knowledge_base_articles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
