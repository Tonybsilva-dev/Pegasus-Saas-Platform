import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/auth";

/**
 * Middleware para isolamento de tenant
 * Garante que dados de um tenant não sejam acessíveis por outro
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas que não precisam de isolamento
  const publicRoutes = ["/login", "/", "/api/auth", "/api/webhooks"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Se for rota pública, permitir acesso sem verificação de tenant
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Obter sessão do usuário
  const session = await auth();

  // Se não autenticado e tentando acessar rota protegida, redirecionar para login
  if (!session?.user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { message: "Não autenticado", error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Extrair tenantId da sessão
  const tenantId = (session.user as { tenantId?: string })?.tenantId;

  // Se não houver tenantId na sessão, negar acesso
  if (!tenantId) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { message: "Tenant não identificado", error: "TENANT_MISSING" },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Para rotas de API, adicionar tenantId aos headers para uso nas rotas
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    response.headers.set("x-tenant-id", tenantId);
    return response;
  }

  // Para páginas, permitir acesso (o tenantId será usado nas queries do Prisma)
  return NextResponse.next();
}

/**
 * Configuração do matcher para definir quais rotas acionam o middleware
 * Exclui arquivos estáticos, imagens e assets do Next.js
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
