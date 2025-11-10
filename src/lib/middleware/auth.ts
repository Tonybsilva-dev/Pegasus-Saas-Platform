import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { env } from "@/core/env";

/**
 * Módulo de Autenticação para Middleware/Proxy
 *
 * Responsabilidades:
 * - Verificação de sessão
 * - Sincronização de dados da sessão em cookies
 * - Limpeza de cookies para rotas públicas
 * - Validação de autenticação básica
 */

export interface AuthResult {
  session: Awaited<ReturnType<typeof auth.api.getSession>>;
  user: {
    id?: string;
    email?: string;
    name?: string | null;
    image?: string | null;
    tenantId?: string;
    role?: string;
    needsOnboarding?: boolean;
  } | null;
  isAuthenticated: boolean;
}

/**
 * Verifica se uma rota é pública
 */
export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = ["/login", "/api/auth", "/api/webhooks"];

  // Verificar rotas exatas primeiro
  if (pathname === "/") {
    return true;
  }

  // Verificar rotas que começam com os prefixos públicos
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

  // Log para debug de rotas problemáticas
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
    console.error("🔍 [Auth] isPublicRoute check:", {
      pathname,
      publicRoutes,
      isPublic,
      matches: publicRoutes.filter((route) => pathname.startsWith(route)),
    });
  }

  return isPublic;
}

/**
 * Obtém a sessão do usuário
 */
export async function getSession(request: NextRequest) {
  return await auth.api.getSession({
    headers: request.headers,
  });
}

/**
 * Limpa todos os cookies de autenticação
 */
export function clearAuthCookies(response: NextResponse): void {
  response.cookies.delete("auth.user.id");
  response.cookies.delete("auth.user.email");
  response.cookies.delete("auth.user.name");
  response.cookies.delete("auth.user.image");
  response.cookies.delete("auth.user.tenantId");
  response.cookies.delete("auth.user.role");
  response.cookies.delete("auth.user.needsOnboarding");
  response.cookies.delete("auth.user.approvalStatus");
  response.cookies.delete("auth.isAuthenticated");
}

/**
 * Sincroniza dados básicos do usuário em cookies
 */
export function syncUserCookies(
  response: NextResponse,
  user: AuthResult["user"]
): void {
  if (!user) return;

  if (user.id) {
    response.cookies.set("auth.user.id", user.id, {
      httpOnly: false,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });
  }

  if (user.email) {
    response.cookies.set("auth.user.email", user.email, {
      httpOnly: false,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });
  }

  if (user.name) {
    response.cookies.set("auth.user.name", user.name, {
      httpOnly: false,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });
  }

  if (user.image) {
    response.cookies.set("auth.user.image", user.image, {
      httpOnly: false,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });
  }
}

/**
 * Sincroniza cookies essenciais (id e email) para redirecionamentos
 */
export function syncEssentialCookies(
  response: NextResponse,
  user: AuthResult["user"]
): void {
  if (!user) return;

  if (user.id) {
    response.cookies.set("auth.user.id", user.id, {
      httpOnly: false,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  if (user.email) {
    response.cookies.set("auth.user.email", user.email, {
      httpOnly: false,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
}

/**
 * Processa autenticação básica e retorna informações do usuário
 */
export async function processAuthentication(
  request: NextRequest
): Promise<AuthResult> {
  const session = await getSession(request);
  const user = session?.user as AuthResult["user"] | undefined;

  return {
    session,
    user: user || null,
    isAuthenticated: !!session?.user,
  };
}

/**
 * Valida autenticação e retorna resposta apropriada para rotas não autenticadas
 */
export function handleUnauthenticated(
  request: NextRequest,
  pathname: string,
  response: NextResponse
): NextResponse | null {
  const publicRoute = isPublicRoute(pathname);

  // Se for rota pública, permitir acesso e limpar cookies
  if (publicRoute) {
    clearAuthCookies(response);
    console.error("🟡 [Auth] Rota pública, permitindo acesso sem autenticação");
    return response;
  }

  // Para rotas de API, retornar 401
  if (pathname.startsWith("/api/")) {
    console.error("🔴 [Auth] API sem autenticação, retornando 401");
    return NextResponse.json(
      { message: "Não autenticado", error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  // Para páginas, redirecionar para login
  console.error(
    "🔴 [Auth] Página protegida sem autenticação, redirecionando para /login"
  );
  return NextResponse.redirect(new URL("/login", request.url));
}
