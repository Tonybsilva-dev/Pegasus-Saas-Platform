import { beforeEach, describe, expect, it, vi } from "vitest";

describe("redis-client", () => {
  let mockPing: ReturnType<typeof vi.fn>;
  let mockQuit: ReturnType<typeof vi.fn>;
  let mockOn: ReturnType<typeof vi.fn>;
  let mockRedis: ReturnType<typeof vi.fn>;
  let mockRedisInstance: {
    ping: ReturnType<typeof vi.fn>;
    quit: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
  };

  const mockEnvWithRedis = {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    NEXTAUTH_URL: "http://localhost:3000",
    NEXTAUTH_SECRET: "test-secret-key-with-at-least-32-characters",
    REDIS_URL: "redis://localhost:6379",
  };

  const mockEnvWithoutRedis = {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    NEXTAUTH_URL: "http://localhost:3000",
    NEXTAUTH_SECRET: "test-secret-key-with-at-least-32-characters",
    REDIS_URL: undefined,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Criar novos mocks para cada teste
    mockPing = vi.fn(async () => "PONG");
    mockQuit = vi.fn(async () => "OK");
    mockOn = vi.fn();
    mockRedisInstance = {
      ping: mockPing,
      quit: mockQuit,
      on: mockOn,
    };
    mockRedis = vi.fn(() => mockRedisInstance);

    vi.doMock("ioredis", () => ({
      default: mockRedis,
    }));

    // Mock env padrão com Redis
    vi.doMock("../../src/core/env", () => ({
      env: mockEnvWithRedis,
    }));

    // Resetar o singleton antes de cada teste
    const { resetRedisClient } = await import("../../src/core/redis-client");
    resetRedisClient();
  });

  it("deve criar uma instância Redis quando REDIS_URL está configurada", async () => {
    const { getRedisClient } = await import("../../src/core/redis-client");
    const client = getRedisClient();

    expect(client).toBeDefined();
    expect(mockRedis).toHaveBeenCalledWith("redis://localhost:6379", {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: false,
    });
  });

  it("deve retornar null quando REDIS_URL não está configurada", async () => {
    vi.doMock("../../src/core/env", () => ({
      env: mockEnvWithoutRedis,
    }));
    vi.resetModules();

    const { getRedisClient } = await import("../../src/core/redis-client");
    const client = getRedisClient();

    expect(client).toBeNull();
  });

  it("deve reutilizar a mesma instância (singleton)", async () => {
    const { getRedisClient } = await import("../../src/core/redis-client");

    const client1 = getRedisClient();
    const client2 = getRedisClient();

    expect(client1).toBe(client2);
    // Redis deve ser chamado apenas uma vez devido ao singleton
    expect(mockRedis).toHaveBeenCalledTimes(1);
  });

  it("deve verificar disponibilidade do Redis com ping", async () => {
    const { isRedisAvailable } = await import("../../src/core/redis-client");

    const available = await isRedisAvailable();

    expect(available).toBe(true);
    expect(mockPing).toHaveBeenCalled();
  });

  it("deve fechar a conexão Redis", async () => {
    const { getRedisClient, closeRedisClient } = await import(
      "../../src/core/redis-client"
    );

    getRedisClient();
    await closeRedisClient();

    expect(mockQuit).toHaveBeenCalled();
  });
});
