"use client";

import { TournamentForm } from "@/components/events/tournament-form";
import { useCreateEvent } from "@/hooks";
import type { CreateEventInput } from "@/validations/event";

/**
 * Página para criar um novo evento (torneio)
 */
export default function NewEventPage() {
  const createEventMutation = useCreateEvent();

  const handleSubmit = async (data: CreateEventInput) => {
    await createEventMutation.mutateAsync(data);
  };

  return (
    <div className="flex flex-col items-center">
      <TournamentForm
        onSubmit={handleSubmit}
        isLoading={createEventMutation.isPending}
        submitLabel="Criar Evento"
        cancelHref="/dashboard/events"
      />
    </div>
  );
}
