-- CreateTable
CREATE TABLE "password_reset_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "method" VARCHAR(16) NOT NULL,
    "destination" VARCHAR(254) NOT NULL,
    "verificationCodeHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "resetTokenHash" VARCHAR(64),
    "resetTokenExpiresAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_verifications_resetTokenHash_key" ON "password_reset_verifications"("resetTokenHash");

-- CreateIndex
CREATE INDEX "password_reset_verifications_userId_method_destination_idx" ON "password_reset_verifications"("userId", "method", "destination");

-- CreateIndex
CREATE INDEX "password_reset_verifications_expiresAt_idx" ON "password_reset_verifications"("expiresAt");

-- CreateIndex
CREATE INDEX "password_reset_verifications_resetTokenExpiresAt_idx" ON "password_reset_verifications"("resetTokenExpiresAt");

-- AddForeignKey
ALTER TABLE "password_reset_verifications" ADD CONSTRAINT "password_reset_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
