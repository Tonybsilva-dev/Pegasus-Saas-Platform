import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock BullMQ
const mockUpdateProgress = vi.fn(async () => {});
const mockJob = {
  id: "job_123",
  name: "generate-bracket",
  data: {
    eventId: "event_123",
    modalityId: "modality_456",
    timestamp: "2025-11-06T12:00:00.000Z",
  },
  updateProgress: mockUpdateProgress,
};

const mockOn = vi.fn();
const mockClose = vi.fn(async () => {});
const mockWorker = vi.fn((_queueName, processor) => {
  // Simular processamento de job
  if (processor && typeof processor === "function") {
    // Chamar o processor com o job mockado
    setTimeout(() => {
      processor(mockJob).catch(() => {
        // Ignorar erros em testes
      });
    }, 0);
  }

  return {
    on: mockOn,
    close: mockClose,
  };
});

vi.mock("bullmq", () => ({
  Worker: mockWorker,
}));

// Mock redis-client
const mockRedisClient = {
  ping: vi.fn(async () => "PONG"),
  quit: vi.fn(async () => "OK"),
  on: vi.fn(),
};

const mockGetRedisClient = vi.fn(() => mockRedisClient);

vi.mock("../../src/core/redis-client", () => ({
  getRedisClient: mockGetRedisClient,
}));

describe("worker", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("deve criar um worker quando Redis está disponível", async () => {
    const { createWorker } = await import("../../src/jobs/worker");

    const worker = createWorker();

    expect(worker).toBeDefined();
    expect(mockWorker).toHaveBeenCalledWith(
      "bracket-generation",
      expect.any(Function),
      {
        connection: mockRedisClient,
        concurrency: 5,
        limiter: {
          max: 10,
          duration: 1000,
        },
      }
    );
  });

  it("deve retornar null quando Redis não está disponível", async () => {
    // @ts-expect-error - Mock pode retornar null para simular Redis não disponível
    mockGetRedisClient.mockReturnValueOnce(null);

    const { createWorker } = await import("../../src/jobs/worker");

    const worker = createWorker();

    expect(worker).toBeNull();
    expect(mockWorker).not.toHaveBeenCalled();
  });

  it("deve processar job do tipo generate-bracket", async () => {
    const { createWorker } = await import("../../src/jobs/worker");

    const worker = createWorker();
    expect(worker).toBeDefined();

    // O processor é chamado automaticamente pelo mock
    // Aguardar um pouco para o processamento assíncrono
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verificar que o worker foi criado com o processor correto
    expect(mockWorker).toHaveBeenCalled();
    const processorCall = mockWorker.mock.calls[0];
    expect(processorCall[0]).toBe("bracket-generation");
    expect(typeof processorCall[1]).toBe("function");
  });

  it("deve registrar event listeners no worker", async () => {
    const { createWorker } = await import("../../src/jobs/worker");

    const worker = createWorker();
    expect(worker).toBeDefined();

    // Verificar que os event listeners foram registrados
    expect(mockOn).toHaveBeenCalledWith("completed", expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith("failed", expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith("error", expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith("stalled", expect.any(Function));
  });

  it("deve fechar o worker corretamente", async () => {
    const { createWorker } = await import("../../src/jobs/worker");

    const worker = createWorker();
    expect(worker).toBeDefined();

    if (worker) {
      await worker.close();
      expect(mockClose).toHaveBeenCalled();
    }
  });

  it("deve atualizar progresso durante processamento", async () => {
    // Este teste verifica que o processor atualiza o progresso
    const { createWorker } = await import("../../src/jobs/worker");

    const worker = createWorker();
    expect(worker).toBeDefined();

    // Aguardar processamento
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Verificar que updateProgress foi chamado
    // Nota: O mock do job precisa ser acessado através do processor
    expect(mockUpdateProgress).toHaveBeenCalled();
  });
});
