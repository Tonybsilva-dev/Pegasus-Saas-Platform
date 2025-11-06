"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { DatePicker } from "@/components/events/date-picker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { type CreateEventInput, createEventSchema } from "@/validations/event";

interface TournamentFormProps {
  defaultValues?: Partial<CreateEventInput>;
  onSubmit: (data: CreateEventInput) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  cancelHref?: string;
  className?: string;
}

/**
 * Componente de formulário para criação e edição de torneios
 * Utiliza react-hook-form com validação Zod
 */
export function TournamentForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = "Criar Evento",
  cancelHref = "/dashboard/events",
  className,
}: TournamentFormProps) {
  const [startDate, setStartDate] = React.useState<Date | null>(
    defaultValues?.startDate ? new Date(defaultValues.startDate) : null
  );
  const [endDate, setEndDate] = React.useState<Date | null>(
    defaultValues?.endDate ? new Date(defaultValues.endDate) : null
  );

  type FormData = z.infer<typeof createEventSchema>;

  const form = useForm<FormData>({
    // @ts-expect-error - zodResolver tem incompatibilidade de tipos com default() do Zod
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      description: defaultValues?.description ?? null,
      startDate: defaultValues?.startDate ?? null,
      endDate: defaultValues?.endDate ?? null,
      location: defaultValues?.location ?? null,
      isPublic: defaultValues?.isPublic ?? false,
      status: defaultValues?.status ?? "DRAFT",
      bannerUrl: defaultValues?.bannerUrl ?? null,
    },
    mode: "onChange",
  });

  const handleSubmit = async (data: FormData) => {
    // Converter datas para ISO string
    const submitData: CreateEventInput = {
      ...data,
      startDate: startDate ? format(startDate, "yyyy-MM-dd'T'HH:mm:ss") : null,
      endDate: endDate ? format(endDate, "yyyy-MM-dd'T'HH:mm:ss") : null,
    };

    await onSubmit(submitData);
  };

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <CardTitle>
          {submitLabel === "Criar Evento" ? "Novo Evento" : "Editar Evento"}
        </CardTitle>
        <CardDescription>
          Preencha os dados abaixo para{" "}
          {submitLabel === "Criar Evento" ? "criar" : "editar"} o evento
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={form.handleSubmit(
          handleSubmit as unknown as Parameters<typeof form.handleSubmit>[0]
        )}
      >
        <CardContent className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome do Evento <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Ex: Copa de Futebol 2024"
              aria-invalid={!!form.formState.errors.name}
            />
            {form.formState.errors.name && (
              <p className="text-destructive text-sm">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Descreva o evento..."
              rows={4}
              aria-invalid={!!form.formState.errors.description}
            />
            {form.formState.errors.description && (
              <p className="text-destructive text-sm">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* Datas */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <DatePicker
                date={startDate}
                onDateChange={(date) => {
                  setStartDate(date || null);
                  form.setValue(
                    "startDate",
                    date ? format(date, "yyyy-MM-dd'T'HH:mm:ss") : null
                  );
                }}
                placeholder="Selecione a data de início"
              />
              {form.formState.errors.startDate && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.startDate.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Término</Label>
              <DatePicker
                date={endDate}
                onDateChange={(date) => {
                  setEndDate(date || null);
                  form.setValue(
                    "endDate",
                    date ? format(date, "yyyy-MM-dd'T'HH:mm:ss") : null
                  );
                }}
                placeholder="Selecione a data de término"
              />
              {form.formState.errors.endDate && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Localização */}
          <div className="space-y-2">
            <Label htmlFor="location">Localização</Label>
            <Input
              id="location"
              {...form.register("location")}
              placeholder="Ex: Arena Central, São Paulo - SP"
              aria-invalid={!!form.formState.errors.location}
            />
            {form.formState.errors.location && (
              <p className="text-destructive text-sm">
                {form.formState.errors.location.message}
              </p>
            )}
          </div>

          {/* Status e Visibilidade */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(
                      value: "DRAFT" | "ACTIVE" | "FINISHED" | "CANCELED"
                    ) => {
                      field.onChange(value);
                    }}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Rascunho</SelectItem>
                      <SelectItem value="ACTIVE">Ativo</SelectItem>
                      <SelectItem value="FINISHED">Finalizado</SelectItem>
                      <SelectItem value="CANCELED">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.status && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.status.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="isPublic">Visibilidade</Label>
              <Controller
                name="isPublic"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value ? "true" : "false"}
                    onValueChange={(value) => {
                      field.onChange(value === "true");
                    }}
                  >
                    <SelectTrigger id="isPublic">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Público</SelectItem>
                      <SelectItem value="false">Privado</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Banner URL */}
          <div className="space-y-2">
            <Label htmlFor="bannerUrl">URL do Banner (opcional)</Label>
            <Input
              id="bannerUrl"
              type="url"
              {...form.register("bannerUrl")}
              placeholder="https://example.com/banner.jpg"
              aria-invalid={!!form.formState.errors.bannerUrl}
            />
            {form.formState.errors.bannerUrl && (
              <p className="text-destructive text-sm">
                {form.formState.errors.bannerUrl.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild disabled={isLoading}>
            <Link href={cancelHref}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
