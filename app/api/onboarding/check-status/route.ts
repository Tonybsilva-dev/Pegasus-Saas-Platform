import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/core/prisma";
import { getSession } from "@/lib/auth-helpers";

/**
 * Verifica o status do usuário para determinar se pode acessar /onboarding
 * Retorna:
 * - hasValidTenant: true se tem tenant APPROVED e ACTIVE (não-default)
 * - isPending: true se usuário ou tenant está PENDING
 * - needsOnboarding: true se precisa fazer onboarding
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Não autenticado", error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Buscar dados do usuário
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        tenantId: true,
        role: true,
        approvalStatus: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { message: "Usuário não encontrado", error: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Buscar tenant "default"
    const defaultTenant = await prisma.tenant.findUnique({
      where: { slug: "default" },
      select: { id: true },
    });

    // Verificar se está pendente
    const userPending = dbUser.approvalStatus === "PENDING";
    let tenantPending = false;
    let tenantInactive = false;
    let tenantApproved = false;
    let tenantActive = false;

    // Se tem tenantId, buscar dados do tenant
    if (dbUser.tenantId) {
      const dbTenant = await prisma.tenant.findUnique({
        where: { id: dbUser.tenantId },
        select: {
          approvalStatus: true,
          isActive: true,
        },
      });

      if (dbTenant) {
        tenantPending = dbTenant.approvalStatus === "PENDING";
        tenantInactive = dbTenant.isActive === false;
        tenantApproved = dbTenant.approvalStatus === "APPROVED";
        tenantActive = dbTenant.isActive === true;
      }
    }

    const isPending = userPending || tenantPending || tenantInactive;
    const isDefaultTenant =
      defaultTenant && dbUser.tenantId === defaultTenant.id;
    const hasValidTenant =
      dbUser.tenantId && !isDefaultTenant && tenantApproved && tenantActive;

    // Calcular needsOnboarding
    // needsOnboarding = true se:
    // - tenantId é null (usuário novo sem tenant) OU
    // - está no tenant "default" (temporário, precisa fazer onboarding)
    // IMPORTANTE: needsOnboarding pode ser true mesmo quando isPending é true
    // se o usuário não tiver tenant ou estiver no tenant "default"
    let needsOnboarding = false;
    if (!dbUser.tenantId) {
      // Usuário sem tenant - precisa fazer onboarding
      needsOnboarding = true;
    } else if (isDefaultTenant) {
      // Se está no tenant "default", precisa de onboarding (mesmo se bloqueado)
      needsOnboarding = true;
    }

    return NextResponse.json({
      hasValidTenant,
      isPending,
      needsOnboarding,
      userPending,
      tenantPending,
      tenantInactive,
      tenantApproved,
      tenantActive,
      isDefaultTenant,
      hasTenantId: !!dbUser.tenantId,
      role: dbUser.role,
    });
  } catch (error) {
    console.error("Erro ao verificar status do usuário:", error);
    return NextResponse.json(
      {
        message: "Erro ao verificar status",
        error: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
