"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import type {
  Event,
  EventResponse,
  EventsListParams,
  EventsListResponse,
} from "@/core/services/event.service";
import { getEvent, getEvents } from "@/core/services/event.service";

/**
 * Hook para listar eventos (torneios)
 * Query key inclui tenantId para isolamento multi-tenant
 */
export function useEvents(params?: EventsListParams) {
  const { data: session } = useSession();
  const tenantId = (session?.user as { tenantId?: string })?.tenantId;

  return useQuery<EventsListResponse, Error>({
    queryKey: ["events", tenantId, params],
    queryFn: () => getEvents(params),
    enabled: !!tenantId, // Só executa se houver tenantId
    staleTime: 60000, // 1 minuto
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para obter um evento específico
 * Query key inclui tenantId e eventId para isolamento multi-tenant
 */
export function useEvent(eventId: string) {
  const { data: session } = useSession();
  const tenantId = (session?.user as { tenantId?: string })?.tenantId;

  return useQuery<EventResponse, Error>({
    queryKey: ["events", tenantId, eventId],
    queryFn: () => getEvent(eventId),
    enabled: !!tenantId && !!eventId, // Só executa se houver tenantId e eventId
    staleTime: 60000, // 1 minuto
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook auxiliar para obter apenas o array de eventos
 */
export function useEventsList(params?: EventsListParams): {
  events: Event[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const { data, isLoading, isError, error } = useEvents(params);

  return {
    events: data?.events || [],
    isLoading,
    isError,
    error: error || null,
  };
}

/**
 * Hook auxiliar para obter apenas o evento
 */
export function useEventData(eventId: string): {
  event: Event | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const { data, isLoading, isError, error } = useEvent(eventId);

  return {
    event: data?.event || null,
    isLoading,
    isError,
    error: error || null,
  };
}
