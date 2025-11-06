"use client";

import Image from "next/image";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface HeaderProps {
  tenant?: {
    name: string;
    logoUrl?: string | null;
    primaryColor?: string;
  } | null;
  user?: {
    name?: string | null;
    image?: string | null;
    email: string;
  } | null;
}

export function Header({ tenant, user }: HeaderProps) {
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
    <header className="bg-background/95 sticky top-0 z-[9999] border-b shadow-sm backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Sidebar Trigger */}
        <SidebarTrigger />

        {/* Logo and Tenant Name */}
        <div className="flex items-center gap-3">
          {tenant?.logoUrl ? (
            <Image
              src={tenant.logoUrl}
              alt={`Logo ${tenant.name}`}
              title={`Logo ${tenant.name}`}
              width={32}
              height={32}
              className="size-8 object-contain"
            />
          ) : (
            <div
              className="flex size-8 items-center justify-center rounded-md text-xs font-bold text-white"
              style={{
                backgroundColor: tenant?.primaryColor || "#1E40AF",
              }}
            >
              {tenant?.name?.[0]?.toUpperCase() || "P"}
            </div>
          )}
          <Link
            href="/"
            className="text-foreground flex items-center gap-2 font-semibold hover:opacity-80"
            title="Ir para página inicial"
          >
            <span className="hidden sm:inline-block">
              {tenant?.name || "Pegasus"}
            </span>
          </Link>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4">
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
            <Button variant="outline" size="sm" asChild>
              <Link href="/login" title="Fazer login">
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
