import { loadEnvConfig } from "@next/env";

/**
 * Carrega as variáveis de ambiente usando @next/env
 * Isso garante que as variáveis do arquivo .env sejam carregadas corretamente
 *
 * O Next.js automaticamente carrega .env.local, .env.development, etc.
 * seguindo a ordem de precedência do Next.js
 */
function loadEnv(): void {
  const projectDir = process.cwd();
  loadEnvConfig(projectDir);
}

loadEnv();

/**
 * Objeto com as variáveis de ambiente carregadas
 * Use este objeto para acessar variáveis de ambiente em toda a aplicação
 *
 * ⚠️ APENAS PARA SERVIDOR - Não use em componentes client-side
 *
 * As variáveis são carregadas usando @next/env do arquivo .env
 */
export const env = process.env;
