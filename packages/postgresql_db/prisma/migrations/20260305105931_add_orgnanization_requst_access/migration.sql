-- CreateTable
CREATE TABLE "OrganizationRequest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "organizationName" TEXT NOT NULL,
    "organizationSlug" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationRequest_organizationSlug_key" ON "OrganizationRequest"("organizationSlug");

-- AddForeignKey
ALTER TABLE "OrganizationRequest" ADD CONSTRAINT "OrganizationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
