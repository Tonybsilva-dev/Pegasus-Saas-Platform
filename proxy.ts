import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  handleUnauthenticated,
  isPublicRoute,
  processAuthentication,
  syncEssentialCookies,
  syncUserCookies,
} from "@/lib/middleware/auth";
import {
  createRedirectResponse,
  createRoutingContext,
  isAllowedRoute,
  syncDatabaseCookies,
} from "@/lib/middleware/routing";

/**
 * Proxy para roteamento, rewrites, redirects e autenticação
 * Intercepta requisições HTTP e aplica lógica de roteamento e autenticação
 *
 * Responsabilidades:
 * - Orquestração de autenticação e roteamento
 * - Aplicação de regras de negócio (approvalStatus, needsOnboarding)
 * - Redirecionamentos condicionais
 * - Isolamento de tenant via headers
 *
 * Baseado na documentação do Next.js 16
 * Referência: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Log SEMPRE no início para debug
  console.error("🔵 [Proxy] INÍCIO - pathname:", pathname);

  // Criar resposta base
  const response: NextResponse = NextResponse.next();

  // PROCESSO 1: Autenticação básica
  const authResult = await processAuthentication(request);

  // Se não autenticado, processar redirecionamento
  if (!authResult.isAuthenticated) {
    const unauthenticatedResponse = handleUnauthenticated(
      request,
      pathname,
      response
    );
    if (unauthenticatedResponse) {
      return unauthenticatedResponse;
    }
  }

  // Se chegou aqui, usuário está autenticado
  if (!authResult.user) {
    console.error("🔴 [Proxy] Erro: usuário autenticado mas sem dados");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = authResult.user;

  // PROCESSO 2: Buscar dados do banco e criar contexto de roteamento
  if (!user.id) {
    console.error("🔴 [Proxy] Erro: usuário sem ID");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const routingContext = await createRoutingContext(user.id);

  // Atualizar user com dados do banco (tenantId e role)
  const enrichedUser = {
    ...user,
    tenantId: routingContext.dbUser?.tenantId || user.tenantId,
    role: routingContext.dbUser?.role || user.role,
  };

  console.error("🟢 [Proxy] Usuário autenticado:", {
    id: enrichedUser.id,
    email: enrichedUser.email,
    tenantId: enrichedUser.tenantId,
    role: enrichedUser.role,
  });

  // Sincronizar cookies básicos do usuário (com dados enriquecidos)
  syncUserCookies(response, enrichedUser);

  console.error("🔵 [Proxy] Contexto de roteamento:", {
    pathname,
    userPending: routingContext.userPending,
    tenantPending: routingContext.tenantPending,
    tenantInactive: routingContext.tenantInactive,
    shouldBlock: routingContext.shouldBlock,
    needsOnboarding: routingContext.needsOnboarding,
    hasValidTenant: routingContext.hasValidTenant,
    userApprovalStatus: routingContext.dbUser?.approvalStatus,
    tenantApprovalStatus: routingContext.dbTenant?.approvalStatus,
    tenantIsActive: routingContext.dbTenant?.isActive,
    hasTenantId: !!routingContext.dbUser?.tenantId,
  });

  // VERIFICAÇÃO 1: Redirecionar para onboarding se necessário
  // IMPORTANTE: Esta verificação deve vir ANTES do shouldBlock
  // Se o usuário não tem tenantId (null), precisa fazer onboarding, não está pendente
  // NÃO redirecionar rotas de API ou rotas especiais - apenas rotas de página
  const shouldRedirectToOnboarding =
    routingContext.needsOnboarding &&
    !pathname.startsWith("/onboarding") &&
    !pathname.startsWith("/api/") && // Não redirecionar APIs
    !pathname.startsWith("/_next/") && // Não redirecionar assets do Next.js
    !pathname.startsWith("/.well-known/") && // Não redirecionar rotas well-known
    !pathname.startsWith("/favicon.ico"); // Não redirecionar favicon

  if (shouldRedirectToOnboarding) {
    console.error(
      "🟡 [Proxy] REDIRECIONANDO PARA ONBOARDING (usuário sem tenant):",
      {
        pathname,
        needsOnboarding: routingContext.needsOnboarding,
        shouldBlock: routingContext.shouldBlock,
        userId: enrichedUser.id,
        tenantId: routingContext.dbUser?.tenantId,
        role: routingContext.dbUser?.role,
        isDefaultTenant: routingContext.isDefaultTenant,
      }
    );

    const redirectResponse = createRedirectResponse(
      "/onboarding",
      request,
      response
    );
    syncEssentialCookies(redirectResponse, enrichedUser);
    return redirectResponse;
  }

  // VERIFICAÇÃO 2: Bloquear se PENDING ou INACTIVE
  // Esta verificação só aplica se o usuário JÁ TEM tenantId (não está fazendo onboarding)
  // Se needsOnboarding = true, já foi redirecionado acima
  if (routingContext.shouldBlock && routingContext.dbUser?.tenantId) {
    const isPublic = isPublicRoute(pathname);
    const isAllowed = isAllowedRoute(pathname);

    console.error("🔍 [Proxy] Verificando bloqueio:", {
      pathname,
      shouldBlock: routingContext.shouldBlock,
      hasTenantId: !!routingContext.dbUser?.tenantId,
      isPublic,
      isAllowed,
      willBlock: !isPublic && !isAllowed,
    });

    if (!isPublic && !isAllowed) {
      console.error("🔴 [Proxy] BLOQUEANDO ACESSO - PENDING ou INACTIVE:", {
        pathname,
        userPending: routingContext.userPending,
        tenantPending: routingContext.tenantPending,
        tenantInactive: routingContext.tenantInactive,
      });

      const redirectResponse = createRedirectResponse(
        "/onboarding/pending",
        request,
        response
      );

      syncEssentialCookies(redirectResponse, enrichedUser);
      return redirectResponse;
    }
  }

  // VERIFICAÇÃO 3: Permitir /onboarding se needsOnboarding = true OU bloquear se tenant válido
  if (pathname.startsWith("/onboarding")) {
    // Se precisa de onboarding, sempre permitir acesso
    if (routingContext.needsOnboarding) {
      console.error(
        "✅ [Proxy] PERMITINDO /onboarding - needsOnboarding = true:",
        {
          pathname,
          needsOnboarding: routingContext.needsOnboarding,
          hasTenantId: !!routingContext.dbUser?.tenantId,
          isDefaultTenant: routingContext.isDefaultTenant,
        }
      );
      // Continuar com a resposta normal (não redirecionar)
    }
    // Se não precisa de onboarding mas tem tenant válido, bloquear
    else if (routingContext.hasValidTenant) {
      console.error(
        "🔴 [Proxy] BLOQUEANDO /onboarding - Tenant APPROVED e ACTIVE:",
        {
          pathname,
          tenantId: routingContext.dbUser?.tenantId,
          tenantSlug: routingContext.dbTenant?.slug,
        }
      );

      return createRedirectResponse("/dashboard", request, response);
    } else {
      // Caso contrário, permitir (pode estar pendente ou inativo)
      console.error(
        "✅ [Proxy] PERMITINDO /onboarding - Tenant não é válido (PENDING, INACTIVE ou default):",
        {
          pathname,
          tenantId: routingContext.dbUser?.tenantId,
          tenantSlug: routingContext.dbTenant?.slug,
        }
      );
      // Continuar com a resposta normal (não redirecionar)
    }
  }

  // Sincronizar cookies com dados do banco
  syncDatabaseCookies(
    response,
    routingContext.dbUser,
    routingContext.needsOnboarding
  );

  // Verificar se há tenantId
  const tenantId = routingContext.dbUser?.tenantId || enrichedUser.tenantId;

  // Se não houver tenantId e não for rota pública ou de onboarding, negar acesso
  // Permitir acesso a /onboarding e APIs de onboarding mesmo sem tenantId
  // (usuário precisa fazer onboarding para criar/associar um tenant)
  const isOnboardingRoute =
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/api/onboarding/");

  if (!tenantId && !isPublicRoute(pathname) && !isOnboardingRoute) {
    console.error("🔴 [Proxy] Tenant não identificado, negando acesso", {
      pathname,
      hasTenantId: !!tenantId,
      isPublic: isPublicRoute(pathname),
      isOnboardingRoute,
    });

    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { message: "Tenant não identificado", error: "TENANT_MISSING" },
        { status: 403 }
      );
    }

    return createRedirectResponse("/login", request, response);
  }

  // Para rotas de API, adicionar tenantId aos headers
  if (pathname.startsWith("/api/") && tenantId) {
    response.headers.set("x-tenant-id", tenantId);
  }

  console.error("✅ [Proxy] Requisição processada com sucesso:", {
    pathname,
    tenantId,
    needsOnboarding: routingContext.needsOnboarding,
    shouldBlock: routingContext.shouldBlock,
    userPending: routingContext.userPending,
    tenantPending: routingContext.tenantPending,
    tenantInactive: routingContext.tenantInactive,
    isDefaultTenant: routingContext.isDefaultTenant,
  });

  return response;
}

/**
 * Configuração do matcher para definir quais rotas acionam o proxy
 * Exclui arquivos estáticos, imagens e assets do Next.js
 *
 * IMPORTANTE: Proxy sempre roda no Node.js runtime automaticamente
 * Não é necessário (e não é permitido) especificar runtime no config
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
