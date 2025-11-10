"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useSession } from "@/auth/client";

import { OnboardingView } from "../views/onboarding.view";

type UserType = "COMPANY" | "CLIENT" | null;

interface OnboardingData {
  userType: UserType;
  companyData?: {
    name: string;
    slug: string;
  };
  clientData?: {
    documentNumber: string;
    otpCode?: string;
  };
}

export default function OnboardingContainer() {
  const { data: session, isPending: isSessionPending } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const isCheckingRef = useRef(true);
  const hasCheckedRef = useRef(false); // Flag para evitar múltiplas verificações
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    userType: null,
  });

  // Sincronizar ref com state
  useEffect(() => {
    isCheckingRef.current = isChecking;
  }, [isChecking]);

  // Simplificar: O proxy já faz toda a verificação e redirecionamento no servidor
  // Se chegou aqui, o proxy já permitiu o acesso - apenas aguardar a sessão carregar
  useEffect(() => {
    // Se ainda está carregando a sessão, aguardar
    if (isSessionPending) {
      console.log("🟡 [OnboardingContainer] Aguardando sessão...");
      return;
    }

    // Se chegou aqui, a sessão carregou (ou não existe, mas o proxy já tratou)
    // Liberar a tela - o proxy já fez todos os redirecionamentos necessários
    console.log("✅ [OnboardingContainer] Sessão carregada, liberando tela", {
      hasSession: !!session,
      hasUser: !!session?.user,
    });
    setIsChecking(false);
  }, [session, isSessionPending]);

  // Carregando: apenas enquanto a sessão está carregando ou ainda está verificando
  // O proxy já fez todos os redirecionamentos necessários no servidor
  if (isSessionPending || isChecking) {
    console.log("⏳ [OnboardingContainer] Mostrando tela de carregamento:", {
      isSessionPending,
      isChecking,
      hasSession: !!session,
      hasUser: !!session?.user,
    });

    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  console.log("✅ [OnboardingContainer] Renderizando componente de onboarding");

  // Etapa 1: Escolher tipo de usuário
  const handleUserTypeSelect = (type: "COMPANY" | "CLIENT") => {
    setOnboardingData({ userType: type });
    setCurrentStep(2);
  };

  // Etapa 2: Dados da empresa
  const handleCompanySubmit = async (data: { name: string; slug: string }) => {
    setOnboardingData((prev) => ({
      ...prev,
      companyData: data,
    }));
    setCurrentStep(3);
  };

  // Etapa 2: Dados do cliente
  const handleClientSubmit = async (data: {
    documentNumber: string;
    otpCode?: string;
  }) => {
    setOnboardingData((prev) => ({
      ...prev,
      clientData: data,
    }));
    setCurrentStep(3);
  };

  // Navegação para trás
  const handleBack = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setOnboardingData((prev) => ({
        userType: prev.userType,
        companyData: undefined,
        clientData: undefined,
      }));
      setCurrentStep(1);
    }
  };

  // Etapa 3: Confirmar e finalizar
  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      if (onboardingData.userType === "COMPANY") {
        const response = await fetch("/api/onboarding/create-tenant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(onboardingData.companyData),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || "Erro ao criar tenant");
        }
        const result = await response.json();
        toast.success("Organização criada com sucesso!", {
          description: `Sua organização "${result.tenant.name}" está aguardando aprovação. Você receberá um e-mail quando for aprovada.`,
        });
        router.push("/onboarding/pending");
      } else if (onboardingData.userType === "CLIENT") {
        const response = await fetch("/api/onboarding/associate-client", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(onboardingData.clientData),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || "Erro ao associar cliente");
        }
        await response.json();
        toast.success("Associação solicitada com sucesso!", {
          description:
            "Sua associação está aguardando aprovação da empresa. Você receberá um e-mail quando for aprovada.",
        });
        router.push("/onboarding/pending");
      }
    } catch (error) {
      console.error("Erro ao finalizar onboarding:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao finalizar cadastro. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Dados para a view
  const steps = [
    {
      id: 1,
      title: "Tipo de Cadastro",
      subtitle: "Escolha como deseja se cadastrar",
      icon: "user" as const,
    },
    {
      id: 2,
      title:
        onboardingData.userType === "COMPANY"
          ? "Dados da Empresa"
          : "Associação",
      subtitle:
        onboardingData.userType === "COMPANY"
          ? "Informações da organização"
          : "Associe-se a uma empresa",
      icon:
        onboardingData.userType === "COMPANY"
          ? ("building" as const)
          : ("user" as const),
    },
    {
      id: 3,
      title: "Confirmação",
      subtitle: "Revise e confirme os dados",
      icon: "check" as const,
    },
  ];

  return (
    <OnboardingView
      currentStep={currentStep}
      totalSteps={3}
      steps={steps}
      onboardingData={onboardingData}
      isLoading={isLoading}
      onSelectUserType={handleUserTypeSelect}
      onSubmitCompany={handleCompanySubmit}
      onSubmitClient={handleClientSubmit}
      onBack={handleBack}
      onConfirm={handleConfirm}
    />
  );
}
