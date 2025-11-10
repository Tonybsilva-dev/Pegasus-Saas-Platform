"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const clientSchema = z.object({
  otpCode: z
    .string()
    .min(6, "OTP deve ter pelo menos 6 caracteres")
    .max(20, "OTP deve ter no máximo 20 caracteres")
    .optional()
    .or(z.literal("")),
  documentNumber: z
    .string()
    .min(11, "CPF deve ter 11 dígitos")
    .max(14, "CPF inválido")
    .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "CPF inválido"),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface Step2ClientProps {
  onSubmit: (data: ClientFormData) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

export function Step2Client({ onSubmit, onBack, isLoading }: Step2ClientProps) {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      otpCode: "",
      documentNumber: "",
    },
    mode: "onChange",
  });

  // Formatar CPF automaticamente
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 6)
        return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
      if (numbers.length <= 9)
        return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
    }
    return value;
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm font-medium">Etapa 2/3</p>
        <h1 className="text-foreground text-4xl font-semibold tracking-tight">
          Associação à Empresa
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Informe o código OTP fornecido pela empresa ou seu CPF se você foi
          pré-cadastrado
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* OTP Code */}
        <div className="space-y-2">
          <Label
            htmlFor="otpCode"
            className="text-foreground text-sm font-medium"
          >
            Código OTP{" "}
            <span className="text-muted-foreground font-normal">
              (Opcional)
            </span>
          </Label>
          <Input
            id="otpCode"
            {...form.register("otpCode")}
            placeholder="Digite o código OTP"
            aria-invalid={!!form.formState.errors.otpCode}
            disabled={isLoading}
            className="h-11"
          />
          {form.formState.errors.otpCode && (
            <p className="text-destructive text-sm">
              {form.formState.errors.otpCode.message}
            </p>
          )}
          <p className="text-muted-foreground text-xs leading-relaxed">
            Se você recebeu um código OTP da empresa, digite-o aqui. Caso
            contrário, use seu CPF se foi pré-cadastrado.
          </p>
        </div>

        {/* CPF */}
        <div className="space-y-2">
          <Label
            htmlFor="documentNumber"
            className="text-foreground text-sm font-medium"
          >
            CPF <span className="text-destructive">*</span>
          </Label>
          <Input
            id="documentNumber"
            {...form.register("documentNumber", {
              onChange: (e) => {
                const formatted = formatCPF(e.target.value);
                form.setValue("documentNumber", formatted, {
                  shouldValidate: true,
                });
              },
            })}
            placeholder="000.000.000-00"
            aria-invalid={!!form.formState.errors.documentNumber}
            disabled={isLoading}
            maxLength={14}
            className="h-11"
          />
          {form.formState.errors.documentNumber && (
            <p className="text-destructive text-sm">
              {form.formState.errors.documentNumber.message}
            </p>
          )}
          <p className="text-muted-foreground text-xs leading-relaxed">
            Informe seu CPF para associação. Se você foi pré-cadastrado pela
            empresa, sua conta será aprovada automaticamente.
          </p>
        </div>

        {/* Informações sobre aprovação */}
        <div className="bg-accent border-border rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <User className="text-primary mt-0.5 size-5" />
            <div className="flex-1 space-y-1">
              <h3 className="text-foreground text-sm font-semibold">
                Aprovação Pendente
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Sua associação será revisada pela empresa. Você receberá um
                e-mail quando sua conta for aprovada e poderá acessar a
                plataforma.
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
                Associando...
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
