/*
  Warnings:

  - You are about to drop the column `userId` on the `Script` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Script" DROP CONSTRAINT "Script_userId_fkey";

-- AlterTable
ALTER TABLE "Script" DROP COLUMN "userId";
