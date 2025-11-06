import pino from "pino";

/**
 * Obtém o nível de log baseado no ambiente
 */
function getLogLevel(): string {
  const nodeEnv = process.env.NODE_ENV || "development";
  return nodeEnv === "production" ? "info" : "debug";
}

/**
 * Configuração do logger Pino
 * Singleton pattern para garantir uma única instância do logger
 */
const loggerConfig: pino.LoggerOptions = {
  level: getLogLevel(),
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  base: {
    env: process.env.NODE_ENV || "development",
  },
};

/**
 * Instância singleton do logger Pino
 * Use este logger em toda a aplicação para logs padronizados
 */
export const logger = pino(loggerConfig);

/**
 * Tipos úteis para logs estruturados
 */
export type LogContext = {
  tenantId?: string;
  userId?: string;
  eventId?: string;
  [key: string]: unknown;
};

/**
 * Helper para criar logs com contexto de tenant
 */
export function createTenantLogger(tenantId: string) {
  return logger.child({ tenantId });
}

/**
 * Helper para criar logs com contexto de usuário
 */
export function createUserLogger(userId: string, tenantId?: string) {
  return logger.child({ userId, tenantId });
}
