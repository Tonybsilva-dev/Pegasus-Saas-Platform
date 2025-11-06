'use client';

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function DependenciesPage() {
  return (
    <div className="container mx-auto py-10 max-w-6xl">
      <Card className="shadow-md border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Pegasus – Dependency Graph</CardTitle>
          <CardDescription>
            Visualização hierárquica das dependências entre módulos e camadas do projeto Pegasus.
          </CardDescription>
        </CardHeader>
        <Separator className="mb-6" />
        <CardContent className="flex flex-col gap-6">
          <section className="w-full">
            <iframe
              src="/docs/pegasus-dependencies-interactive.html"
              className="w-full h-[600px] rounded-lg border border-border/40 shadow-sm"
              title="Pegasus Dependency Graph"
            />
          </section>
          <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-sm">
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-[#f6d365] rounded-sm" /> Foundation</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-[#fda085] rounded-sm" /> Auth</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-[#fbc2eb] rounded-sm" /> Events & Matches</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-[#a1c4fd] rounded-sm" /> Gamification</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-[#c2e9fb] rounded-sm" /> Sharing & Billing</div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
