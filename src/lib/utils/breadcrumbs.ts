export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Gera breadcrumbs baseados na rota atual
 */
export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Sempre incluir Home como primeiro item
  if (segments.length === 0) {
    return [{ label: "Dashboard", href: "/dashboard" }];
  }

  // Mapear segmentos para labels legíveis
  const segmentLabels: Record<string, string> = {
    dashboard: "Dashboard",
    events: "Eventos",
    matches: "Partidas",
    ranking: "Ranking",
    users: "Usuários",
    settings: "Configurações",
  };

  // Construir breadcrumbs incrementalmente
  let currentPath = "";
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label =
      segmentLabels[segment] ||
      segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;

    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  });

  return breadcrumbs;
}
