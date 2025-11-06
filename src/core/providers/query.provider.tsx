"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

/**
 * Provider do TanStack Query
 * Configura o QueryClient com opções padrão para toda a aplicação
 *
 * @see https://tanstack.com/query/latest
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutos - dados frescos
            gcTime: 10 * 60 * 1000, // 10 minutos - cache mantido
            retry: 1,
            refetchOnWindowFocus: false, // Evitar refetch desnecessário
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
