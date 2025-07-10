-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ONLINE', 'AFK', 'OFFLINE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "about" TEXT,
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'OFFLINE';
