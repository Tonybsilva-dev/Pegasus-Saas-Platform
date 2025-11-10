-- CreateEnum
CREATE TYPE "TenantApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "approvalStatus" "TenantApprovalStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "tenants" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "tenants" ADD COLUMN "approvedById" TEXT;
ALTER TABLE "tenants" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "tenants" ADD COLUMN "otpCode" TEXT;
ALTER TABLE "tenants" ADD COLUMN "otpExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_otpCode_key" ON "tenants"("otpCode") WHERE "otpCode" IS NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "approvalStatus" "TenantApprovalStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "users" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "approvedById" TEXT;
ALTER TABLE "users" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "users" ADD COLUMN "documentNumber" TEXT;

