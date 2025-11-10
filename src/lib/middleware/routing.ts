import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "@/core/env";
import { prisma } from "@/core/prisma";

/**
 * Módulo de Roteamento para Middleware/Proxy
 *
 * Responsabilidades:
 * - Busca de dados do banco (usuário, tenant)
 * - Cálculo de needsOnboarding
 * - Verificação de approvalStatus
 * - Lógica de bloqueio (PENDING, INACTIVE)
 * - Redirecionamentos condicionais
 */

export interface DatabaseUser {
  tenantId: string | null; // Pode ser null - usuário sem tenant precisa fazer onboarding
  role: string;
  approvalStatus: string;
}

export interface DatabaseTenant {
  approvalStatus: string;
  isActive: boolean;
  slug: string;
}

export interface RoutingContext {
  dbUser: DatabaseUser | null;
  dbTenant: DatabaseTenant | null;
  defaultTenant: { id: string } | null;
  userPending: boolean;
  tenantPending: boolean;
  tenantInactive: boolean;
  shouldBlock: boolean;
  needsOnboarding: boolean;
  hasValidTenant: boolean;
  isDefaultTenant: boolean;
}

/**
 * Busca dados do usuário e tenant do banco de dados
 */
export async function fetchUserData(userId: string): Promise<{
  dbUser: DatabaseUser | null;
  dbTenant: DatabaseTenant | null;
  defaultTenant: { id: string } | null;
}> {
  try {
    // Buscar dados do usuário
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        tenantId: true,
        role: true,
        approvalStatus: true,
      },
    });

    // Buscar tenant "default" para verificar needsOnboarding
    const defaultTenant = await prisma.tenant.findUnique({
      where: { slug: "default" },
      select: { id: true },
    });

    let dbTenant: DatabaseTenant | null = null;

    // Se o usuário tem tenantId, buscar também o tenant
    if (dbUser?.tenantId) {
      dbTenant = await prisma.tenant.findUnique({
        where: { id: dbUser.tenantId },
        select: {
          approvalStatus: true,
          isActive: true,
          slug: true,
        },
      });
    }

    return {
      dbUser,
      dbTenant,
      defaultTenant,
    };
  } catch (error) {
    console.error("🔴 [Routing] Erro ao buscar dados:", error);
    return {
      dbUser: null,
      dbTenant: null,
      defaultTenant: null,
    };
  }
}

/**
 * Calcula se o usuário deve ser bloqueado (PENDING ou INACTIVE)
 */
export function calculateBlockStatus(
  dbUser: DatabaseUser | null,
  dbTenant: DatabaseTenant | null
): {
  userPending: boolean;
  tenantPending: boolean;
  tenantInactive: boolean;
  shouldBlock: boolean;
} {
  const userPending = dbUser?.approvalStatus === "PENDING";
  const tenantPending = dbTenant?.approvalStatus === "PENDING";
  const tenantInactive = dbTenant?.isActive === false;
  const shouldBlock = userPending || tenantPending || tenantInactive;

  return {
    userPending,
    tenantPending,
    tenantInactive,
    shouldBlock,
  };
}

/**
 * Calcula se o usuário precisa de onboarding
 *
 * IMPORTANTE: needsOnboarding = true se:
 * - tenantId é null (usuário novo sem tenant)
 * - tenantId é "default" (temporário, precisa fazer onboarding)
 *
 * needsOnboarding pode ser true mesmo quando shouldBlock é true
 * se o usuário não tiver tenant ou estiver no tenant "default"
 */
export function calculateNeedsOnboarding(
  dbUser: DatabaseUser | null,
  defaultTenant: { id: string } | null,
  shouldBlock: boolean
): boolean {
  if (!dbUser) {
    return false;
  }

  try {
    // Se não tem tenantId (null), precisa de onboarding
    if (!dbUser.tenantId) {
      return true;
    }

    const isDefaultTenant =
      defaultTenant && dbUser.tenantId === defaultTenant.id;

    // Se está no tenant "default", precisa de onboarding (mesmo se bloqueado)
    // O tenant "default" é apenas temporário até o usuário se associar a um tenant real
    if (isDefaultTenant) {
      return true;
    }

    // Se está bloqueado e não está no tenant default, não precisa de onboarding
    // (precisa ser aprovado primeiro)
    if (shouldBlock) {
      return false;
    }

    // Caso contrário, não precisa de onboarding (já tem tenant válido)
    return false;
  } catch (error) {
    console.error("🔴 [Routing] Erro ao calcular needsOnboarding:", error);
    return false;
  }
}

/**
 * Verifica se o tenant é válido (APPROVED + ACTIVE + não-default)
 */
export function calculateValidTenant(
  dbTenant: DatabaseTenant | null,
  dbUser: DatabaseUser | null,
  defaultTenant: { id: string } | null
): {
  hasValidTenant: boolean;
  isDefaultTenant: boolean;
  tenantApproved: boolean;
  tenantActive: boolean;
} {
  if (!dbTenant || !dbUser?.tenantId) {
    return {
      hasValidTenant: false,
      isDefaultTenant: false,
      tenantApproved: false,
      tenantActive: false,
    };
  }

  const tenantApproved = Boolean(dbTenant.approvalStatus === "APPROVED");
  const tenantActive = Boolean(dbTenant.isActive === true);
  const isDefaultTenant = Boolean(
    defaultTenant && dbUser.tenantId === defaultTenant.id
  );
  const hasValidTenant = tenantApproved && tenantActive && !isDefaultTenant;

  return {
    hasValidTenant,
    isDefaultTenant,
    tenantApproved,
    tenantActive,
  };
}

/**
 * Cria contexto completo de roteamento
 */
export async function createRoutingContext(
  userId: string
): Promise<RoutingContext> {
  const { dbUser, dbTenant, defaultTenant } = await fetchUserData(userId);

  const { userPending, tenantPending, tenantInactive, shouldBlock } =
    calculateBlockStatus(dbUser, dbTenant);

  const needsOnboarding = calculateNeedsOnboarding(
    dbUser,
    defaultTenant,
    shouldBlock
  );

  const { hasValidTenant, isDefaultTenant } = calculateValidTenant(
    dbTenant,
    dbUser,
    defaultTenant
  );

  return {
    dbUser,
    dbTenant,
    defaultTenant,
    userPending,
    tenantPending,
    tenantInactive,
    shouldBlock,
    needsOnboarding,
    hasValidTenant,
    isDefaultTenant,
  };
}

/**
 * Verifica se uma rota é permitida mesmo quando bloqueado
 */
export function isAllowedRoute(pathname: string): boolean {
  const allowedRoutes = ["/onboarding/pending", "/api/onboarding", "/api/auth"];
  return allowedRoutes.some((route) => pathname.startsWith(route));
}

/**
 * Sincroniza cookies com dados do banco
 */
export function syncDatabaseCookies(
  response: NextResponse,
  dbUser: DatabaseUser | null,
  needsOnboarding: boolean
): void {
  if (dbUser) {
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

    if (dbUser.approvalStatus) {
      response.cookies.set("auth.user.approvalStatus", dbUser.approvalStatus, {
        httpOnly: false,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 dias
      });
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
}

/**
 * Copia todos os cookies de uma resposta para outra
 */
export function copyCookies(source: NextResponse, target: NextResponse): void {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      path: cookie.path,
      maxAge: cookie.maxAge,
    });
  });
}

/**
 * Cria resposta de redirecionamento com cookies copiados
 */
export function createRedirectResponse(
  url: string,
  request: NextRequest,
  sourceResponse: NextResponse
): NextResponse {
  const redirectResponse = NextResponse.redirect(new URL(url, request.url));
  copyCookies(sourceResponse, redirectResponse);
  return redirectResponse;
}
