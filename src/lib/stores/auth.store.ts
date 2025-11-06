"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AuthUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  tenantId?: string;
  role?: string;
};

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      setSession: (user) =>
        set((state) => ({
          ...state,
          user,
          isAuthenticated: !!user,
          isLoading: false,
        })),
      setLoading: (isLoading) => set((state) => ({ ...state, isLoading })),
      clearSession: () =>
        set((state) => ({ ...state, user: null, isAuthenticated: false })),
    }),
    {
      name: "auth-session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state: AuthState) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
