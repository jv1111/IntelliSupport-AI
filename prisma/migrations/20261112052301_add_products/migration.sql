-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('published', 'draft', 'archived');

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL DEFAULT 'Not specified',
    "status" "ProductStatus" NOT NULL DEFAULT 'draft',
    "imageUrl" TEXT,
    "description" TEXT NOT NULL DEFAULT 'No description provided.',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_userId_idx" ON "products"("userId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
