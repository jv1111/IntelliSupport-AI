/*
  Warnings:

  - You are about to drop the `rate_limits` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "rate_limits";

-- CreateTable
CREATE TABLE "user_emails" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "userId" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unverified_emails" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "verificationCodeHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unverified_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_emails_email_key" ON "user_emails"("email");

-- CreateIndex
CREATE INDEX "user_emails_userId_idx" ON "user_emails"("userId");

-- CreateIndex
CREATE INDEX "unverified_emails_userId_email_idx" ON "unverified_emails"("userId", "email");

-- CreateIndex
CREATE INDEX "unverified_emails_expiresAt_idx" ON "unverified_emails"("expiresAt");

-- AddForeignKey
ALTER TABLE "user_emails" ADD CONSTRAINT "user_emails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unverified_emails" ADD CONSTRAINT "unverified_emails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
