"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";

import { TournamentCard } from "@/components/events/tournament-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventsList } from "@/hooks";

/**
 * Página de listagem de eventos (torneios)
 * Exibe todos os eventos do tenant em cards
 */
export default function EventsPage() {
  const { events, isLoading, isError, error } = useEventsList();

  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus torneios e competições
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Estado de erro
  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus torneios e competições
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="text-destructive size-5" />
              Erro ao carregar eventos
            </CardTitle>
            <CardDescription>
              {error?.message || "Ocorreu um erro ao buscar os eventos"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} variant="outline">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado vazio
  if (events.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus torneios e competições
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Nenhum evento encontrado</CardTitle>
            <CardDescription>
              Você ainda não criou nenhum evento. Comece criando seu primeiro
              torneio!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/events/new">Criar Evento</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Lista de eventos
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
          <p className="text-muted-foreground mt-2">
            {events.length}{" "}
            {events.length === 1 ? "evento encontrado" : "eventos encontrados"}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/events/new">Criar Evento</Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <TournamentCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
