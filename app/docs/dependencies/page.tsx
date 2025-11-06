"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function DependenciesPage() {
  return (
    <div className="container mx-auto max-w-6xl py-10">
      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Pegasus – Dependency Graph
          </CardTitle>
          <CardDescription>
            Visualização hierárquica das dependências entre módulos e camadas do
            projeto Pegasus.
          </CardDescription>
        </CardHeader>
        <Separator className="mb-6" />
        <CardContent className="flex flex-col gap-6">
          <section className="w-full">
            <iframe
              src="/docs/pegasus-dependencies-interactive.html"
              className="border-border/40 h-[600px] w-full rounded-lg border shadow-sm"
              title="Pegasus Dependency Graph"
            />
          </section>
          <section className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 md:grid-cols-5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-[#f6d365]" /> Foundation
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-[#fda085]" /> Auth
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-[#fbc2eb]" /> Events &
              Matches
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-[#a1c4fd]" /> Gamification
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-[#c2e9fb]" /> Sharing &
              Billing
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
