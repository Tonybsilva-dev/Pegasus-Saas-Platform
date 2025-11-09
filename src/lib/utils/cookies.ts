/**
 * Utilitários para gerenciar cookies no cliente
 * Baseado na documentação do Next.js 16
 */

/**
 * Helper para ler um cookie específico no cliente.
 * @param name O nome do cookie.
 * @returns O valor do cookie ou null se não encontrado.
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

/**
 * Helper para ler todos os cookies no cliente.
 * @returns Um objeto com todos os cookies (chave: valor).
 */
export function getAllCookies(): Record<string, string> {
  if (typeof document === "undefined") {
    return {};
  }
  const cookies: Record<string, string> = {};
  document.cookie.split(";").forEach((cookie) => {
    const [name, value] = cookie
      .split("=")
      .map((s) => decodeURIComponent(s.trim()));
    if (name && value) {
      cookies[name] = value;
    }
  });
  return cookies;
}

/**
 * Interface para dados do usuário autenticado
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  tenantId: string;
  role: string;
  needsOnboarding: boolean;
}

/**
 * Obtém os dados do usuário autenticado a partir dos cookies.
 * @returns Um objeto AuthUser ou null se não autenticado.
 */
export function getAuthUserFromCookies(): AuthUser | null {
  if (typeof document === "undefined") {
    return null;
  }

  const isAuthenticated = getCookie("auth.isAuthenticated") === "true";
  if (!isAuthenticated) {
    return null;
  }

  const user: Partial<AuthUser> = {
    id: getCookie("auth.user.id") || undefined,
    email: getCookie("auth.user.email") || undefined,
    name: getCookie("auth.user.name") || null,
    image: getCookie("auth.user.image") || null,
    tenantId: getCookie("auth.user.tenantId") || undefined,
    role: getCookie("auth.user.role") || undefined,
    needsOnboarding: getCookie("auth.user.needsOnboarding") === "true",
  };

  // O email é o campo mais crítico para considerar o usuário válido
  if (!user.email || !user.id || !user.tenantId) {
    return null;
  }

  return user as AuthUser;
}
