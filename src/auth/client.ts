import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_NEXTAUTH_URL,
  basePath: "/api/auth",
});

// Exportar métodos específicos para facilitar uso
export const { signIn, signOut, useSession } = authClient;

// Exportar tipo de sessão inferido
export type Session = typeof authClient.$Infer.Session;
