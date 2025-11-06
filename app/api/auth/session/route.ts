import { NextResponse } from "next/server";

import { auth } from "@/auth";

/**
 * Endpoint de teste para verificar a sessão atual e os dados customizados
 * (tenantId, role) no token JWT.
 *
 * GET /api/auth/session
 * Retorna a sessão completa do usuário autenticado ou 401 se não autenticado
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { message: "Não autenticado", authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      session: {
        user: {
          id: session.user?.id,
          name: session.user?.name,
          email: session.user?.email,
          image: session.user?.image,
          tenantId: session.user?.tenantId,
          role: session.user?.role,
        },
        expires: session.expires,
      },
    });
  } catch (error) {
    console.error("[API] Erro ao obter sessão:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
