"use client";

import { CheckCircle2, Clock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { signOut, useSession } from "@/auth/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { OnboardingLayout } from "../components/onboarding-layout";

const pendingSteps = [
  {
    id: 1,
    title: "Aguardando Aprovação",
    subtitle: "Sua solicitação está sendo revisada",
    icon: <Clock className="size-5" />,
  },
];

export default function OnboardingPendingPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && session?.user) {
      const user = session.user as {
        approvalStatus?: string;
      };

      // Se o usuário não está mais pendente, redirecionar para o dashboard
      if (user.approvalStatus !== "PENDING") {
        router.push("/dashboard");
      }
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const userEmail = session?.user?.email;

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <OnboardingLayout currentStep={1} totalSteps={1} steps={pendingSteps}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
            <Clock className="text-primary size-8" />
          </div>
          <CardTitle className="text-2xl">Aguardando Aprovação</CardTitle>
          <CardDescription>
            Sua solicitação está sendo revisada. Você receberá um e-mail quando
            for aprovada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informações */}
          <div className="bg-accent border-border rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <Mail className="text-primary mt-0.5 size-5" />
              <div className="flex-1 space-y-1">
                <h3 className="text-foreground text-sm font-semibold">
                  E-mail de Confirmação
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Enviaremos uma notificação para{" "}
                  <span className="text-foreground font-medium">
                    {userEmail}
                  </span>{" "}
                  assim que sua conta for aprovada.
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="border-border bg-card flex items-center gap-2 rounded-lg border p-3">
            <CheckCircle2 className="text-primary size-5" />
            <div className="flex-1">
              <p className="text-card-foreground text-sm font-semibold">
                Solicitação Enviada
              </p>
              <p className="text-muted-foreground text-xs">
                Sua solicitação foi recebida e está em análise
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="space-y-2">
            <Button
              onClick={handleSignOut}
              className="w-full"
              variant="outline"
            >
              Fazer Logout e Voltar para Login
            </Button>
            <p className="text-muted-foreground text-center text-xs leading-relaxed">
              Você pode fazer logout e retornar mais tarde. Seu progresso será
              mantido.
            </p>
          </div>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
