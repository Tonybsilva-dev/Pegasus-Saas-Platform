import { Queue } from "bullmq";

import { getRedisClient } from "../redis-client";

/**
 * Fila para processamento de geração de chaves de torneio (brackets)
 *
 * Esta fila gerencia jobs assíncronos para criar e atualizar chaves de torneio,
 * permitindo processamento em background sem bloquear a API.
 *
 * @see https://github.com/taskforcesh/bullmq/blob/master/docs/gitbook/guide/queues/README.md
 */
let bracketGenerationQueue: Queue | null = null;

/**
 * Retorna a instância singleton da fila de geração de chaves
 * Retorna null se Redis não estiver configurado
 */
export function getBracketGenerationQueue(): Queue | null {
  const redisClient = getRedisClient();

  if (!redisClient) {
    console.warn(
      "[BracketGenerationQueue] Redis não configurado. A fila não estará disponível."
    );
    return null;
  }

  if (!bracketGenerationQueue) {
    bracketGenerationQueue = new Queue("bracket-generation", {
      connection: redisClient,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000, // 2s, 4s, 8s
        },
        removeOnComplete: {
          age: 24 * 3600, // Manter jobs completos por 24 horas
          count: 1000, // Manter até 1000 jobs completos
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Manter jobs falhados por 7 dias
        },
      },
    });

    // Event listeners para monitoramento
    bracketGenerationQueue.on("error", (error) => {
      console.error("[BracketGenerationQueue] Erro:", error);
    });

    bracketGenerationQueue.on("waiting", (job) => {
      console.log(
        `[BracketGenerationQueue] Job ${job.id} aguardando processamento`
      );
    });

    bracketGenerationQueue.on("active", (job) => {
      console.log(
        `[BracketGenerationQueue] Job ${job.id} iniciado: ${job.name}`
      );
    });

    bracketGenerationQueue.on("completed", (job) => {
      console.log(
        `[BracketGenerationQueue] Job ${job.id} concluído: ${job.name}`
      );
    });

    bracketGenerationQueue.on("failed", (job, err) => {
      console.error(
        `[BracketGenerationQueue] Job ${job?.id} falhou: ${job?.name}`,
        err
      );
    });
  }

  return bracketGenerationQueue;
}

/**
 * Adiciona um job de geração de chave à fila
 *
 * @param eventId - ID do evento/torneio
 * @param modalityId - ID da modalidade
 * @param options - Opções adicionais do job (opcional)
 * @returns ID do job criado ou null se a fila não estiver disponível
 */
export async function addBracketGenerationJob(
  eventId: string,
  modalityId: string,
  options?: {
    priority?: number;
    delay?: number;
    jobId?: string;
  }
): Promise<string | null> {
  const queue = getBracketGenerationQueue();

  if (!queue) {
    return null;
  }

  const job = await queue.add(
    "generate-bracket",
    {
      eventId,
      modalityId,
      timestamp: new Date().toISOString(),
    },
    {
      jobId: options?.jobId,
      priority: options?.priority,
      delay: options?.delay,
    }
  );

  return job.id;
}

/**
 * Fecha a fila (útil para cleanup em testes ou shutdown)
 */
export async function closeBracketGenerationQueue(): Promise<void> {
  if (bracketGenerationQueue) {
    await bracketGenerationQueue.close();
    bracketGenerationQueue = null;
  }
}

/**
 * Reseta a fila (apenas para testes)
 * @internal
 */
export function resetBracketGenerationQueue(): void {
  bracketGenerationQueue = null;
}
