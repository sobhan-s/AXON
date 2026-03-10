/*
  Warnings:

  - Added the required column `organizationId` to the `project_team_members` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ActivityAction" ADD VALUE 'ORG_DELETED';

-- AlterTable
ALTER TABLE "project_team_members" ADD COLUMN     "organizationId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "project_team_members" ADD CONSTRAINT "project_team_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
