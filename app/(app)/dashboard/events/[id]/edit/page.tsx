"use client";

import { use } from "react";

import { TournamentForm } from "@/components/events/tournament-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventData, useUpdateEvent } from "@/hooks";
import type { CreateEventInput } from "@/validations/event";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Página para editar um evento existente
 */
export default function EditEventPage({ params }: EditEventPageProps) {
  const { id } = use(params);
  const { event, isLoading: isLoadingEvent } = useEventData(id);
  const updateEventMutation = useUpdateEvent(id);

  const handleSubmit = async (data: CreateEventInput) => {
    await updateEventMutation.mutateAsync(data);
  };

  // Estado de carregamento
  if (isLoadingEvent) {
    return (
      <div className="flex flex-col items-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Evento não encontrado
  if (!event) {
    return (
      <div className="flex flex-col items-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <h1 className="text-2xl font-bold">Evento não encontrado</h1>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              O evento que você está tentando editar não existe ou não está mais
              disponível.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Preparar valores padrão do formulário
  const defaultValues: Partial<CreateEventInput> = {
    name: event.name,
    description: event.description,
    startDate: event.startDate || null,
    endDate: event.endDate || null,
    location: event.location,
    isPublic: event.isPublic,
    status: event.status,
    bannerUrl: event.bannerUrl,
  };

  return (
    <div className="flex flex-col items-center">
      <TournamentForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        isLoading={updateEventMutation.isPending}
        submitLabel="Salvar Alterações"
        cancelHref={`/dashboard/events/${id}`}
      />
    </div>
  );
}
