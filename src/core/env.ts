import { z } from "zod";

/**
 * Schema de validação para variáveis de ambiente
 * Garante que todas as variáveis necessárias estejam presentes e formatadas corretamente
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Database
  DATABASE_URL: z.string().url("DATABASE_URL deve ser uma URL válida"),

  // NextAuth.js
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL deve ser uma URL válida"),
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET deve ter pelo menos 32 caracteres"),

  // OAuth Providers (opcionais, mas necessários para autenticação SSO)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),

  // Billing (opcionais, necessários apenas para integração)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLIC_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  LEMONSQUEEZY_API_KEY: z.string().optional(),
  LEMONSQUEEZY_WEBHOOK_SECRET: z.string().optional(),

  // Observability (opcionais)
  SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  LOKI_URL: z.string().url().optional().or(z.literal("")),
  LOKI_USERNAME: z.string().optional(),
  LOKI_PASSWORD: z.string().optional(),

  // Emails (Resend)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z
    .string()
    .email("RESEND_FROM deve ser um email válido")
    .optional(),

  // Storage (opcionais)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),

  // Redis (opcional, necessário para BullMQ)
  REDIS_URL: z.string().url("REDIS_URL deve ser uma URL válida").optional(),
});

/**
 * Tipo inferido do schema de variáveis de ambiente
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Valida e exporta as variáveis de ambiente
 * Lança um erro claro caso alguma variável obrigatória esteja ausente ou inválida
 */
function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Variáveis de ambiente inválidas:\n");
    parsed.error.issues.forEach((issue) => {
      const path = issue.path.join(".");
      console.error(`  ${path}: ${issue.message}`);
    });
    throw new Error(
      "Variáveis de ambiente inválidas. Verifique o arquivo .env"
    );
  }

  return parsed.data;
}

/**
 * Objeto com as variáveis de ambiente validadas
 * Use este objeto para acessar variáveis de ambiente em toda a aplicação
 */
export const env = getEnv();
