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

export default function DashboardPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="md:col-span-2">
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
          <div className="flex flex-col gap-2">
            <Button variant="default" className="w-full">
              Default
            </Button>
            <Button variant="destructive" className="w-full">
              Destructive
            </Button>
            <Button variant="outline" className="w-full">
              Outline
            </Button>
            <Button variant="secondary" className="w-full">
              Secondary
            </Button>
            <Button variant="ghost" className="w-full">
              Ghost
            </Button>
            <Button variant="link" className="w-full">
              Link
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tamanhos de Button</CardTitle>
          <CardDescription>Testando diferentes tamanhos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Button size="sm" className="w-full">
              Small
            </Button>
            <Button size="default" className="w-full">
              Default
            </Button>
            <Button size="lg" className="w-full">
              Large
            </Button>
            <Button size="icon" className="w-full">
              🚀 Icon
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
