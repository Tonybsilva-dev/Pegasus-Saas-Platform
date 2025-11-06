"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

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
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { generateBreadcrumbs } from "@/lib/utils/breadcrumbs";

interface AppLayoutProps {
  children: React.ReactNode;
}

// TODO: Obter user do contexto/sessão quando Auth estiver implementado
const user: {
  name?: string | null;
  image?: string | null;
  email: string;
} | null = null;

function AppHeader() {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname || "");
  const { isMobile, openMobile } = useSidebar();

  // Get user initials for avatar fallback
  const getUserInitials = (name?: string | null, email?: string) => {
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
    <header className="bg-background sticky top-0 z-9999 flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger
        className={cn("-ml-1", isMobile && openMobile && "relative z-10000")}
      />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
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
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href || "#"}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm leading-none font-medium">
                {user.name || "Usuário"}
              </p>
              <p className="text-muted-foreground text-xs">{user.email}</p>
            </div>
            <Avatar className="size-8">
              <AvatarImage
                src={user.image || undefined}
                alt={user.name || "Avatar do usuário"}
                title={user.name || "Avatar do usuário"}
              />
              <AvatarFallback>
                {getUserInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            title="Fazer login"
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main
          id="main-content"
          className="bg-background flex flex-1 flex-col gap-4 p-4"
          aria-label="Conteúdo principal da página"
        >
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
