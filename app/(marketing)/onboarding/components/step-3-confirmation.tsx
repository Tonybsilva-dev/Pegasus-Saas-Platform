"use client";

import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ConfirmationData {
  userType: "COMPANY" | "CLIENT";
  companyData?: {
    name: string;
    slug: string;
  };
  clientData?: {
    documentNumber: string;
    otpCode?: string;
  };
}

interface Step3ConfirmationProps {
  data: ConfirmationData;
  onConfirm: () => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

export function Step3Confirmation({
  data,
  onConfirm,
  onBack,
  isLoading,
}: Step3ConfirmationProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm font-medium">Etapa 3/3</p>
        <h1 className="text-foreground text-4xl font-semibold tracking-tight">
          Confirmação
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Revise os dados informados antes de finalizar
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-card-foreground text-xl font-semibold">
            Resumo dos Dados
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Verifique se todas as informações estão corretas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tipo de usuário */}
          <div className="border-border flex items-center justify-between border-b pb-3">
            <span className="text-muted-foreground text-sm">
              Tipo de Cadastro
            </span>
            <span className="text-foreground font-semibold">
              {data.userType === "COMPANY" ? "Empresa" : "Cliente"}
            </span>
          </div>

          {/* Dados específicos */}
          {data.userType === "COMPANY" && data.companyData && (
            <>
              <div className="border-border flex items-center justify-between border-b pb-3">
                <span className="text-muted-foreground text-sm">
                  Nome da Organização
                </span>
                <span className="text-foreground font-semibold">
                  {data.companyData.name}
                </span>
              </div>
              <div className="border-border flex items-center justify-between border-b pb-3">
                <span className="text-muted-foreground text-sm">
                  URL da Organização
                </span>
                <span className="text-foreground font-semibold">
                  pegasus.app/{data.companyData.slug}
                </span>
              </div>
            </>
          )}

          {data.userType === "CLIENT" && data.clientData && (
            <>
              <div className="border-border flex items-center justify-between border-b pb-3">
                <span className="text-muted-foreground text-sm">CPF</span>
                <span className="text-foreground font-semibold">
                  {data.clientData.documentNumber}
                </span>
              </div>
              {data.clientData.otpCode && (
                <div className="border-border flex items-center justify-between border-b pb-3">
                  <span className="text-muted-foreground text-sm">
                    Código OTP
                  </span>
                  <span className="text-foreground font-semibold">
                    {data.clientData.otpCode}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Informação sobre aprovação */}
          <div className="bg-accent border-border rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-primary mt-0.5 size-5" />
              <div className="flex-1 space-y-1">
                <h3 className="text-foreground text-sm font-semibold">
                  Próximos Passos
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {data.userType === "COMPANY"
                    ? "Sua organização será revisada pela nossa equipe. Você receberá um e-mail quando sua conta for aprovada."
                    : "Sua associação será revisada pela empresa. Você receberá um e-mail quando sua conta for aprovada."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1"
          onClick={onBack}
          disabled={isLoading}
          title="Voltar para etapa anterior"
          aria-label="Voltar para editar dados"
        >
          <ArrowLeft className="mr-2 size-4" />
          Voltar
        </Button>
        <Button
          type="button"
          className="h-11 flex-1"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Finalizando...
            </>
          ) : (
            "Confirmar e Finalizar"
          )}
        </Button>
      </div>
    </div>
  );
}
