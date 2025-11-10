-- Migration: Make tenantId optional in User, Session, and Account
-- This allows users to be created without a tenant and complete onboarding later

-- Alter users table to make tenantId nullable
ALTER TABLE "users" ALTER COLUMN "tenantId" DROP NOT NULL;

-- Alter sessions table to make tenantId nullable
ALTER TABLE "sessions" ALTER COLUMN "tenantId" DROP NOT NULL;

-- Alter accounts table to make tenantId nullable
ALTER TABLE "accounts" ALTER COLUMN "tenantId" DROP NOT NULL;

-- Note: The unique constraint on (tenantId, email) in users table
-- will automatically allow multiple null values (PostgreSQL behavior)

