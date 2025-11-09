import { createAuthClient } from "better-auth/react";

import { env } from "@/core";
export const authClient = createAuthClient({
  baseURL: env.NEXTAUTH_URL,
});

export const { signIn, signUp, useSession } = createAuthClient();
