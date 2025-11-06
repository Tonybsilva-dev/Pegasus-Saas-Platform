"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

import type { AuthUser } from "@/lib/stores/auth.store";
import { useAuthStore } from "@/lib/stores/auth.store";

export function useAuthSync() {
  const { data: session, status } = useSession();
  const setSession = useAuthStore(
    (s: { setSession: (user: AuthUser | null) => void }) => s.setSession
  );
  const setLoading = useAuthStore(
    (s: { setLoading: (loading: boolean) => void }) => s.setLoading
  );
  const clearSession = useAuthStore(
    (s: { clearSession: () => void }) => s.clearSession
  );

  useEffect(() => {
    const loading = status === "loading";
    setLoading(loading);

    if (status === "authenticated" && session?.user) {
      const su = session.user as unknown as {
        id?: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        tenantId?: string;
        role?: string;
      };
      setSession({
        id: su.id,
        name: su.name ?? null,
        email: su.email ?? null,
        image: su.image ?? null,
        tenantId: su.tenantId,
        role: su.role,
      });
    }

    if (status === "unauthenticated") {
      clearSession();
    }
  }, [status, session, setSession, setLoading, clearSession]);
}
