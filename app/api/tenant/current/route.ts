import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/core/prisma";
import { getSession } from "@/lib/auth-helpers";

/**
 * GET /api/tenant/current
 * Obtém informações do tenant atual do usuário autenticado
 *
 * Requer autenticação
 */
export async function GET(_request: NextRequest) {
  try {
    // 1. Verificar autenticação
    const session = await getSession(_request);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Não autenticado", error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // 2. Verificar tenantId
    // Se não estiver na sessão, buscar do banco
    let tenantId = (session.user as { tenantId?: string })?.tenantId;

    if (!tenantId) {
      // Buscar tenantId do banco de dados
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tenantId: true },
      });
      tenantId = dbUser?.tenantId ?? undefined;
    }

    if (!tenantId) {
      return NextResponse.json(
        { message: "Tenant não identificado", error: "TENANT_MISSING" },
        { status: 403 }
      );
    }

    // 3. Buscar tenant com isolamento
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        isActive: true,
        plan: true,
        trialEndsAt: true,
        currentPeriodEnd: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { message: "Tenant não encontrado", error: "NOT_FOUND" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        message: "Tenant encontrado",
        tenant: {
          ...tenant,
          trialEndsAt: tenant.trialEndsAt?.toISOString() ?? null,
          currentPeriodEnd: tenant.currentPeriodEnd?.toISOString() ?? null,
          createdAt: tenant.createdAt.toISOString(),
          updatedAt: tenant.updatedAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Erro ao obter tenant:", error);
    return NextResponse.json(
      {
        message: "Erro interno do servidor",
        error: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
