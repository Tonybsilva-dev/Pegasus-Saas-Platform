"use client";

import { LogIn } from "lucide-react";
import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Providers = Record<string, { id: string; name: string }> | null;

export default function LoginPage() {
  const [providers, setProviders] = useState<Providers>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getProviders()
      .then((res) => {
        if (mounted) setProviders(res);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const hasGoogle = !!providers?.google;

  return (
    <main
      className="flex min-h-[70vh] items-center justify-center p-6"
      aria-label="Página de login"
    >
      <div className="mx-auto w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
          <p className="text-muted-foreground text-sm">
            {hasGoogle
              ? "Acesse sua conta com o Google para continuar"
              : "Login com Google indisponível. Verifique GOOGLE_CLIENT_ID/SECRET."}
          </p>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            title="Entrar com Google"
            aria-label="Entrar com Google"
            disabled={!hasGoogle || loading}
          >
            <LogIn className="mr-2 size-4" />
            {loading ? "Carregando..." : "Entrar com Google"}
          </Button>
          {!hasGoogle && !loading && (
            <p className="text-muted-foreground text-xs">
              Dica: defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no seu .env e
              reinicie o servidor.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
