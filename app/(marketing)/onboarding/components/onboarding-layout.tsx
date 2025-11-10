"use client";

import { CheckCircle2 } from "lucide-react";
import { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface OnboardingStep {
  id: number;
  title: string;
  subtitle: string;
  icon: ReactNode;
}

interface OnboardingLayoutProps {
  currentStep: number;
  totalSteps: number;
  steps: OnboardingStep[];
  children: ReactNode;
}

export function OnboardingLayout({
  currentStep,
  totalSteps,
  steps,
  children,
}: OnboardingLayoutProps) {
  return (
    <div className="bg-background flex min-h-screen">
      {/* Sidebar com etapas - 40% em telas grandes */}
      <aside className="bg-primary text-primary-foreground hidden flex-col lg:flex lg:w-[40%]">
        <div className="flex flex-col gap-12 p-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-primary-foreground/10 flex size-10 items-center justify-center rounded-lg">
              <div className="bg-primary-foreground size-6 rounded-full" />
            </div>
            <span className="text-xl font-semibold">Pegasus</span>
          </div>

          {/* Etapas */}
          <nav
            className="relative flex flex-col gap-8"
            aria-label="Etapas do onboarding"
          >
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="relative flex items-start gap-4">
                  {/* Linha conectora (antes do item) */}
                  {index > 0 && (
                    <div
                      className={cn(
                        "absolute top-0 left-5 h-8 w-0.5 -translate-y-8",
                        isCompleted
                          ? "bg-primary-foreground"
                          : "bg-primary-foreground/20"
                      )}
                    />
                  )}

                  {/* Ícone da etapa */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full border-2 transition-all duration-200",
                        isActive
                          ? "border-primary-foreground bg-primary-foreground/10 shadow-sm"
                          : isCompleted
                            ? "border-primary-foreground bg-primary-foreground"
                            : "border-primary-foreground/30 bg-transparent"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="text-primary size-5" />
                      ) : (
                        <div className="text-primary-foreground">
                          {step.icon}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informações da etapa */}
                  <div className="flex-1 pt-1.5">
                    <h3
                      className={cn(
                        "text-base leading-tight font-semibold transition-colors",
                        isActive
                          ? "text-primary-foreground"
                          : "text-primary-foreground/70"
                      )}
                    >
                      {step.title}
                    </h3>
                    <p className="text-primary-foreground/60 mt-1 text-sm leading-relaxed">
                      {step.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Copyright */}
        <div className="border-primary-foreground/10 mt-auto border-t p-10">
          <p className="text-primary-foreground/50 text-xs">
            Todos os direitos reservados © Pegasus
          </p>
        </div>
      </aside>

      {/* Conteúdo principal - 60% em telas grandes */}
      <main className="bg-muted/30 flex flex-1 flex-col lg:w-[60%]">
        <div className="flex flex-1 items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-2xl">{children}</div>
        </div>
      </main>
    </div>
  );
}
