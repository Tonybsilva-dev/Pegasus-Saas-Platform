"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface TenantInfo {
  name: string;
  logoUrl?: string | null;
  primaryColor?: string;
}

interface VersionSwitcherProps {
  tenant: TenantInfo;
}

export function VersionSwitcher({ tenant }: VersionSwitcherProps) {
  const [selectedTenant, setSelectedTenant] = React.useState(tenant.name);
  const { isMobile, openMobile } = useSidebar();

  // No mobile, quando a sidebar está aberta, desabilitar o dropdown
  // para evitar conflito com o SidebarTrigger no header
  const isDisabled = isMobile && openMobile;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={isDisabled}>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              disabled={isDisabled}
            >
              <div
                className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: tenant.primaryColor || "#1E40AF",
                }}
              >
                {tenant.logoUrl ? (
                  <Image
                    src={tenant.logoUrl}
                    alt={`Logo ${tenant.name}`}
                    title={`Logo ${tenant.name}`}
                    width={24}
                    height={24}
                    className="size-6 object-contain"
                  />
                ) : (
                  <span className="text-xs font-bold text-white">
                    {tenant.name[0]?.toUpperCase() || "P"}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">{tenant.name}</span>
                <span className="text-xs">Tenant</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)]"
            align="start"
          >
            <DropdownMenuItem
              onSelect={() => setSelectedTenant(tenant.name)}
              disabled
            >
              {tenant.name}
              {selectedTenant === tenant.name && <Check className="ml-auto" />}
            </DropdownMenuItem>
            {/* TODO: Adicionar outros tenants quando multi-tenant estiver implementado */}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
