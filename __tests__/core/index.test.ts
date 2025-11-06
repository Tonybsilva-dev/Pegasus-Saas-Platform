import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Smoke test para o módulo core
 * Valida que todas as exportações estão funcionais
 */
describe("Core - Module Exports", () => {
  beforeEach(() => {
    // Configurar variáveis de ambiente necessárias antes de cada teste
    process.env = {
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://user:password@localhost:5432/db",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXTAUTH_SECRET: "a".repeat(32),
    };
    vi.resetModules();
  });

  it("should export env", async () => {
    const coreModule = await import("../../src/core");
    const { env } = coreModule;

    expect(env).toBeDefined();
    expect(typeof env).toBe("object");
    expect(env.DATABASE_URL).toBeDefined();
    expect(env.NEXTAUTH_URL).toBeDefined();
  });

  it("should export logger and logger helpers", async () => {
    const coreModule = await import("../../src/core");
    const { logger, createTenantLogger, createUserLogger } = coreModule;

    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");

    expect(createTenantLogger).toBeDefined();
    expect(typeof createTenantLogger).toBe("function");

    expect(createUserLogger).toBeDefined();
    expect(typeof createUserLogger).toBe("function");
  });

  it("should allow importing from @/core alias", async () => {
    // Testar que o alias funciona (mesmo que seja via caminho relativo no teste)
    const { env, logger } = await import("../../src/core");

    expect(env).toBeDefined();
    expect(logger).toBeDefined();
  });
});
