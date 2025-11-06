import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-8">
      <main className="w-full max-w-2xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Teste de Componentes Shadcn UI
          </h1>
          <p className="text-muted-foreground">
            Validação dos componentes Button, Card e Input com Tailwind CSS v4
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Componente Card</CardTitle>
            <CardDescription>
              Este é um exemplo do componente Card do Shadcn UI funcionando
              corretamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="test-input"
                className="text-sm leading-none font-medium"
              >
                Componente Input
              </label>
              <Input
                id="test-input"
                placeholder="Digite algo aqui..."
                type="text"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row">
            <Button variant="default" className="w-full sm:w-auto">
              Botão Default
            </Button>
            <Button variant="secondary" className="w-full sm:w-auto">
              Botão Secondary
            </Button>
            <Button variant="outline" className="w-full sm:w-auto">
              Botão Outline
            </Button>
            <Button variant="ghost" className="w-full sm:w-auto">
              Botão Ghost
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Variantes de Button</CardTitle>
            <CardDescription>
              Testando todas as variantes de botão disponíveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="default">Default</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tamanhos de Button</CardTitle>
            <CardDescription>Testando diferentes tamanhos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">🚀</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
