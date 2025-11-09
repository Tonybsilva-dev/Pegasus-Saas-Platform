import { betterAuth } from "better-auth";

import { createCustomPrismaAdapter } from "./auth/custom-adapter";
import { env } from "./core";
import { prisma } from "./core/prisma";

export const auth = betterAuth({
  database: createCustomPrismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID as string,
      clientSecret: env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
