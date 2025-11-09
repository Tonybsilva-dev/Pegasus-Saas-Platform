"use client";

import { LogIn } from "lucide-react";
import { useState } from "react";

import { signIn } from "@/auth/client";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  // Better Auth sempre tem Google se configurado

  return (
    <main
      className="flex min-h-[70vh] items-center justify-center p-6"
      aria-label="Página de login"
    >
      <div className="mx-auto w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
          <p className="text-muted-foreground text-sm">
            Acesse sua conta com o Google para continuar
          </p>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={async () => {
              await signIn.social({
                provider: "google",
                callbackURL: "/dashboard",
                // Redirecionar novos usuários para onboarding
                newUserCallbackURL: "/onboarding",
              });
            }}
            title="Entrar com Google"
            aria-label="Entrar com Google"
            disabled={loading}
          >
            <LogIn className="mr-2 size-4" />
            {loading ? "Carregando..." : "Entrar com Google"}
          </Button>
        </div>
      </div>
    </main>
  );
}
