-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_organizationId_fkey";

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
