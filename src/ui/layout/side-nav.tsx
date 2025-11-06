"use client";

import { Calendar, Home, Medal, Settings, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Eventos",
    href: "/events",
    icon: Trophy,
  },
  {
    title: "Partidas",
    href: "/matches",
    icon: Calendar,
  },
  {
    title: "Ranking",
    href: "/ranking",
    icon: Medal,
  },
  {
    title: "Usuários",
    href: "/users",
    icon: Users,
  },
];

const bottomNavItems: NavItem[] = [
  {
    title: "Configurações",
    href: "/settings",
    icon: Settings,
  },
];

interface SideNavProps {
  className?: string;
  mobile?: boolean;
}

function NavItemButton({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || pathname?.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start gap-3",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
      )}
      asChild
    >
      <Link
        href={item.href}
        title={`Ir para ${item.title}`}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon className="size-4 shrink-0" />
        <span>{item.title}</span>
        {item.badge && (
          <span className="bg-primary text-primary-foreground ml-auto rounded-full px-2 py-0.5 text-xs">
            {item.badge}
          </span>
        )}
      </Link>
    </Button>
  );
}

export function SideNav({ className, mobile = false }: SideNavProps) {
  if (mobile) {
    return (
      <nav
        className="flex flex-col gap-1 p-4"
        aria-label="Menu de navegação mobile"
      >
        {navItems.map((item) => (
          <NavItemButton key={item.href} item={item} />
        ))}
        <Separator className="my-2" />
        {bottomNavItems.map((item) => (
          <NavItemButton key={item.href} item={item} />
        ))}
      </nav>
    );
  }

  return (
    <aside
      className={cn(
        "bg-sidebar hidden border-r md:flex md:w-64 md:flex-col",
        className
      )}
      aria-label="Navegação lateral"
    >
      <nav className="flex flex-col gap-1 p-4" aria-label="Menu principal">
        {navItems.map((item) => (
          <NavItemButton key={item.href} item={item} />
        ))}
      </nav>

      <Separator className="my-2" />

      <nav className="flex flex-col gap-1 p-4" aria-label="Menu secundário">
        {bottomNavItems.map((item) => (
          <NavItemButton key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  );
}
