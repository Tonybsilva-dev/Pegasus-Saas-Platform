"use client";

import { AlertCircle, Calendar, MapPin, Trophy } from "lucide-react";
import Link from "next/link";
import { use } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventData } from "@/hooks";
import { cn } from "@/lib/utils";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Página de detalhes de um evento (torneio) específico
 * Exibe informações completas do evento, modalidades e estatísticas
 */
export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = use(params);
  const { event, isLoading, isError, error } = useEventData(id);

  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="mb-2 h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-4 h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado de erro
  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/dashboard/events"
            className="text-muted-foreground hover:text-foreground mb-4 inline-block text-sm"
          >
            ← Voltar para eventos
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Evento</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="text-destructive size-5" />
              Erro ao carregar evento
            </CardTitle>
            <CardDescription>
              {error?.message || "Ocorreu um erro ao buscar o evento"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Tentar novamente
              </Button>
              <Button asChild variant="secondary">
                <Link href="/dashboard/events">Voltar para eventos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Evento não encontrado
  if (!event) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/dashboard/events"
            className="text-muted-foreground hover:text-foreground mb-4 inline-block text-sm"
          >
            ← Voltar para eventos
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Evento não encontrado
          </h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Evento não encontrado</CardTitle>
            <CardDescription>
              O evento que você está procurando não existe ou não está mais
              disponível.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/events">Voltar para eventos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Data não definida";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (
    status: "DRAFT" | "ACTIVE" | "FINISHED" | "CANCELED"
  ) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "FINISHED":
        return "bg-blue-100 text-blue-800";
      case "CANCELED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (
    status: "DRAFT" | "ACTIVE" | "FINISHED" | "CANCELED"
  ) => {
    switch (status) {
      case "DRAFT":
        return "Rascunho";
      case "ACTIVE":
        return "Ativo";
      case "FINISHED":
        return "Finalizado";
      case "CANCELED":
        return "Cancelado";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/events"
          className="text-muted-foreground hover:text-foreground mb-4 inline-block text-sm"
        >
          ← Voltar para eventos
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
            {event.description && (
              <p className="text-muted-foreground mt-2">{event.description}</p>
            )}
          </div>
          <Badge
            className={cn("shrink-0", getStatusColor(event.status))}
            variant="secondary"
          >
            {getStatusLabel(event.status)}
          </Badge>
        </div>
      </div>

      {/* Informações principais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Evento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.startDate && (
            <div className="flex items-center gap-3">
              <Calendar className="text-muted-foreground size-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Data de Início</p>
                <p className="text-muted-foreground text-sm">
                  {formatDate(event.startDate)}
                </p>
                {event.endDate && (
                  <>
                    <p className="mt-2 text-sm font-medium">Data de Término</p>
                    <p className="text-muted-foreground text-sm">
                      {formatDate(event.endDate)}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
          {event.location && (
            <>
              <Separator />
              <div className="flex items-center gap-3">
                <MapPin className="text-muted-foreground size-5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Localização</p>
                  <p className="text-muted-foreground text-sm">
                    {event.location}
                  </p>
                </div>
              </div>
            </>
          )}
          {event._count && event._count.matches > 0 && (
            <>
              <Separator />
              <div className="flex items-center gap-3">
                <Trophy className="text-muted-foreground size-5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Partidas</p>
                  <p className="text-muted-foreground text-sm">
                    {event._count.matches} partida(s) cadastrada(s)
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modalidades */}
      {event.modalities && event.modalities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Modalidades</CardTitle>
            <CardDescription>
              Modalidades disponíveis neste evento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {event.modalities.map((modality) => (
                <Badge key={modality.id} variant="outline">
                  {modality.name} (
                  {modality.type === "TEAM" ? "Coletivo" : "Individual"})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href={`/dashboard/events/${event.id}/edit`}>Editar Evento</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={`/dashboard/events/${event.id}/matches`}>
            Ver Partidas
          </Link>
        </Button>
      </div>
    </div>
  );
}
