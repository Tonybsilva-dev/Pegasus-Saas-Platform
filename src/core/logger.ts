import pino from "pino";

import { env } from "./env";

/**
 * Obtém o nível de log baseado no ambiente
 */
function getLogLevel(): string {
  return env.NODE_ENV === "production" ? "info" : "debug";
}

/**
 * Configuração do logger Pino
 * Singleton pattern para garantir uma única instância do logger
 *
 * Nota: pino-pretty com thread-stream pode causar problemas no Next.js
 * Por isso, usamos formatação simples em desenvolvimento
 */
const loggerConfig: pino.LoggerOptions = {
  level: getLogLevel(),
  // Desabilitar transporte pino-pretty para evitar problemas com thread-stream no Next.js
  // Em vez disso, usar formatação básica que funciona bem no Next.js
  transport: undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  base: {
    env: env.NODE_ENV,
  },
  // Em desenvolvimento, usar formato mais legível sem pino-pretty
  ...(env.NODE_ENV !== "production" && {
    serializers: pino.stdSerializers,
  }),
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
