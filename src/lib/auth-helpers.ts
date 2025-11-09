import type { NextRequest } from "next/server";

import { auth } from "@/auth";

// Tipo inferido do Better Auth
export type Session = typeof auth.$Infer.Session;

export async function getSession(
  request?: NextRequest
): Promise<Session | null> {
  if (!request) {
    // Se não tiver request, tentar obter do contexto (não recomendado)
    return null;
  }

  return auth.api.getSession({
    headers: request.headers,
  });
}

/**
 * Helper para obter o usuário autenticado
 * Retorna null se não autenticado
 */
export async function getAuthUser(request?: NextRequest) {
  const session = await getSession(request);
  return session?.user ?? null;
}

/**
 * Helper para obter o tenantId do usuário autenticado
 * Retorna null se não autenticado ou sem tenantId
 */
export async function getTenantId(
  request?: NextRequest
): Promise<string | null> {
  const user = await getAuthUser(request);
  if (!user) return null;

  const tenantId = (user as { tenantId?: string })?.tenantId;
  return tenantId ?? null;
}
