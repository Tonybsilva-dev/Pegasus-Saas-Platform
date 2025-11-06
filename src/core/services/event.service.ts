/**
 * Serviço para requisições de eventos (torneios)
 * Funções puras que retornam Promises - sem gerenciar estado
 */

export interface Event {
  id: string;
  tenantId?: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  isPublic: boolean;
  status: "DRAFT" | "ACTIVE" | "FINISHED" | "CANCELED";
  bannerUrl: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  modalities?: Modality[];
  _count?: {
    matches: number;
  };
}

export interface Modality {
  id: string;
  name: string;
  type: "TEAM" | "SOLO";
}

export interface EventsListResponse {
  message: string;
  events: Event[];
  count: number;
}

export interface EventResponse {
  message: string;
  event: Event;
}

export interface EventsListParams {
  status?: "DRAFT" | "ACTIVE" | "FINISHED" | "CANCELED";
  isPublic?: boolean;
}

/**
 * Lista todos os eventos do tenant do usuário autenticado
 */
export async function getEvents(
  params?: EventsListParams
): Promise<EventsListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) {
    searchParams.append("status", params.status);
  }
  if (params?.isPublic !== undefined) {
    searchParams.append("isPublic", String(params.isPublic));
  }

  const url = `/api/events${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Erro ao buscar eventos");
  }

  return response.json();
}

/**
 * Obtém um evento específico por ID
 */
export async function getEvent(eventId: string): Promise<EventResponse> {
  const response = await fetch(`/api/events/${eventId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Erro ao buscar evento");
  }

  return response.json();
}
