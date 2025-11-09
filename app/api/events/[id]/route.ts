import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { prisma } from "@/core/prisma";
import { getSession } from "@/lib/auth-helpers";
import { updateEventSchema } from "@/validations/event";

/**
 * GET /api/events/[id]
 * Obtém um evento específico por ID
 *
 * Requer autenticação
 * Apenas eventos do próprio tenant são acessíveis
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar autenticação
    const session = await getSession(_request);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Não autenticado", error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // 2. Verificar tenantId - buscar do banco se não estiver na sessão
    let tenantId = (session.user as { tenantId?: string })?.tenantId;

    if (!tenantId) {
      // Buscar do banco de dados
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

    // 3. Obter ID do evento
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // 4. Buscar evento com isolamento de tenant
    const event = await prisma.event.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        modalities: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        _count: {
          select: {
            matches: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { message: "Evento não encontrado", error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Evento encontrado",
        event,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Erro ao obter evento:", error);
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
 * PUT /api/events/[id]
 * Atualiza um evento específico
 *
 * Requer autenticação e role ORGANIZER, ADMIN ou OWNER
 * Apenas eventos do próprio tenant podem ser atualizados
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar autenticação
    const session = await getSession(request);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Não autenticado", error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // 2. Verificar tenantId - buscar do banco se não estiver na sessão
    let tenantId = (session.user as { tenantId?: string })?.tenantId;

    if (!tenantId) {
      // Buscar do banco de dados
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

    // 3. Verificar role (apenas ORGANIZER, ADMIN ou OWNER podem atualizar)
    const userRole = (session.user as { role?: string })?.role;

    if (
      userRole !== "ORGANIZER" &&
      userRole !== "ADMIN" &&
      userRole !== "OWNER"
    ) {
      return NextResponse.json(
        {
          message:
            "Acesso negado. Apenas organizadores podem atualizar eventos.",
          error: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // 4. Obter ID do evento
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // 5. Buscar evento com isolamento de tenant
    const existingEvent = await prisma.event.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { message: "Evento não encontrado", error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // 6. Validar body da requisição
    const body = await request.json();
    const validationResult = updateEventSchema.safeParse(body);

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

    // 7. Preparar dados para atualização
    const updateData: {
      name?: string;
      description?: string | null;
      startDate?: Date | null;
      endDate?: Date | null;
      location?: string | null;
      isPublic?: boolean;
      status?: "DRAFT" | "ACTIVE" | "FINISHED" | "CANCELED";
      bannerUrl?: string | null;
    } = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.description !== undefined) {
      updateData.description = data.description ?? null;
    }
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    }
    if (data.location !== undefined) {
      updateData.location = data.location ?? null;
    }
    if (data.isPublic !== undefined) {
      updateData.isPublic = data.isPublic;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.bannerUrl !== undefined) {
      updateData.bannerUrl = data.bannerUrl ?? null;
    }

    // 8. Atualizar evento
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      {
        message: "Evento atualizado com sucesso",
        event: updatedEvent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Erro ao atualizar evento:", error);

    // Se for erro de validação do Prisma
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        {
          message: "Conflito ao atualizar evento",
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
 * DELETE /api/events/[id]
 * Deleta um evento específico
 *
 * Requer autenticação e role ORGANIZER, ADMIN ou OWNER
 * Apenas eventos do próprio tenant podem ser deletados
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar autenticação
    const session = await getSession(_request);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Não autenticado", error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // 2. Verificar tenantId - buscar do banco se não estiver na sessão
    let tenantId = (session.user as { tenantId?: string })?.tenantId;

    if (!tenantId) {
      // Buscar do banco de dados
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

    // 3. Verificar role (apenas ORGANIZER, ADMIN ou OWNER podem deletar)
    const userRole = (session.user as { role?: string })?.role;

    if (
      userRole !== "ORGANIZER" &&
      userRole !== "ADMIN" &&
      userRole !== "OWNER"
    ) {
      return NextResponse.json(
        {
          message: "Acesso negado. Apenas organizadores podem deletar eventos.",
          error: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // 4. Obter ID do evento
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // 5. Buscar evento com isolamento de tenant
    const existingEvent = await prisma.event.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { message: "Evento não encontrado", error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // 6. Deletar evento (cascade deletará modalidades, times, partidas, etc.)
    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        message: "Evento deletado com sucesso",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Erro ao deletar evento:", error);

    return NextResponse.json(
      {
        message: "Erro interno do servidor",
        error: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
