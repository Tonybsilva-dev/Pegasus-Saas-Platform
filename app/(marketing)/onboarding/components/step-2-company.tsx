"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const companySchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  slug: z
    .string()
    .min(3, "Slug deve ter pelo menos 3 caracteres")
    .max(50, "Slug deve ter no máximo 50 caracteres")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug deve conter apenas letras minúsculas, números e hífens"
    ),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface Step2CompanyProps {
  onSubmit: (data: CompanyFormData) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

export function Step2Company({
  onSubmit,
  onBack,
  isLoading,
}: Step2CompanyProps) {
  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      slug: "",
    },
    mode: "onChange",
  });

  // Gerar slug automaticamente a partir do nome
  useEffect(() => {
    const name = form.watch("name");
    if (name) {
      const generatedSlug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[^a-z0-9]+/g, "-") // Substitui espaços e caracteres especiais por hífen
        .replace(/^-+|-+$/g, ""); // Remove hífens do início e fim

      form.setValue("slug", generatedSlug, { shouldValidate: true });
    }
  }, [form.watch("name"), form]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm font-medium">Etapa 2/3</p>
        <h1 className="text-foreground text-4xl font-semibold tracking-tight">
          Informações da Empresa
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Preencha os dados da sua organização para continuar
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Nome da Organização */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground text-sm font-medium">
            Nome da Organização <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            {...form.register("name")}
            placeholder="Ex: Clube de Futebol ABC"
            aria-invalid={!!form.formState.errors.name}
            disabled={isLoading}
            className="h-11"
          />
          {form.formState.errors.name && (
            <p className="text-destructive text-sm">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug" className="text-foreground text-sm font-medium">
            URL da Organização <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm font-medium">
              pegasus.app/
            </span>
            <Input
              id="slug"
              {...form.register("slug")}
              placeholder="clube-abc"
              aria-invalid={!!form.formState.errors.slug}
              disabled={isLoading}
              className="h-11 flex-1"
            />
          </div>
          {form.formState.errors.slug && (
            <p className="text-destructive text-sm">
              {form.formState.errors.slug.message}
            </p>
          )}
          <p className="text-muted-foreground text-xs leading-relaxed">
            O slug será usado na URL pública da sua organização. Use apenas
            letras minúsculas, números e hífens.
          </p>
        </div>

        {/* Informações sobre aprovação */}
        <div className="bg-accent border-border rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <Building2 className="text-primary mt-0.5 size-5" />
            <div className="flex-1 space-y-1">
              <h3 className="text-foreground text-sm font-semibold">
                Aprovação Pendente
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Sua organização será revisada pela nossa equipe. Você receberá
                um e-mail quando sua conta for aprovada e poderá acessar o
                dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1"
            onClick={onBack}
            disabled={isLoading}
            title="Voltar para etapa anterior"
            aria-label="Voltar para escolher tipo de cadastro"
          >
            <ArrowLeft className="mr-2 size-4" />
            Voltar
          </Button>
          <Button type="submit" className="h-11 flex-1" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Criando organização...
              </>
            ) : (
              "Continuar"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
