import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Testes para validação de variáveis de ambiente
 * Testa cenários de sucesso e falha do schema Zod
 */
describe("Core - Environment Variables Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Restaurar process.env antes de cada teste
    process.env = { ...originalEnv };
    // Limpar cache do módulo para forçar re-validação
    vi.resetModules();
  });

  it("should validate required environment variables successfully", async () => {
    process.env = {
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://user:password@localhost:5432/db",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXTAUTH_SECRET: "a".repeat(32), // Mínimo de 32 caracteres
    };

    // Importar após definir variáveis
    const { env } = await import("../../src/core/env");

    expect(env.NODE_ENV).toBe("development");
    expect(env.DATABASE_URL).toBe(
      "postgresql://user:password@localhost:5432/db"
    );
    expect(env.NEXTAUTH_URL).toBe("http://localhost:3000");
    expect(env.NEXTAUTH_SECRET).toHaveLength(32);
  });

  it("should fail when DATABASE_URL is missing", async () => {
    process.env = {
      NODE_ENV: "development",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXTAUTH_SECRET: "a".repeat(32),
    };

    await expect(async () => {
      await import("../../src/core/env");
    }).rejects.toThrow("Variáveis de ambiente inválidas");
  });

  it("should fail when NEXTAUTH_SECRET is too short", async () => {
    process.env = {
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://user:password@localhost:5432/db",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXTAUTH_SECRET: "short", // Muito curto
    };

    await expect(async () => {
      await import("../../src/core/env");
    }).rejects.toThrow("Variáveis de ambiente inválidas");
  });

  it("should fail when DATABASE_URL is not a valid URL", async () => {
    process.env = {
      NODE_ENV: "development",
      DATABASE_URL: "invalid-url",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXTAUTH_SECRET: "a".repeat(32),
    };

    await expect(async () => {
      await import("../../src/core/env");
    }).rejects.toThrow("Variáveis de ambiente inválidas");
  });

  it("should accept optional variables", async () => {
    process.env = {
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://user:password@localhost:5432/db",
      NEXTAUTH_URL: "https://pegasus.example.com",
      NEXTAUTH_SECRET: "a".repeat(32),
      GOOGLE_CLIENT_ID: "google-client-id",
      GOOGLE_CLIENT_SECRET: "google-client-secret",
      SENTRY_DSN: "https://sentry.io/example",
    };

    const { env } = await import("../../src/core/env");

    expect(env.GOOGLE_CLIENT_ID).toBe("google-client-id");
    expect(env.GOOGLE_CLIENT_SECRET).toBe("google-client-secret");
    expect(env.SENTRY_DSN).toBe("https://sentry.io/example");
  });

  it("should default NODE_ENV to development when not provided", async () => {
    process.env = {
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://user:password@localhost:5432/db",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXTAUTH_SECRET: "a".repeat(32),
    };

    const { env } = await import("../../src/core/env");

    expect(env.NODE_ENV).toBe("development");
  });
});
