/*
  Warnings:

  - Added the required column `projectId` to the `approvals` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ActivityAction" ADD VALUE 'TASK_DELITED';

-- AlterTable
ALTER TABLE "approvals" ADD COLUMN     "projectId" INTEGER NOT NULL;
