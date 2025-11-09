"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useSession } from "@/auth/client";
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

const onboardingSchema = z.object({
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

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
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

  // Verificar se o usuário precisa de onboarding
  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      router.push("/login");
      return;
    }

    // Verificar se precisa de onboarding buscando do banco
    // Por enquanto, vamos assumir que se está na página de onboarding, precisa
    // A lógica completa será implementada no middleware
  }, [session, isPending, router]);

  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/onboarding/create-tenant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Erro ao criar tenant");
      }

      const result = await response.json();

      toast.success("Organização criada com sucesso!", {
        description: `Bem-vindo ao ${result.tenant.name}! Você tem 7 dias de trial gratuito.`,
      });

      // Invalidar queries relacionadas para forçar atualização
      const tenantId = (session?.user as { tenantId?: string })?.tenantId;
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: ["tenant", tenantId] });
        queryClient.invalidateQueries({ queryKey: ["events", tenantId] });
      }

      // Redirecionar para o dashboard após um breve delay
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh(); // Forçar atualização da sessão
      }, 1000);
    } catch (error) {
      console.error("Erro ao criar tenant:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao criar organização. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isPending) {
    return (
      <main
        className="flex min-h-screen items-center justify-center p-6"
        aria-label="Carregando onboarding"
      >
        <div className="flex items-center gap-2">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-muted-foreground">Carregando...</span>
        </div>
      </main>
    );
  }

  return (
    <main
      className="bg-muted/30 flex min-h-screen items-center justify-center p-6"
      aria-label="Configuração inicial da organização"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
            <Building2 className="text-primary size-6" />
          </div>
          <CardTitle className="text-2xl">Criar sua Organização</CardTitle>
          <CardDescription>
            Configure sua organização para começar a gerenciar torneios e
            eventos esportivos. Você terá 7 dias de trial gratuito!
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Nome da Organização */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome da Organização <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Ex: Clube de Futebol ABC"
                aria-invalid={!!form.formState.errors.name}
                disabled={isLoading}
              />
              {form.formState.errors.name && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">
                URL da Organização <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">
                  pegasus.app/
                </span>
                <Input
                  id="slug"
                  {...form.register("slug")}
                  placeholder="clube-abc"
                  aria-invalid={!!form.formState.errors.slug}
                  disabled={isLoading}
                  className="flex-1"
                />
              </div>
              {form.formState.errors.slug && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.slug.message}
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                O slug será usado na URL pública da sua organização. Use apenas
                letras minúsculas, números e hífens.
              </p>
            </div>

            {/* Informações do Trial */}
            <div className="bg-muted/50 rounded-lg border p-4">
              <h3 className="mb-2 text-sm font-semibold">Trial Gratuito</h3>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>✓ 7 dias de acesso completo</li>
                <li>✓ Todos os recursos disponíveis</li>
                <li>✓ Suporte durante o trial</li>
                <li>✓ Sem necessidade de cartão de crédito</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Criando organização...
                </>
              ) : (
                "Criar Organização"
              )}
            </Button>
            <p className="text-muted-foreground text-center text-xs">
              Ao continuar, você concorda com nossos termos de uso e política de
              privacidade.
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
