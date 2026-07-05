import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as authApi from "@/lib/api/auth";
import {
  clearAccessToken,
  setAccessToken,
} from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import type { LoginCredentials } from "@/lib/api/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (credentials) => {
        set({ isLoading: true });

        try {
          const data = await authApi.login(credentials);
          setAccessToken(data.accessToken);

          set({
            user: data.user,
            accessToken: data.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          await authApi.logout();
        } catch {
          // Clear local session even if the API call fails.
        } finally {
          clearAccessToken();
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      refreshAuth: async () => {
        set({ isLoading: true });

        try {
          const tokenData = await authApi.refreshToken();
          setAccessToken(tokenData.accessToken);

          const meData = await authApi.getMe();

          set({
            accessToken: tokenData.accessToken,
            user: meData.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          clearAccessToken();
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
          throw error;
        }
      },

      setUser: (user) => {
        set({
          user,
          isAuthenticated: user !== null,
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ accessToken: state.accessToken }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          setAccessToken(state.accessToken);
        }
      },
    },
  ),
);
