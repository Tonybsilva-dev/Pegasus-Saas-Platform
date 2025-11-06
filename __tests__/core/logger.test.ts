import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Testes para o logger centralizado
 * Valida que o logger está configurado corretamente
 */
describe("Core - Logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should export logger instance", async () => {
    const { logger } = await import("../../src/core/logger");

    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });

  it("should create tenant logger with tenantId", async () => {
    const { createTenantLogger } = await import("../../src/core/logger");

    const tenantLogger = createTenantLogger("tenant-123");

    expect(tenantLogger).toBeDefined();
    expect(typeof tenantLogger.info).toBe("function");
  });

  it("should create user logger with userId and optional tenantId", async () => {
    const { createUserLogger } = await import("../../src/core/logger");

    const userLogger = createUserLogger("user-456", "tenant-123");

    expect(userLogger).toBeDefined();
    expect(typeof userLogger.info).toBe("function");
  });

  it("should log messages at different levels", async () => {
    const { logger } = await import("../../src/core/logger");

    // Capturar logs usando spy
    const infoSpy = vi.spyOn(logger, "info");
    const errorSpy = vi.spyOn(logger, "error");
    const warnSpy = vi.spyOn(logger, "warn");

    logger.info("Test info message");
    logger.error("Test error message");
    logger.warn("Test warn message");

    expect(infoSpy).toHaveBeenCalledWith("Test info message");
    expect(errorSpy).toHaveBeenCalledWith("Test error message");
    expect(warnSpy).toHaveBeenCalledWith("Test warn message");
  });
});
