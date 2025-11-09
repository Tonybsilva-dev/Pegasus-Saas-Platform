import type { PrismaClient } from "@prisma/client";
import { prismaAdapter } from "better-auth/adapters/prisma";

/**
 * Adapter customizado do Better Auth que:
 * 1. Preenche automaticamente o campo tenantId ao criar Session e Account, buscando do User
 * 2. Atribui tenantId padrão (tenant "default") ao criar novos usuários
 *
 * Usa Prisma $extends (v5+) para interceptar as operações de criação
 */
export function createCustomPrismaAdapter(
  prisma: PrismaClient,
  options: { provider: string }
) {
  // Função auxiliar para obter ou criar o tenant "default"
  async function getDefaultTenantId(): Promise<string> {
    // Buscar tenant "default" existente
    let defaultTenant = await prisma.tenant.findUnique({
      where: { slug: "default" },
      select: { id: true },
    });

    // Se não existe, criar o tenant "default"
    if (!defaultTenant) {
      defaultTenant = await prisma.tenant.create({
        data: {
          name: "Default Tenant",
          slug: "default",
          isActive: true,
          plan: "FREE",
        },
        select: { id: true },
      });
    }

    return defaultTenant.id;
  }

  // Estender o Prisma Client para interceptar operações
  const extendedPrisma = prisma.$extends({
    name: "tenantId-auto-fill",
    query: {
      user: {
        async create({ args, query }) {
          // Se tenantId não foi fornecido, atribuir o tenant "default"
          if (!args.data.tenantId) {
            const defaultTenantId = await getDefaultTenantId();
            args.data.tenantId = defaultTenantId;
          }

          // Garantir que role seja ATHLETE por padrão se não especificado
          if (!args.data.role) {
            args.data.role = "ATHLETE";
          }

          // Garantir que isActive seja true por padrão
          if (args.data.isActive === undefined) {
            args.data.isActive = true;
          }

          return query(args);
        },
      },
      session: {
        async create({ args, query }) {
          // Preencher tenantId se não estiver presente
          if (args.data?.userId && !args.data.tenantId) {
            const user = await prisma.user.findUnique({
              where: { id: args.data.userId },
              select: { tenantId: true },
            });
            if (user) {
              args.data.tenantId = user.tenantId;
            }
          }
          return query(args);
        },
      },
      account: {
        async create({ args, query }) {
          // Preencher tenantId se não estiver presente
          if (args.data?.userId && !args.data.tenantId) {
            const user = await prisma.user.findUnique({
              where: { id: args.data.userId },
              select: { tenantId: true },
            });
            if (user) {
              args.data.tenantId = user.tenantId;
            }
          }
          return query(args);
        },
        async update({ args, query }) {
          // Preencher tenantId se userId está sendo atualizado
          if (args.data?.userId && !args.data.tenantId) {
            const user = await prisma.user.findUnique({
              where: { id: args.data.userId },
              select: { tenantId: true },
            });
            if (user) {
              args.data.tenantId = user.tenantId;
            }
          }
          return query(args);
        },
      },
    },
  }) as PrismaClient;

  return prismaAdapter(extendedPrisma, options);
}
