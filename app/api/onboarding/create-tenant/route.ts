import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/core/prisma";
import { getSession } from "@/lib/auth-helpers";

const createTenantSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  slug: z
    .string()
    .min(3, "Slug deve ter pelo menos 3 caracteres")
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug deve conter apenas letras minúsculas, números e hífens"
    ),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Não autenticado", error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Verificar se precisa de onboarding buscando do banco
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        tenantId: true,
        role: true,
      },
    });

    // Se está no tenant "default" E tem role ATHLETE, precisa de onboarding
    const defaultTenant = await prisma.tenant.findUnique({
      where: { slug: "default" },
      select: { id: true },
    });

    const needsOnboarding =
      defaultTenant &&
      dbUser?.tenantId === defaultTenant.id &&
      dbUser?.role === "ATHLETE";

    if (!needsOnboarding) {
      return NextResponse.json(
        { message: "Onboarding já concluído", error: "ONBOARDING_COMPLETE" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = createTenantSchema.parse(body);

    // Verificar se o slug já existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: validated.slug },
    });

    if (existingTenant) {
      return NextResponse.json(
        { message: "Slug já está em uso", error: "SLUG_EXISTS" },
        { status: 409 }
      );
    }

    // Buscar o usuário atual
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado", error: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Criar o novo tenant com trial de 7 dias
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7 dias de trial

    const newTenant = await prisma.tenant.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        isActive: true,
        plan: "FREE",
        trialEndsAt,
      },
    });

    // Atualizar o usuário para o novo tenant e torná-lo OWNER
    await prisma.user.update({
      where: { id: userId },
      data: {
        tenantId: newTenant.id,
        role: "OWNER",
      },
    });

    // Atualizar todas as sessões do usuário para o novo tenant
    await prisma.session.updateMany({
      where: { userId },
      data: { tenantId: newTenant.id },
    });

    return NextResponse.json(
      {
        message: "Tenant criado com sucesso",
        tenant: {
          id: newTenant.id,
          name: newTenant.name,
          slug: newTenant.slug,
          trialEndsAt: newTenant.trialEndsAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Dados inválidos",
          errors: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("Erro ao criar tenant:", error);
    return NextResponse.json(
      { message: "Erro ao criar tenant", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
