/**
 * Serviço para buscar informações do tenant
 */

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  isActive: boolean;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantResponse {
  message: string;
  tenant: Tenant;
}

/**
 * Busca informações do tenant atual do usuário autenticado
 */
export async function getCurrentTenant(): Promise<TenantResponse> {
  const response = await fetch("/api/tenant/current", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Erro ao buscar tenant");
  }

  return response.json();
}
