import { Job, Worker } from "bullmq";

import { getRedisClient } from "../core/redis-client";

/**
 * Worker para processar jobs de geração de chaves de torneio
 *
 * Este worker escuta a fila "bracket-generation" e processa jobs assíncronos
 * para criar e atualizar chaves de torneio (brackets).
 *
 * Para executar: `npm run dev:worker` ou `npm run build:worker`
 *
 * @see https://github.com/taskforcesh/bullmq/blob/master/docs/gitbook/guide/workers/README.md
 */

interface BracketGenerationJobData {
  eventId: string;
  modalityId: string;
  timestamp: string;
}

/**
 * Processa um job de geração de chave
 *
 * @param job - Job do BullMQ com dados do evento e modalidade
 * @returns Resultado do processamento
 */
async function processBracketGenerationJob(
  job: Job<BracketGenerationJobData>
): Promise<{ success: boolean; message: string }> {
  const { eventId, modalityId } = job.data;

  console.log(
    `[Worker] Processando geração de chave para evento ${eventId}, modalidade ${modalityId}`
  );

  // TODO: Implementar lógica de geração de chave
  // Por enquanto, apenas loga os dados
  // Futuramente, aqui será implementada a lógica de:
  // 1. Buscar times da modalidade
  // 2. Gerar estrutura de chave (bracket)
  // 3. Salvar no banco de dados
  // 4. Notificar usuários

  await job.updateProgress(50);
  console.log(`[Worker] Progresso: 50%`);

  // Simulação de processamento
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await job.updateProgress(100);
  console.log(`[Worker] Progresso: 100%`);

  return {
    success: true,
    message: `Chave gerada com sucesso para evento ${eventId}, modalidade ${modalityId}`,
  };
}

/**
 * Cria e inicia o worker
 *
 * @returns Instância do worker ou null se Redis não estiver configurado
 */
function createWorker(): Worker | null {
  const redisClient = getRedisClient();

  if (!redisClient) {
    console.error(
      "[Worker] Redis não configurado. Worker não pode ser iniciado."
    );
    return null;
  }

  const worker = new Worker<BracketGenerationJobData>(
    "bracket-generation",
    async (job) => {
      console.log(`[Worker] Job ${job.id} recebido: ${job.name}`);

      try {
        // Processa apenas jobs do tipo "generate-bracket"
        if (job.name === "generate-bracket") {
          const result = await processBracketGenerationJob(job);
          console.log(`[Worker] Job ${job.id} processado com sucesso`);
          return result;
        } else {
          throw new Error(`Tipo de job desconhecido: ${job.name}`);
        }
      } catch (error) {
        console.error(`[Worker] Erro ao processar job ${job.id}:`, error);
        throw error; // Re-throw para que o BullMQ trate o erro (retry, etc)
      }
    },
    {
      connection: redisClient,
      concurrency: 5, // Processa até 5 jobs simultaneamente
      limiter: {
        max: 10, // Máximo de 10 jobs por intervalo
        duration: 1000, // Intervalo de 1 segundo
      },
    }
  );

  // Event listeners para monitoramento
  worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} concluído com sucesso`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} falhou:`, err);
  });

  worker.on("error", (error) => {
    console.error("[Worker] Erro no worker:", error);
  });

  worker.on("stalled", (jobId) => {
    console.warn(`[Worker] Job ${jobId} travado (stalled)`);
  });

  console.log(
    "[Worker] Worker iniciado e escutando a fila 'bracket-generation'"
  );

  return worker;
}

/**
 * Inicia o worker e configura graceful shutdown
 */
async function startWorker(): Promise<void> {
  const worker = createWorker();

  if (!worker) {
    console.error(
      "[Worker] Não foi possível iniciar o worker. Redis não configurado."
    );
    process.exit(1);
  }

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    console.log(`[Worker] Recebido sinal ${signal}. Encerrando worker...`);

    try {
      await worker.close();
      console.log("[Worker] Worker encerrado com sucesso.");
      process.exit(0);
    } catch (error) {
      console.error("[Worker] Erro ao encerrar worker:", error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Manter o processo vivo
  process.on("unhandledRejection", (reason) => {
    console.error("[Worker] Unhandled Rejection:", reason);
  });

  console.log("[Worker] Worker rodando. Pressione Ctrl+C para encerrar.");
}

// Executa o worker se este arquivo for executado diretamente
if (require.main === module) {
  startWorker().catch((error) => {
    console.error("[Worker] Erro fatal ao iniciar worker:", error);
    process.exit(1);
  });
}

export { createWorker, startWorker };
