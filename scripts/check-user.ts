import { prisma } from "../src/core/prisma";

async function checkUser() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: "tonybsilvadev@gmail.com" },
      select: {
        id: true,
        email: true,
        tenantId: true,
        role: true,
      },
    });

    if (!user) {
      console.log("❌ Usuário não encontrado");
      return;
    }

    const defaultTenant = await prisma.tenant.findUnique({
      where: { slug: "default" },
      select: { id: true },
    });

    const needsOnboarding =
      !!defaultTenant &&
      user.tenantId === defaultTenant.id &&
      user.role === "ATHLETE";

    console.log("📊 Dados do usuário:", {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      defaultTenantId: defaultTenant?.id,
      needsOnboarding,
    });
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
