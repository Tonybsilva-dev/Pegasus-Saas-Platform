import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { env } from "@/core/env";
import { prisma } from "@/core/prisma";

// Configuração base (complementaremos providers e callbacks nas próximas subtarefas)
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: { access_type: "offline", prompt: "consent" },
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Em sign-in, o objeto user vem preenchido; depois, apenas token
      if (user) {
        // @ts-expect-error Campos do schema Prisma
        token.id = user.id;
        // @ts-expect-error Campo multi-tenant
        token.tenantId = user.tenantId;
        // @ts-expect-error Enum Role
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error augmentado em types
        session.user.id = token.id as string | undefined;
        // @ts-expect-error augmentado em types
        session.user.tenantId = token.tenantId as string | undefined;
        // @ts-expect-error augmentado em types
        session.user.role = (token.role as string | undefined) ?? "ATHLETE";
      }
      return session;
    },
  },
});
