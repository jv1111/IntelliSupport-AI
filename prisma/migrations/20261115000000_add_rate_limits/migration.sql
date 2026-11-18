CREATE TABLE "rate_limits" (
    "key" VARCHAR(64) NOT NULL,
    "count" INTEGER NOT NULL,
    "window_started_at" TIMESTAMPTZ(3) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "rate_limits_expires_at_idx" ON "rate_limits"("expires_at");
