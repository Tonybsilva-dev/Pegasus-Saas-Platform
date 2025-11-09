import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { env } from "@/core/env";
import { prisma } from "@/core/prisma";

/**
 * Middleware para autenticação e sincronização de cookies
 * Gerencia sessão, autenticação e dados do usuário em cookies
 *
 * Responsabilidades:
 * - Autenticação e verificação de sessão
 * - Sincronização de dados da sessão em cookies
 * - Cálculo de needsOnboarding
 * - Redirecionamento para onboarding quando necessário
 * - Isolamento de tenant via cookies
 *
 * Baseado na documentação do Next.js 16 e Better Auth
 * Referência: https://nextjs.org/docs/app/guides/authentication
 */
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Log em desenvolvimento
  if (env.NODE_ENV === "development") {
    console.log("[Middleware] Processando autenticação:", pathname);
  }

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = [
    "/login",
    "/",
    "/api/auth",
    "/api/webhooks",
    "/onboarding",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Obter sessão do usuário usando Better Auth
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Debug em desenvolvimento
  if (env.NODE_ENV === "development") {
    const sessionUser = session?.user as {
      id?: string;
      tenantId?: string;
      role?: string;
      email?: string;
    };
    console.log("[Middleware] Estado da sessão:", {
      pathname,
      isPublicRoute,
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: sessionUser?.email,
      userId: sessionUser?.id,
    });
  }

  // Criar resposta base
  const response: NextResponse = NextResponse.next();

  // Se não autenticado e tentando acessar rota protegida, redirecionar para login
  if (!session?.user) {
    // Se for rota pública, permitir acesso
    if (isPublicRoute) {
      // Limpar cookies de autenticação
      response.cookies.delete("auth.user.id");
      response.cookies.delete("auth.user.email");
      response.cookies.delete("auth.user.name");
      response.cookies.delete("auth.user.image");
      response.cookies.delete("auth.user.tenantId");
      response.cookies.delete("auth.user.role");
      response.cookies.delete("auth.user.needsOnboarding");
      response.cookies.delete("auth.isAuthenticated");
      return response;
    }

    // Para rotas de API, retornar 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { message: "Não autenticado", error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Para páginas, redirecionar para login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Sincronizar dados da sessão em cookies (acessíveis no cliente)
  const user = session.user as {
    id?: string;
    email?: string;
    name?: string | null;
    image?: string | null;
    tenantId?: string;
    role?: string;
    needsOnboarding?: boolean;
  };

  // Debug detalhado em desenvolvimento
  if (env.NODE_ENV === "development") {
    console.log("[Middleware] Dados do usuário na sessão:", {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      tenantId: user.tenantId,
      role: user.role,
      needsOnboarding: user.needsOnboarding,
    });
  }

  // Sincronizar dados do usuário em cookies
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

  // Calcular needsOnboarding dinamicamente do banco de dados
  let needsOnboarding = false;

  if (user.id) {
    try {
      // Buscar dados completos do usuário do banco
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          tenantId: true,
          role: true,
        },
      });

      if (dbUser) {
        // Buscar tenant "default"
        const defaultTenant = await prisma.tenant.findUnique({
          where: { slug: "default" },
          select: { id: true },
        });

        // Se está no tenant "default" E tem role ATHLETE, precisa de onboarding
        needsOnboarding =
          !!defaultTenant &&
          dbUser.tenantId === defaultTenant.id &&
          dbUser.role === "ATHLETE";

        // Atualizar cookies com os valores do banco
        if (dbUser.tenantId) {
          response.cookies.set("auth.user.tenantId", dbUser.tenantId, {
            httpOnly: false,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 dias
          });
        }

        if (dbUser.role) {
          response.cookies.set("auth.user.role", dbUser.role, {
            httpOnly: false,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 dias
          });
        }

        // Debug em desenvolvimento
        if (env.NODE_ENV === "development") {
          console.log("[Middleware] Calculado needsOnboarding:", {
            userId: user.id,
            tenantId: dbUser.tenantId,
            role: dbUser.role,
            defaultTenantId: defaultTenant?.id,
            needsOnboarding,
          });
        }
      }
    } catch (error) {
      console.error("[Middleware] Erro ao calcular needsOnboarding:", error);
      // Em caso de erro, assumir que não precisa de onboarding
      needsOnboarding = false;
    }
  }

  // Atualizar cookie com o valor calculado
  response.cookies.set("auth.user.needsOnboarding", String(needsOnboarding), {
    httpOnly: false,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });

  // Cookie de flag para indicar autenticação
  response.cookies.set("auth.isAuthenticated", "true", {
    httpOnly: false,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });

  // Se precisa de onboarding e não está na rota de onboarding, redirecionar
  if (needsOnboarding && !pathname.startsWith("/onboarding")) {
    if (env.NODE_ENV === "development") {
      console.log("[Middleware] Redirecionando para onboarding:", {
        pathname,
        needsOnboarding,
        userId: user.id,
      });
    }
    const redirectResponse = NextResponse.redirect(
      new URL("/onboarding", request.url)
    );
    // Copiar todos os cookies da resposta original para o redirect
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        path: cookie.path,
        maxAge: cookie.maxAge,
      });
    });
    return redirectResponse;
  }

  // Verificar se há tenantId (pode ter sido atualizado do banco)
  const tenantId =
    user.tenantId || response.cookies.get("auth.user.tenantId")?.value;

  // Se não houver tenantId, negar acesso
  if (!tenantId && !isPublicRoute) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { message: "Tenant não identificado", error: "TENANT_MISSING" },
        { status: 403 }
      );
    }
    const redirectResponse = NextResponse.redirect(
      new URL("/login", request.url)
    );
    // Copiar todos os cookies da resposta original para o redirect
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        path: cookie.path,
        maxAge: cookie.maxAge,
      });
    });
    return redirectResponse;
  }

  // Para rotas de API, adicionar tenantId aos headers
  if (pathname.startsWith("/api/") && tenantId) {
    response.headers.set("x-tenant-id", tenantId);
  }

  return response;
}

/**
 * Configuração do matcher para definir quais rotas acionam o middleware
 * Exclui arquivos estáticos, imagens e assets do Next.js
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
