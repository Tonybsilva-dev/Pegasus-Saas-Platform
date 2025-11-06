import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock BullMQ
const mockAdd = vi.fn(async () => ({ id: "job_123" }));
const mockClose = vi.fn(async () => {});
const mockOn = vi.fn();
const mockQueue = vi.fn(() => ({
  add: mockAdd,
  close: mockClose,
  on: mockOn,
}));

vi.mock("bullmq", () => ({
  Queue: mockQueue,
}));

// Mock redis-client
const mockRedisClient = {
  ping: vi.fn(async () => "PONG"),
  quit: vi.fn(async () => "OK"),
  on: vi.fn(),
};

const mockGetRedisClient = vi.fn(() => mockRedisClient);

vi.mock("../../../src/core/redis-client", () => ({
  getRedisClient: mockGetRedisClient,
}));

describe("bracket-generation queue", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Resetar o singleton antes de cada teste
    const { resetBracketGenerationQueue } = await import(
      "../../../src/core/queues/bracket-generation"
    );
    resetBracketGenerationQueue();
  });

  it("deve criar uma instância da fila quando Redis está disponível", async () => {
    const { getBracketGenerationQueue } = await import(
      "../../../src/core/queues/bracket-generation"
    );

    const queue = getBracketGenerationQueue();

    expect(queue).toBeDefined();
    expect(mockQueue).toHaveBeenCalledWith("bracket-generation", {
      connection: mockRedisClient,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 3600,
          count: 1000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600,
        },
      },
    });
  });

  it("deve retornar null quando Redis não está disponível", async () => {
    // @ts-expect-error - Mock pode retornar null para simular Redis não disponível
    mockGetRedisClient.mockReturnValueOnce(null);

    const { getBracketGenerationQueue } = await import(
      "../../../src/core/queues/bracket-generation"
    );

    const queue = getBracketGenerationQueue();

    expect(queue).toBeNull();
    expect(mockQueue).not.toHaveBeenCalled();
  });

  it("deve reutilizar a mesma instância (singleton)", async () => {
    const { getBracketGenerationQueue } = await import(
      "../../../src/core/queues/bracket-generation"
    );

    const queue1 = getBracketGenerationQueue();
    const queue2 = getBracketGenerationQueue();

    expect(queue1).toBe(queue2);
    // Queue deve ser chamado apenas uma vez devido ao singleton
    expect(mockQueue).toHaveBeenCalledTimes(1);
  });

  it("deve adicionar um job à fila com sucesso", async () => {
    const { addBracketGenerationJob } = await import(
      "../../../src/core/queues/bracket-generation"
    );

    const jobId = await addBracketGenerationJob("event_123", "modality_456");

    expect(jobId).toBe("job_123");
    expect(mockAdd).toHaveBeenCalledWith(
      "generate-bracket",
      {
        eventId: "event_123",
        modalityId: "modality_456",
        timestamp: expect.any(String),
      },
      {
        jobId: undefined,
        priority: undefined,
        delay: undefined,
      }
    );
  });

  it("deve adicionar um job com opções customizadas", async () => {
    const { addBracketGenerationJob } = await import(
      "../../../src/core/queues/bracket-generation"
    );

    const jobId = await addBracketGenerationJob("event_123", "modality_456", {
      priority: 10,
      delay: 5000,
      jobId: "custom_job_id",
    });

    expect(jobId).toBe("job_123");
    expect(mockAdd).toHaveBeenCalledWith(
      "generate-bracket",
      {
        eventId: "event_123",
        modalityId: "modality_456",
        timestamp: expect.any(String),
      },
      {
        jobId: "custom_job_id",
        priority: 10,
        delay: 5000,
      }
    );
  });

  it("deve retornar null ao adicionar job quando Redis não está disponível", async () => {
    // @ts-expect-error - Mock pode retornar null para simular Redis não disponível
    mockGetRedisClient.mockReturnValueOnce(null);

    const { addBracketGenerationJob } = await import(
      "../../../src/core/queues/bracket-generation"
    );

    const jobId = await addBracketGenerationJob("event_123", "modality_456");

    expect(jobId).toBeNull();
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("deve fechar a fila corretamente", async () => {
    const { getBracketGenerationQueue, closeBracketGenerationQueue } =
      await import("../../../src/core/queues/bracket-generation");

    getBracketGenerationQueue();
    await closeBracketGenerationQueue();

    expect(mockClose).toHaveBeenCalled();
  });
});
