import { prisma } from "../src/core/prisma";

async function ensureDefaultTenant() {
  try {
    // Verificar se o tenant "default" existe
    let defaultTenant = await prisma.tenant.findUnique({
      where: { slug: "default" },
    });

    if (!defaultTenant) {
      // Criar o tenant "default"
      defaultTenant = await prisma.tenant.create({
        data: {
          name: "Default Tenant",
          slug: "default",
          isActive: true,
          plan: "FREE",
        },
      });
      console.log("✅ Tenant 'default' criado com sucesso:", defaultTenant.id);
    } else {
      console.log("✅ Tenant 'default' já existe:", defaultTenant.id);
    }
  } catch (error) {
    console.error("❌ Erro ao garantir tenant 'default':", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

ensureDefaultTenant();
