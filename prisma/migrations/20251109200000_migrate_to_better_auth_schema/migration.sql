-- Migration: Adaptar schema para Better Auth mantendo multi-tenant
-- Esta migration migra os dados existentes antes de remover campos antigos

-- ============================================
-- 1. MIGRAR TABELA USERS
-- ============================================

-- Converter emailVerified de DateTime? para Boolean
-- Se emailVerified não é null, significa que foi verificado (true)
-- Se emailVerified é null, significa que não foi verificado (false)
ALTER TABLE "users" 
  ADD COLUMN "emailVerified_new" BOOLEAN NOT NULL DEFAULT false;

UPDATE "users" 
  SET "emailVerified_new" = CASE 
    WHEN "emailVerified" IS NOT NULL THEN true 
    ELSE false 
  END;

-- Tornar name obrigatório (Better Auth requer)
-- Se name for null, usar email como fallback
UPDATE "users" 
  SET "name" = COALESCE("name", "email")
  WHERE "name" IS NULL;

ALTER TABLE "users" 
  ALTER COLUMN "name" SET NOT NULL;

-- Remover coluna antiga e renomear nova
ALTER TABLE "users" 
  DROP COLUMN "emailVerified";

ALTER TABLE "users" 
  RENAME COLUMN "emailVerified_new" TO "emailVerified";

-- Ajustar updatedAt para ter default now()
ALTER TABLE "users" 
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- ============================================
-- 2. MIGRAR TABELA SESSIONS
-- ============================================

-- Adicionar novos campos
ALTER TABLE "sessions" 
  ADD COLUMN "token" TEXT,
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "ipAddress" TEXT,
  ADD COLUMN "userAgent" TEXT;

-- Migrar dados: sessionToken -> token, expires -> expiresAt
UPDATE "sessions" 
  SET 
    "token" = "sessionToken",
    "expiresAt" = "expires";

-- Remover campos antigos
ALTER TABLE "sessions" 
  DROP COLUMN "sessionToken",
  DROP COLUMN "expires";

-- Tornar campos obrigatórios
ALTER TABLE "sessions" 
  ALTER COLUMN "token" SET NOT NULL,
  ALTER COLUMN "expiresAt" SET NOT NULL;

-- Criar unique constraint em token
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- Remover índice antigo se existir
DROP INDEX IF EXISTS "sessions_sessionToken_key";

-- ============================================
-- 3. MIGRAR TABELA ACCOUNTS
-- ============================================

-- Adicionar novos campos
ALTER TABLE "accounts" 
  ADD COLUMN "accountId" TEXT,
  ADD COLUMN "providerId" TEXT,
  ADD COLUMN "accessToken" TEXT,
  ADD COLUMN "refreshToken" TEXT,
  ADD COLUMN "idToken" TEXT,
  ADD COLUMN "accessTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN "refreshTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN "password" TEXT;

-- Migrar dados dos campos antigos para os novos
UPDATE "accounts" 
  SET 
    "accountId" = "providerAccountId",
    "providerId" = "provider",
    "accessToken" = "access_token",
    "refreshToken" = "refresh_token",
    "idToken" = "id_token",
    "accessTokenExpiresAt" = CASE 
      WHEN "expires_at" IS NOT NULL 
      THEN to_timestamp("expires_at") 
      ELSE NULL 
    END;

-- Tornar campos obrigatórios
ALTER TABLE "accounts" 
  ALTER COLUMN "accountId" SET NOT NULL,
  ALTER COLUMN "providerId" SET NOT NULL;

-- Remover campos antigos
ALTER TABLE "accounts" 
  DROP COLUMN "providerAccountId",
  DROP COLUMN "provider",
  DROP COLUMN "access_token",
  DROP COLUMN "refresh_token",
  DROP COLUMN "expires_at",
  DROP COLUMN "token_type",
  DROP COLUMN "type",
  DROP COLUMN "session_state";

-- Remover unique constraint antigo e criar novo
DROP INDEX IF EXISTS "accounts_provider_providerAccountId_key";
CREATE UNIQUE INDEX "accounts_providerId_accountId_key" ON "accounts"("providerId", "accountId");

