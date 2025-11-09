import { loadEnvConfig } from "@next/env";

/**
 * Carrega as variáveis de ambiente usando @next/env
 * Isso garante que as variáveis do arquivo .env sejam carregadas corretamente
 *
 * O Next.js automaticamente carrega .env.local, .env.development, etc.
 * seguindo a ordem de precedência do Next.js
 *
 * ⚠️ Não executa no Edge Runtime (middleware) - process.cwd() não é suportado
 */
function loadEnv(): void {
  // Verificar se estamos no Edge Runtime (middleware)
  // Edge Runtime não suporta process.cwd()
  // Verificamos se process.cwd existe e é uma função antes de usar
  try {
    if (typeof process !== "undefined" && typeof process.cwd === "function") {
      const projectDir = process.cwd();
      loadEnvConfig(projectDir);
    }
  } catch {
    // Se process.cwd() falhar (Edge Runtime), simplesmente não carregar
    // O Next.js carrega as variáveis automaticamente no Edge Runtime
  }
}

// Tentar carregar, mas não falhar se estiver no Edge Runtime
try {
  loadEnv();
} catch {
  // Ignorar erros no Edge Runtime - Next.js carrega variáveis automaticamente
}

/**
 * Objeto com as variáveis de ambiente carregadas
 * Use este objeto para acessar variáveis de ambiente em toda a aplicação
 *
 * ⚠️ APENAS PARA SERVIDOR - Não use em componentes client-side
 *
 * No Edge Runtime (middleware), as variáveis são carregadas automaticamente pelo Next.js
 */
export const env = process.env;
