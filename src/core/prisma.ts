import { PrismaClient } from "@prisma/client";

import { env } from "./env";
import { logger } from "./logger";

/**
 * Global Prisma Client instance
 * Previne múltiplas instâncias em desenvolvimento devido ao hot-reloading do Next.js
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Cliente Prisma singleton
 * Reutiliza instância existente em desenvolvimento, cria nova em produção
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Conecta ao banco de dados e valida a conexão
 * Use este método para verificar a conexão antes de operações críticas
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info("Database connection established");
  } catch (error) {
    logger.error({ error }, "Failed to connect to database");
    throw error;
  }
}

/**
 * Desconecta do banco de dados
 * Use este método para limpar conexões ao encerrar a aplicação
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info("Database connection closed");
  } catch (error) {
    logger.error({ error }, "Failed to disconnect from database");
    throw error;
  }
}
