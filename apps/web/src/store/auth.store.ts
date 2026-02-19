import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { AUTH_ENDPOINTS, USER_ENDPOINTS } from '@/lib/api-endpints';

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  organizationId: number | null;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  emailVerifiedAt: Date | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  refreshIntervalId: ReturnType<typeof setInterval> | null;

  setUser: (user: AuthUser) => void;
  clearUser: () => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  startTokenRefresh: () => void;
  stopTokenRefresh: () => void;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      refreshIntervalId: null,

      setUser: (user) => set({ user, isAuthenticated: true }),

      clearUser: () => set({ user: null, isAuthenticated: false }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      fetchMe: async () => {
        try {
          const { data } = await axios.get(USER_ENDPOINTS.GET_ME, {
            withCredentials: true,
          });
          const user = data?.data ?? data;
          set({ user, isAuthenticated: true });
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      },

      startTokenRefresh: () => {
        const existing = get().refreshIntervalId;
        if (existing) clearInterval(existing);

        const id = setInterval(
          async () => {
            try {
              await axios.post(
                AUTH_ENDPOINTS.REFRESH_TOKEN,
                {},
                { withCredentials: true },
              );
            } catch {
              get().logout();
            }
          },
          20 * 60 * 1000,
        );

        set({ refreshIntervalId: id });
      },

      stopTokenRefresh: () => {
        const id = get().refreshIntervalId;
        if (id) clearInterval(id);
        set({ refreshIntervalId: null });
      },

      logout: async () => {
        try {
          await axios.post(
            AUTH_ENDPOINTS.LOGOUT,
            {},
            { withCredentials: true },
          );
        } catch (err) {
          if (err instanceof Error) {
            console.error(err.message);
          } else {
            console.error('Unknown error during logout');
          }
        } finally {
          get().stopTokenRefresh();
          set({ user: null, isAuthenticated: false, refreshIntervalId: null });
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
