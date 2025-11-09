import type { PrismaClient } from "@prisma/client";
import { prismaAdapter } from "better-auth/adapters/prisma";

/**
 * Adapter customizado do Better Auth que preenche automaticamente
 * o campo tenantId ao criar Session e Account, buscando do User
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
