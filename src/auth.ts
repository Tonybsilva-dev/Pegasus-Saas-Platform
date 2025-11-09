import { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";

import { createCustomPrismaAdapter } from "./auth/custom-adapter";
import { env } from "./core";

const prisma = new PrismaClient();
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
