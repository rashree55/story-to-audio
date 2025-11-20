-- DropForeignKey
ALTER TABLE "Script" DROP CONSTRAINT "Script_userId_fkey";

-- AlterTable
ALTER TABLE "Script" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Script" ADD CONSTRAINT "Script_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
