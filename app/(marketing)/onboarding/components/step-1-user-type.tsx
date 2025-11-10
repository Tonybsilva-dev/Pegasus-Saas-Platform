"use client";

import { Building2, User } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Step1UserTypeProps {
  selectedType: "COMPANY" | "CLIENT" | null;
  onSelect: (type: "COMPANY" | "CLIENT") => void;
}

export function Step1UserType({ selectedType, onSelect }: Step1UserTypeProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm font-medium">Etapa 1/3</p>
        <h1 className="text-foreground text-4xl font-semibold tracking-tight">
          Bem-vindo ao Pegasus
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Escolha como deseja se cadastrar na plataforma
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Card EMPRESA */}
        <Card
          className={cn(
            "hover:border-primary cursor-pointer border-2 transition-all duration-200 hover:shadow-lg",
            selectedType === "COMPANY"
              ? "border-primary bg-card shadow-md"
              : "border-border bg-card"
          )}
          onClick={() => onSelect("COMPANY")}
        >
          <CardHeader className="pb-4">
            <div className="bg-primary/10 mb-4 flex size-12 items-center justify-center rounded-lg">
              <Building2 className="text-primary size-6" />
            </div>
            <CardTitle className="text-card-foreground text-xl font-semibold">
              Empresa
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm leading-relaxed">
              Crie sua organização e gerencie torneios e eventos esportivos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Crie e gerencie eventos</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Organize torneios</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Gerencie atletas e equipes</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Acesso completo à plataforma</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Card CLIENTE */}
        <Card
          className={cn(
            "hover:border-primary cursor-pointer border-2 transition-all duration-200 hover:shadow-lg",
            selectedType === "CLIENT"
              ? "border-primary bg-card shadow-md"
              : "border-border bg-card"
          )}
          onClick={() => onSelect("CLIENT")}
        >
          <CardHeader className="pb-4">
            <div className="bg-primary/10 mb-4 flex size-12 items-center justify-center rounded-lg">
              <User className="text-primary size-6" />
            </div>
            <CardTitle className="text-card-foreground text-xl font-semibold">
              Cliente
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm leading-relaxed">
              Associe-se a uma empresa existente como atleta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Participe de eventos</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Integre-se a equipes</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Acompanhe seus resultados</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Acesso como atleta</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
