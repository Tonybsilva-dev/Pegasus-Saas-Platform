"use client";

import { Calendar, Home, Medal, Settings, Trophy, Users } from "lucide-react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { useSession } from "@/auth/client";
import { SearchForm } from "@/components/search-form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { VersionSwitcher } from "@/components/version-switcher";
import { useTenantData } from "@/hooks/use-tenant";

// Estrutura de navegação com grupos colapsáveis
const navMain = [
  {
    title: "Principal",
    url: "#",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
      },
    ],
  },
  {
    title: "Torneios",
    url: "#",
    items: [
      {
        title: "Eventos",
        url: "/events",
        icon: Trophy,
      },
      {
        title: "Partidas",
        url: "/matches",
        icon: Calendar,
      },
      {
        title: "Ranking",
        url: "/ranking",
        icon: Medal,
      },
    ],
  },
  {
    title: "Administração",
    url: "#",
    items: [
      {
        title: "Usuários",
        url: "/users",
        icon: Users,
      },
      {
        title: "Configurações",
        url: "/settings",
        icon: Settings,
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { data: session, isPending: sessionIsPending } = useSession();
  const { tenant: tenantData } = useTenantData();

  // Debug em desenvolvimento
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[AppSidebar] Estado da sessão:", {
        isPending: sessionIsPending,
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        userId: session?.user?.id,
        fullSession: session,
      });
    }
  }, [session, sessionIsPending]);

  // Obter dados do usuário da sessão
  const user = session?.user
    ? {
        name: session.user.name ?? null,
        image: session.user.image ?? null,
        email: session.user.email ?? "",
        role: (session.user as { role?: string })?.role ?? "ATHLETE",
      }
    : null;

  // Obter dados do tenant (com fallback para valores padrão)
  const tenant = tenantData
    ? {
        name: tenantData.name,
        logoUrl: tenantData.logoUrl,
        primaryColor: tenantData.primaryColor,
      }
    : {
        name: "Pegasus",
        logoUrl: null,
        primaryColor: "#1E40AF",
      };

  // Mostrar VersionSwitcher se:
  // - Sessão está carregada (não pending) E usuário existe
  // - Não precisa esperar o tenant carregar (mostra com fallback se necessário)
  const shouldShowVersionSwitcher = !sessionIsPending && !!user;

  return (
    <Sidebar {...props} collapsible="icon">
      <SidebarHeader>
        {shouldShowVersionSwitcher && (
          <VersionSwitcher tenant={tenant} user={user} />
        )}
        <SearchForm />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {navMain.map((item) => (
          <Collapsible
            key={item.title}
            defaultOpen
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel
                asChild
                className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
              >
                <CollapsibleTrigger>
                  {item.title}{" "}
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {item.items.map((navItem) => {
                      const isActive =
                        pathname === navItem.url ||
                        pathname?.startsWith(`${navItem.url}/`);
                      return (
                        <SidebarMenuItem key={navItem.title}>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <Link
                              href={navItem.url}
                              title={`Ir para ${navItem.title}`}
                            >
                              {navItem.icon && <navItem.icon />}
                              <span>{navItem.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
