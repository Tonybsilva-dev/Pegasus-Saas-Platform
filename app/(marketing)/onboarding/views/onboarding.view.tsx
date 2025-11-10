"use client";

import { Building2, CheckCircle2, User } from "lucide-react";

import { OnboardingLayout } from "../components/onboarding-layout";
import { Step1UserType } from "../components/step-1-user-type";
import { Step2Client } from "../components/step-2-client";
import { Step2Company } from "../components/step-2-company";
import { Step3Confirmation } from "../components/step-3-confirmation";

type UserType = "COMPANY" | "CLIENT" | null;

interface OnboardingData {
  userType: UserType;
  companyData?: { name: string; slug: string };
  clientData?: { documentNumber: string; otpCode?: string };
}

type StepIcon = "user" | "building" | "check";

interface Step {
  id: number;
  title: string;
  subtitle: string;
  icon: StepIcon;
}

interface OnboardingViewProps {
  currentStep: number;
  totalSteps: number;
  steps: Step[];
  onboardingData: OnboardingData;
  isLoading: boolean;
  onSelectUserType: (type: "COMPANY" | "CLIENT") => void;
  onSubmitCompany: (data: { name: string; slug: string }) => Promise<void>;
  onSubmitClient: (data: {
    documentNumber: string;
    otpCode?: string;
  }) => Promise<void>;
  onBack: () => void;
  onConfirm: () => Promise<void>;
}

function resolveIcon(icon: StepIcon) {
  if (icon === "building") return <Building2 className="size-5" />;
  if (icon === "check") return <CheckCircle2 className="size-5" />;
  return <User className="size-5" />;
}

export function OnboardingView({
  currentStep,
  totalSteps,
  steps,
  onboardingData,
  isLoading,
  onSelectUserType,
  onSubmitCompany,
  onSubmitClient,
  onBack,
  onConfirm,
}: OnboardingViewProps) {
  // Converter steps para a estrutura visual esperada pelo layout
  const visualSteps = steps.map((s) => ({
    id: s.id,
    title: s.title,
    subtitle: s.subtitle,
    icon: resolveIcon(s.icon),
  }));

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      steps={visualSteps}
    >
      {currentStep === 1 && (
        <Step1UserType
          selectedType={onboardingData.userType}
          onSelect={onSelectUserType}
        />
      )}

      {currentStep === 2 && onboardingData.userType === "COMPANY" && (
        <Step2Company
          onSubmit={onSubmitCompany}
          onBack={onBack}
          isLoading={isLoading}
        />
      )}

      {currentStep === 2 && onboardingData.userType === "CLIENT" && (
        <Step2Client
          onSubmit={onSubmitClient}
          onBack={onBack}
          isLoading={isLoading}
        />
      )}

      {currentStep === 3 && onboardingData.userType && (
        <Step3Confirmation
          data={{
            userType: onboardingData.userType,
            companyData: onboardingData.companyData,
            clientData: onboardingData.clientData,
          }}
          onConfirm={onConfirm}
          onBack={onBack}
          isLoading={isLoading}
        />
      )}
    </OnboardingLayout>
  );
}
