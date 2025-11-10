import type { PrismaClient } from "@prisma/client";
import { prismaAdapter } from "better-auth/adapters/prisma";

/**
 * Adapter customizado do Better Auth que:
 * 1. Preenche automaticamente o campo tenantId ao criar Session e Account, buscando do User
 * 2. NÃO atribui tenantId automaticamente - usuários novos ficam sem tenant até completar onboarding
 *
 * Usa Prisma $extends (v5+) para interceptar as operações de criação
 */
export function createCustomPrismaAdapter(
  prisma: PrismaClient,
  options: { provider: string }
) {
  // Estender o Prisma Client para interceptar operações
  const extendedPrisma = prisma.$extends({
    name: "tenantId-auto-fill",
    query: {
      user: {
        async create({ args, query }) {
          // NÃO atribuir tenantId automaticamente
          // Usuários novos devem ficar sem tenant até completar onboarding
          // tenantId pode ser null - será preenchido durante o onboarding

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
          // Preencher tenantId do usuário se não estiver presente
          // Pode ser null se o usuário ainda não tem tenant
          if (args.data?.userId && args.data.tenantId === undefined) {
            const user = await prisma.user.findUnique({
              where: { id: args.data.userId },
              select: { tenantId: true },
            });
            if (user) {
              // Pode ser null - isso é permitido agora
              args.data.tenantId = user.tenantId ?? null;
            }
          }
          return query(args);
        },
      },
      account: {
        async create({ args, query }) {
          // Preencher tenantId do usuário se não estiver presente
          // Pode ser null se o usuário ainda não tem tenant
          if (args.data?.userId && args.data.tenantId === undefined) {
            const user = await prisma.user.findUnique({
              where: { id: args.data.userId },
              select: { tenantId: true },
            });
            if (user) {
              // Pode ser null - isso é permitido agora
              args.data.tenantId = user.tenantId ?? null;
            }
          }
          return query(args);
        },
        async update({ args, query }) {
          // Preencher tenantId se userId está sendo atualizado
          // Pode ser null se o usuário ainda não tem tenant
          if (args.data?.userId && args.data.tenantId === undefined) {
            const user = await prisma.user.findUnique({
              where: { id: args.data.userId },
              select: { tenantId: true },
            });
            if (user) {
              // Pode ser null - isso é permitido agora
              args.data.tenantId = user.tenantId ?? null;
            }
          }
          return query(args);
        },
      },
    },
  }) as PrismaClient;

  return prismaAdapter(extendedPrisma, options);
}
