"use client";

import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { signOut, useSession } from "@/auth/client";
import { AppSidebar } from "@/components/app-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { QueryProvider } from "@/core/providers/query.provider";
import { generateBreadcrumbs } from "@/lib/utils/breadcrumbs";

interface AppLayoutProps {
  children: React.ReactNode;
}

function AppHeader() {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname || "");
  const { data: session } = useSession();

  // Get user initials for avatar fallback
  const getUserInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name[0]?.toUpperCase() || "U";
    }
    return email?.[0]?.toUpperCase() || "U";
  };

  return (
    <header
      className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
      aria-label="Cabeçalho principal do dashboard"
    >
      <div className="flex flex-1 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" aria-label="Alternar menu lateral" />

        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />

        <Breadcrumb aria-label="Navegação estrutural">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.href || crumb.label}>
                  {index > 0 && (
                    <BreadcrumbSeparator className="hidden md:block" />
                  )}
                  <BreadcrumbItem
                    className={index === 0 ? "hidden md:block" : ""}
                  >
                    {isLast ? (
                      <BreadcrumbPage aria-current="page">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link
                          href={crumb.href || "#"}
                          title={`Ir para ${crumb.label}`}
                        >
                          {crumb.label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* User Menu */}
      <div className="flex items-center gap-4 px-4">
        {session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="hover:bg-accent focus:ring-primary flex items-center gap-3 rounded-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
                title="Menu do usuário"
                aria-label="Abrir menu do usuário"
              >
                <div className="hidden text-right sm:block">
                  <p className="text-sm leading-none font-medium">
                    {session.user.name || "Usuário"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {session.user.email}
                  </p>
                </div>
                <Avatar
                  className="size-8"
                  role="img"
                  aria-label="Avatar do usuário"
                >
                  <AvatarImage
                    src={session.user.image || undefined}
                    alt={session.user.name || "Avatar do usuário"}
                    title={session.user.name || "Avatar do usuário"}
                  />
                  <AvatarFallback>
                    {getUserInitials(session.user.name, session.user.email)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm leading-none font-medium">
                    {session.user.name || "Usuário"}
                  </p>
                  <p className="text-muted-foreground text-xs leading-none">
                    {session.user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  className="flex items-center"
                  title="Ir para configurações"
                >
                  <User className="mr-2 size-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                  window.location.href = "/login";
                }}
                className="text-destructive focus:text-destructive cursor-pointer"
                title="Fazer logout"
              >
                <LogOut className="mr-2 size-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground focus:ring-primary rounded-sm text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
            title="Fazer login"
            aria-label="Fazer login na aplicação"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <QueryProvider>
      <SidebarProvider>
        {/* Skip Link para navegação por teclado */}
        <a
          href="#main-content"
          className="bg-primary text-primary-foreground sr-only z-10001 rounded-md px-4 py-2 font-medium transition-all focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
          title="Pular para o conteúdo principal"
          aria-label="Pular para o conteúdo principal"
        >
          Pular para o conteúdo principal
        </a>
        <AppSidebar />
        <SidebarInset
          id="main-content"
          className="bg-background flex flex-1 flex-col"
          aria-label="Conteúdo principal da página"
          suppressHydrationWarning
        >
          <AppHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </QueryProvider>
  );
}
