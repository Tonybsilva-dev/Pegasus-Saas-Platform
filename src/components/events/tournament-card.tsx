"use client";

import { Calendar, MapPin, Users } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Event } from "@/core/services/event.service";
import { cn } from "@/lib/utils";

interface TournamentCardProps {
  event: Event;
  className?: string;
}

/**
 * Componente Card para exibir informações de um torneio/evento
 */
export function TournamentCard({ event, className }: TournamentCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Data não definida";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (
    status: "DRAFT" | "ACTIVE" | "FINISHED" | "CANCELED"
  ) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      case "ACTIVE":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "FINISHED":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "CANCELED":
        return "bg-red-100 text-red-800 hover:bg-red-200";
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
    <Card
      className={cn(
        "hover:border-primary/50 transition-shadow hover:shadow-md",
        className
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-lg">{event.name}</CardTitle>
          <Badge
            className={cn("shrink-0", getStatusColor(event.status))}
            variant="secondary"
          >
            {getStatusLabel(event.status)}
          </Badge>
        </div>
        {event.description && (
          <CardDescription className="line-clamp-2">
            {event.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {event.startDate && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Calendar className="size-4 shrink-0" />
            <span>
              {formatDate(event.startDate)}
              {event.endDate && ` - ${formatDate(event.endDate)}`}
            </span>
          </div>
        )}
        {event.location && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <MapPin className="size-4 shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        )}
        {event._count && event._count.matches > 0 && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Users className="size-4 shrink-0" />
            <span>{event._count.matches} partida(s)</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link
          href={`/dashboard/events/${event.id}`}
          className="text-primary text-sm font-medium hover:underline"
          title={`Ver detalhes de ${event.name}`}
        >
          Ver detalhes →
        </Link>
      </CardFooter>
    </Card>
  );
}
