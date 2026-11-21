-- CreateTable
CREATE TABLE "bot_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoRepliesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_replies" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "parentId" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_replies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bot_settings_userId_key" ON "bot_settings"("userId");

-- CreateIndex
CREATE INDEX "auto_replies_productId_parentId_position_idx" ON "auto_replies"("productId", "parentId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "auto_replies_productId_id_key" ON "auto_replies"("productId", "id");

-- AddForeignKey
ALTER TABLE "bot_settings" ADD CONSTRAINT "bot_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_replies" ADD CONSTRAINT "auto_replies_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_replies" ADD CONSTRAINT "auto_replies_productId_parentId_fkey" FOREIGN KEY ("productId", "parentId") REFERENCES "auto_replies"("productId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
