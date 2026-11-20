-- DropForeignKey
ALTER TABLE "auto_replies" DROP CONSTRAINT "auto_replies_groupId_fkey";

-- DropForeignKey
ALTER TABLE "auto_replies" DROP CONSTRAINT "auto_replies_parentId_fkey";

-- DropForeignKey
ALTER TABLE "auto_replies" DROP CONSTRAINT "auto_replies_productId_fkey";

-- DropForeignKey
ALTER TABLE "auto_reply_groups" DROP CONSTRAINT "auto_reply_groups_productId_fkey";

-- DropForeignKey
ALTER TABLE "bot_settings" DROP CONSTRAINT "bot_settings_userId_fkey";

-- DropTable
DROP TABLE "auto_replies";

-- DropTable
DROP TABLE "auto_reply_groups";

-- DropTable
DROP TABLE "bot_settings";
