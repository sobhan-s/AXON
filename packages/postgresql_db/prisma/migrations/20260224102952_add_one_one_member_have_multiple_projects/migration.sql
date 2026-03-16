/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,userId]` on the table `project_team_members` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "project_team_members_projectId_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "project_team_members_organizationId_userId_key" ON "project_team_members"("organizationId", "userId");
