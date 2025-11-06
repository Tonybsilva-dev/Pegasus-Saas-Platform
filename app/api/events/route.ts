import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/core/prisma";
import { createEventSchema } from "@/validations/event";

/**
 * POST /api/events
 * Cria um novo evento (torneio)
 *
 * Requer autenticação e role ORGANIZER, ADMIN ou OWNER
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Não autenticado", error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // 2. Verificar tenantId
    const tenantId = (session.user as { tenantId?: string })?.tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { message: "Tenant não identificado", error: "TENANT_MISSING" },
        { status: 403 }
      );
    }

    // 3. Verificar role (apenas ORGANIZER, ADMIN ou OWNER podem criar)
    const userRole = (session.user as { role?: string })?.role;

    if (
      userRole !== "ORGANIZER" &&
      userRole !== "ADMIN" &&
      userRole !== "OWNER"
    ) {
      return NextResponse.json(
        {
          message: "Acesso negado. Apenas organizadores podem criar eventos.",
          error: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // 4. Validar body da requisição
    const body = await request.json();
    const validationResult = createEventSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos",
          error: "VALIDATION_ERROR",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 5. Criar evento associado ao tenantId
    const event = await prisma.event.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description ?? null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        location: data.location ?? null,
        isPublic: data.isPublic ?? false,
        status: data.status ?? "DRAFT",
        bannerUrl: data.bannerUrl ?? null,
        createdById: (session.user as { id?: string })?.id ?? null,
      },
    });

    return NextResponse.json(
      {
        message: "Evento criado com sucesso",
        event,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] Erro ao criar evento:", error);

    // Se for erro de validação do Prisma
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        {
          message: "Conflito ao criar evento",
          error: "CONFLICT",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        message: "Erro interno do servidor",
        error: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/events
 * Lista todos os eventos do tenant do usuário autenticado
 *
 * Requer autenticação
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticação
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Não autenticado", error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // 2. Verificar tenantId
    const tenantId = (session.user as { tenantId?: string })?.tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { message: "Tenant não identificado", error: "TENANT_MISSING" },
        { status: 403 }
      );
    }

    // 3. Obter parâmetros de query (opcional)
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const isPublic = searchParams.get("isPublic");

    // 4. Construir filtros
    const where: {
      tenantId: string;
      status?: "DRAFT" | "ACTIVE" | "FINISHED" | "CANCELED";
      isPublic?: boolean;
    } = {
      tenantId,
    };

    if (
      status &&
      ["DRAFT", "ACTIVE", "FINISHED", "CANCELED"].includes(status)
    ) {
      where.status = status as "DRAFT" | "ACTIVE" | "FINISHED" | "CANCELED";
    }

    if (isPublic !== null) {
      where.isPublic = isPublic === "true";
    }

    // 5. Buscar eventos com isolamento de tenant
    const events = await prisma.event.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        isPublic: true,
        status: true,
        bannerUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Eventos listados com sucesso",
        events,
        count: events.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Erro ao listar eventos:", error);
    return NextResponse.json(
      {
        message: "Erro interno do servidor",
        error: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
