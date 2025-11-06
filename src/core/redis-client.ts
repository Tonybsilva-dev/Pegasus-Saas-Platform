import Redis from "ioredis";

import { env } from "./env";

/**
 * Cliente Redis singleton para uso em toda a aplicação
 * Reutiliza a mesma conexão para múltiplas filas e workers
 *
 * @see https://github.com/taskforcesh/bullmq/blob/master/docs/gitbook/guide/connections.md
 */
let redisClient: Redis | null = null;

/**
 * Cria ou retorna a instância do cliente Redis
 * Se REDIS_URL não estiver configurada, retorna null
 */
export function getRedisClient(): Redis | null {
  if (!env.REDIS_URL) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // Necessário para BullMQ workers
      enableReadyCheck: true,
      lazyConnect: false,
    });

    // Event listeners para debug
    redisClient.on("connect", () => {
      console.log("[Redis] Conectado ao servidor Redis");
    });

    redisClient.on("error", (error) => {
      console.error("[Redis] Erro na conexão:", error);
    });

    redisClient.on("close", () => {
      console.log("[Redis] Conexão fechada");
    });
  }

  return redisClient;
}

/**
 * Fecha a conexão Redis (útil para cleanup em testes ou shutdown)
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Reseta o cliente Redis (apenas para testes)
 * @internal
 */
export function resetRedisClient(): void {
  redisClient = null;
}

/**
 * Verifica se o Redis está disponível
 * Útil para health checks
 */
export async function isRedisAvailable(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    await client.ping();
    return true;
  } catch {
    return false;
  }
}
