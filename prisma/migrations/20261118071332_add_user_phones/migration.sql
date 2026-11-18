-- CreateTable
CREATE TABLE "user_phones" (
    "id" TEXT NOT NULL,
    "phone" VARCHAR(16) NOT NULL,
    "userId" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_phones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unverified_phones" (
    "id" TEXT NOT NULL,
    "phone" VARCHAR(16) NOT NULL,
    "verificationCodeHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unverified_phones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_phones_phone_key" ON "user_phones"("phone");

-- CreateIndex
CREATE INDEX "user_phones_userId_idx" ON "user_phones"("userId");

-- CreateIndex
CREATE INDEX "unverified_phones_userId_phone_idx" ON "unverified_phones"("userId", "phone");

-- CreateIndex
CREATE INDEX "unverified_phones_expiresAt_idx" ON "unverified_phones"("expiresAt");

-- AddForeignKey
ALTER TABLE "user_phones" ADD CONSTRAINT "user_phones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unverified_phones" ADD CONSTRAINT "unverified_phones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
