/*
  Warnings:

  - You are about to drop the column `attemptCount` on the `password_reset_verifications` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "password_reset_verifications" DROP COLUMN "attemptCount";
