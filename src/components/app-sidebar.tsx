"use client";

import { Calendar, Home, Medal, Settings, Trophy, Users } from "lucide-react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

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

// TODO: Obter tenant do contexto/sessão quando Auth estiver implementado
const tenant = {
  name: "Pegasus",
  logoUrl: null,
  primaryColor: "#1E40AF",
};

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

  return (
    <Sidebar {...props} collapsible="icon">
      <SidebarHeader>
        <VersionSwitcher tenant={tenant} />
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
