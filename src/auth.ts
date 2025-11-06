import { PrismaAdapter } from "@auth/prisma-adapter";
import type { User } from "next-auth";
import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
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
    async jwt({ token, user }): Promise<JWT> {
      type AugmentedUser = Pick<User, "name" | "email" | "image"> & {
        id?: string;
        tenantId?: string;
        role?: string;
      };
      type AugmentedToken = JWT & {
        id?: string;
        tenantId?: string;
        role?: string;
      };

      const t = token as AugmentedToken;
      if (user) {
        const u = user as AugmentedUser;
        t.id = u.id; // id pode não existir em alguns providers
        t.tenantId = u.tenantId;
        t.role = u.role;
      }
      return t;
    },
    async session({ session, token }) {
      type AugmentedToken = JWT & {
        id?: string;
        tenantId?: string;
        role?: string;
      };
      const t = token as AugmentedToken;
      if (session.user) {
        (session.user as { id?: string; tenantId?: string; role?: string }).id =
          t.id;
        (
          session.user as { id?: string; tenantId?: string; role?: string }
        ).tenantId = t.tenantId;
        (
          session.user as { id?: string; tenantId?: string; role?: string }
        ).role = t.role ?? "ATHLETE";
      }
      return session;
    },
  },
});
