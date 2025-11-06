import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/core/prisma";
import { updateMatchSchema } from "@/validations/match";

/**
 * PUT /api/matches/[id]
 * Atualiza uma partida (agendamento e/ou resultado)
 *
 * Requer autenticação e role ORGANIZER ou ADMIN
 * Apenas organizadores podem atualizar partidas
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 3. Verificar role (apenas ORGANIZER ou ADMIN podem atualizar)
    const userRole = (session.user as { role?: string })?.role;

    if (
      userRole !== "ORGANIZER" &&
      userRole !== "ADMIN" &&
      userRole !== "OWNER"
    ) {
      return NextResponse.json(
        {
          message:
            "Acesso negado. Apenas organizadores podem atualizar partidas.",
          error: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // 4. Obter ID da partida
    const { id } = await params();

    // 5. Buscar partida com isolamento de tenant
    const match = await prisma.match.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        result: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { message: "Partida não encontrada", error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // 6. Validar body da requisição
    const body = await request.json();
    const validationResult = updateMatchSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos",
          error: "VALIDATION_ERROR",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 7. Verificar se a partida já está finalizada e tentando atualizar resultado
    if (
      match.status === "FINISHED" &&
      (data.teamAScore !== undefined || data.teamBScore !== undefined)
    ) {
      return NextResponse.json(
        {
          message:
            "Não é possível atualizar resultado de uma partida finalizada",
          error: "MATCH_ALREADY_FINISHED",
        },
        { status: 400 }
      );
    }

    // 8. Preparar dados para atualização do Match
    const matchUpdateData: {
      scheduledAt?: Date;
      startTime?: Date;
      endTime?: Date;
      round?: number;
      status?: "SCHEDULED" | "IN_PROGRESS" | "FINISHED" | "CANCELED";
    } = {};

    if (data.scheduledAt) {
      matchUpdateData.scheduledAt = new Date(data.scheduledAt);
    }
    if (data.startTime) {
      matchUpdateData.startTime = new Date(data.startTime);
    }
    if (data.endTime) {
      matchUpdateData.endTime = new Date(data.endTime);
    }
    if (data.round !== undefined) {
      matchUpdateData.round = data.round;
    }

    // 9. Se houver resultado, atualizar status para FINISHED
    const hasResult =
      data.teamAScore !== undefined && data.teamBScore !== undefined;

    if (hasResult) {
      matchUpdateData.status = "FINISHED";
    }

    // 10. Atualizar Match e MatchResult em uma transação
    const updatedMatch = await prisma.$transaction(async (tx) => {
      // Atualizar Match
      const updated = await tx.match.update({
        where: { id },
        data: matchUpdateData,
        include: {
          teamA: true,
          teamB: true,
          result: true,
        },
      });

      // Se houver resultado, criar ou atualizar MatchResult
      if (hasResult) {
        const resultData = {
          tenantId,
          matchId: id,
          teamAScore: data.teamAScore!,
          teamBScore: data.teamBScore!,
          extraTime: data.extraTime ?? false,
          penalties: data.penalties ?? false,
          notes: data.notes ?? undefined,
        };

        if (match.result) {
          // Atualizar resultado existente
          await tx.matchResult.update({
            where: { matchId: id },
            data: resultData,
          });
        } else {
          // Criar novo resultado
          await tx.matchResult.create({
            data: resultData,
          });
        }

        // Determinar vencedor e atualizar winnerId
        let winnerId: string | null = null;
        if (data.teamAScore! > data.teamBScore!) {
          winnerId = match.teamAId;
        } else if (data.teamBScore! > data.teamAScore!) {
          winnerId = match.teamBId;
        }
        // Se empate, winnerId permanece null

        if (winnerId) {
          await tx.match.update({
            where: { id },
            data: { winnerId },
          });
        }

        // Buscar Match atualizado com resultado
        return await tx.match.findUnique({
          where: { id },
          include: {
            teamA: true,
            teamB: true,
            winner: true,
            result: true,
          },
        });
      }

      return updated;
    });

    return NextResponse.json(
      {
        message: "Partida atualizada com sucesso",
        match: updatedMatch,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Erro ao atualizar partida:", error);

    // Se for erro de validação do Prisma
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        {
          message: "Conflito ao atualizar partida",
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
