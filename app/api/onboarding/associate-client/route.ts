import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/core/prisma";
import { getSession } from "@/lib/auth-helpers";

const associateClientSchema = z.object({
  otpCode: z
    .string()
    .min(6, "OTP deve ter pelo menos 6 caracteres")
    .max(20, "OTP deve ter no máximo 20 caracteres")
    .optional()
    .or(z.literal("")),
  documentNumber: z
    .string()
    .min(11, "CPF deve ter 11 dígitos")
    .max(14, "CPF inválido")
    .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "CPF inválido"),
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

    // Buscar tenant "default"
    const defaultTenant = await prisma.tenant.findUnique({
      where: { slug: "default" },
      select: { id: true },
    });

    // Verificar se já tem tenant válido (não-default)
    if (dbUser?.tenantId) {
      const dbTenant = await prisma.tenant.findUnique({
        where: { id: dbUser.tenantId },
        select: {
          approvalStatus: true,
          isActive: true,
          slug: true,
        },
      });

      // Se tem tenant válido (approved + active) e não é o tenant "default", bloquear
      if (
        dbTenant &&
        dbTenant.slug !== "default" &&
        dbTenant.approvalStatus === "APPROVED" &&
        dbTenant.isActive === true
      ) {
        return NextResponse.json(
          {
            message:
              "Onboarding já concluído. Você já está associado a uma organização.",
            error: "ONBOARDING_COMPLETE",
          },
          { status: 400 }
        );
      }
    }

    // Verificar se precisa de onboarding
    // needsOnboarding = true se:
    // - tenantId é null (usuário novo sem tenant) OU
    // - está no tenant "default" (temporário)
    const isDefaultTenant =
      defaultTenant && dbUser?.tenantId === defaultTenant.id;
    const needsOnboarding = !dbUser?.tenantId || isDefaultTenant;

    if (!needsOnboarding) {
      return NextResponse.json(
        {
          message: "Onboarding já concluído",
          error: "ONBOARDING_COMPLETE",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = associateClientSchema.parse(body);

    // Normalizar CPF (remover formatação)
    const normalizedCPF = validated.documentNumber.replace(/\D/g, "");

    let targetTenant: { id: string; name: string } | null = null;

    // Se tem OTP, buscar tenant pelo OTP
    if (validated.otpCode && validated.otpCode.trim() !== "") {
      targetTenant = await prisma.tenant.findUnique({
        where: {
          otpCode: validated.otpCode,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!targetTenant) {
        return NextResponse.json(
          { message: "Código OTP inválido ou expirado", error: "INVALID_OTP" },
          { status: 404 }
        );
      }

      // Verificar se OTP não expirou
      const tenantWithOTP = await prisma.tenant.findUnique({
        where: { id: targetTenant.id },
        select: { otpExpiresAt: true },
      });

      if (
        tenantWithOTP?.otpExpiresAt &&
        tenantWithOTP.otpExpiresAt < new Date()
      ) {
        return NextResponse.json(
          { message: "Código OTP expirado", error: "OTP_EXPIRED" },
          { status: 400 }
        );
      }
    } else {
      // Se não tem OTP, buscar tenant que tenha pré-cadastrado o CPF
      // Buscar usuário com o CPF em qualquer tenant (exceto default)
      const preRegisteredUser = await prisma.user.findFirst({
        where: {
          documentNumber: normalizedCPF,
          tenant: {
            slug: {
              not: "default",
            },
          },
        },
        select: {
          tenantId: true,
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (preRegisteredUser) {
        targetTenant = {
          id: preRegisteredUser.tenant.id,
          name: preRegisteredUser.tenant.name,
        };
      } else {
        return NextResponse.json(
          {
            message:
              "CPF não encontrado. Informe o código OTP fornecido pela empresa ou verifique se foi pré-cadastrado.",
            error: "CPF_NOT_FOUND",
          },
          { status: 404 }
        );
      }
    }

    if (!targetTenant) {
      return NextResponse.json(
        {
          message:
            "Não foi possível associar. Verifique o código OTP ou CPF informado.",
          error: "ASSOCIATION_FAILED",
        },
        { status: 400 }
      );
    }

    // Atualizar o usuário para o tenant encontrado
    // Se foi pré-cadastrado (sem OTP), aprovar automaticamente
    // Se usou OTP, deixar pendente para aprovação
    const wasPreRegistered =
      !validated.otpCode || validated.otpCode.trim() === "";

    await prisma.user.update({
      where: { id: userId },
      data: {
        tenantId: targetTenant.id,
        role: "ATHLETE",
        documentNumber: normalizedCPF,
        approvalStatus: wasPreRegistered ? "APPROVED" : "PENDING",
        approvedAt: wasPreRegistered ? new Date() : null,
      },
    });

    // Atualizar todas as sessões do usuário para o novo tenant
    await prisma.session.updateMany({
      where: { userId },
      data: { tenantId: targetTenant.id },
    });

    return NextResponse.json(
      {
        message: wasPreRegistered
          ? "Associação aprovada automaticamente"
          : "Associação solicitada com sucesso",
        tenant: {
          id: targetTenant.id,
          name: targetTenant.name,
        },
        approved: wasPreRegistered,
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

    console.error("Erro ao associar cliente:", error);
    return NextResponse.json(
      { message: "Erro ao associar cliente", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
