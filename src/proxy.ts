import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { env } from "@/core/env";

/**
 * Middleware para isolamento de tenant e sincronização de cookies
 * Garante que dados de um tenant não sejam acessíveis por outro
 * Sincroniza dados da sessão NextAuth em cookies acessíveis no cliente
 *
 * Baseado na documentação do Next.js 16 e Auth.js v5
 * Referência: https://nextjs.org/docs/app/guides/authentication
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas que não precisam de isolamento
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
  // Better Auth usa auth.api.getSession() para obter sessão no middleware
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Debug em desenvolvimento
  if (env.NODE_ENV === "development") {
    const isAuthCallback = pathname.startsWith("/api/auth/callback");
    console.log("[Middleware] Executando middleware:", {
      pathname,
      isAuthCallback,
      isPublicRoute,
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userId: (session?.user as { id?: string })?.id,
      tenantId: (session?.user as { tenantId?: string })?.tenantId,
      // Log completo apenas para rotas de callback para debug
      ...(isAuthCallback && { fullSession: session }),
    });
  }

  // Criar resposta base - SEMPRE criar NextResponse.next() para poder adicionar cookies
  let response: NextResponse;

  if (isPublicRoute) {
    // Rotas públicas sempre permitem acesso
    response = NextResponse.next();
  } else if (session?.user) {
    // Usuário autenticado - permitir acesso
    response = NextResponse.next();
  } else if (pathname.startsWith("/api/")) {
    // API sem autenticação - retornar 401
    return NextResponse.json(
      { message: "Não autenticado", error: "UNAUTHORIZED" },
      { status: 401 }
    );
  } else {
    // Página sem autenticação - redirecionar para login
    // Não há sessão, então não precisamos adicionar cookies aqui
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // IMPORTANTE: Sincronizar cookies SEMPRE que houver sessão, mesmo em rotas públicas
  // Isso garante que os cookies sejam criados após o login (callback do NextAuth)
  if (session?.user) {
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
        pathname,
      });
    }

    // Sincronizar dados do usuário em cookies (acessíveis no cliente)
    // Usar httpOnly: false para permitir acesso via JavaScript no cliente
    // Baseado na documentação do Next.js 16: response.cookies.set()

    if (user.id) {
      response.cookies.set("auth.user.id", user.id, {
        httpOnly: false,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 dias
      });
    }

    // Email é obrigatório - sempre deve existir
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

    if (user.tenantId) {
      response.cookies.set("auth.user.tenantId", user.tenantId, {
        httpOnly: false,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 dias
      });
    }

    if (user.role) {
      response.cookies.set("auth.user.role", user.role, {
        httpOnly: false,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 dias
      });
    }

    if (user.needsOnboarding !== undefined) {
      response.cookies.set(
        "auth.user.needsOnboarding",
        String(user.needsOnboarding),
        {
          httpOnly: false,
          secure: env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 dias
        }
      );
    }

    // Cookie de flag para indicar autenticação
    response.cookies.set("auth.isAuthenticated", "true", {
      httpOnly: false,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    // Debug em desenvolvimento - verificar quais cookies foram criados
    if (env.NODE_ENV === "development") {
      const createdCookies = [
        user.id && "auth.user.id",
        user.email && "auth.user.email",
        user.name && "auth.user.name",
        user.image && "auth.user.image",
        user.tenantId && "auth.user.tenantId",
        user.role && "auth.user.role",
        user.needsOnboarding !== undefined && "auth.user.needsOnboarding",
        "auth.isAuthenticated",
      ].filter(Boolean);

      console.log("[Middleware] Cookies criados com sucesso:", {
        cookies: createdCookies,
        pathname,
        responseType: response.constructor.name,
      });

      // Verificar se os cookies estão realmente na resposta
      const cookiesInResponse = response.cookies.getAll().map((c) => c.name);
      console.log("[Middleware] Cookies na resposta:", cookiesInResponse);
    }
  } else {
    // Se não autenticado, limpar cookies de autenticação
    response.cookies.delete("auth.user.id");
    response.cookies.delete("auth.user.email");
    response.cookies.delete("auth.user.name");
    response.cookies.delete("auth.user.image");
    response.cookies.delete("auth.user.tenantId");
    response.cookies.delete("auth.user.role");
    response.cookies.delete("auth.user.needsOnboarding");
    response.cookies.delete("auth.isAuthenticated");
  }

  // Se for rota pública, retornar resposta (já com cookies sincronizados se autenticado)
  if (isPublicRoute) {
    return response;
  }

  // Se não autenticado e tentando acessar rota protegida, redirecionar para login
  if (!session?.user) {
    // Não há sessão, então não precisamos adicionar cookies aqui
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verificar se o usuário precisa de onboarding
  const needsOnboarding = (session.user as { needsOnboarding?: boolean })
    ?.needsOnboarding;

  // Se precisa de onboarding e não está na rota de onboarding, redirecionar
  // IMPORTANTE: Criar redirect e copiar cookies da resposta existente
  if (needsOnboarding && !pathname.startsWith("/onboarding")) {
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

  // Extrair tenantId da sessão
  const tenantId = (session.user as { tenantId?: string })?.tenantId;

  // Se não houver tenantId na sessão, negar acesso
  if (!tenantId) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { message: "Tenant não identificado", error: "TENANT_MISSING" },
        { status: 403 }
      );
    }
    // IMPORTANTE: Criar redirect e copiar cookies da resposta existente
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

  // Para rotas de API, adicionar tenantId aos headers para uso nas rotas
  if (pathname.startsWith("/api/")) {
    response.headers.set("x-tenant-id", tenantId);
    return response;
  }

  // Para páginas, retornar resposta com cookies sincronizados
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
