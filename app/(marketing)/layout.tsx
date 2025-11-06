import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pegasus - Plataforma de Torneios Corporativos",
  description:
    "SaaS multi-tenant para organização de torneios esportivos corporativos",
};

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Skip Link para navegação por teclado */}
      <a
        href="#main-content"
        className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-4 py-2 font-medium transition-all focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
        title="Pular para o conteúdo principal"
      >
        Pular para o conteúdo principal
      </a>

      {/* TODO: Adicionar Header específico para landing page aqui */}
      <main
        id="main-content"
        className="flex-1"
        aria-label="Conteúdo principal da página"
      >
        {children}
      </main>

      {/* TODO: Adicionar Footer para landing page aqui */}
    </div>
  );
}
