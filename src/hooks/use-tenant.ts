"use client";

import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/auth/client";
import type { Tenant, TenantResponse } from "@/core/services/tenant.service";
import { getCurrentTenant } from "@/core/services/tenant.service";

/**
 * Hook para obter informações do tenant atual
 * Query key inclui tenantId para isolamento multi-tenant
 */
export function useTenant() {
  const { data: session } = useSession();
  const tenantId = (session?.user as { tenantId?: string })?.tenantId;

  return useQuery<TenantResponse, Error>({
    queryKey: ["tenant", tenantId],
    queryFn: () => getCurrentTenant(),
    enabled: !!tenantId, // Só executa se houver tenantId
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook auxiliar para obter apenas o objeto tenant
 */
export function useTenantData(): {
  tenant: Tenant | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const { data, isLoading, isError, error } = useTenant();

  return {
    tenant: data?.tenant ?? null,
    isLoading,
    isError,
    error: error ?? null,
  };
}
