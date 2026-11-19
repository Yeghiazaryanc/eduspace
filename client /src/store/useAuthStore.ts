import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Հավելվածի օգտատիրոջ հիմնական տիպը (Domain Model)
 */
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'student';
  avatar_url?: string;
  theme?: 'light' | 'dark';
  created_at?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  // Runtime դրոշակ՝ ցույց տալու համար, որ localStorage-ից տվյալների վերականգնումը (Hydration) ավարտվել է
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  login: (userData: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

/**
 * Գլոբալ Authentication Store (Zustand + Persist Middleware)
 * Ապահովում է օգտատիրոջ սեսիայի պահպանումը էջի թարմացումների (Reload) միջև՝
 * միաժամանակ պաշտպանելով ProtectedRoute-ը վաղաժամ redirect-ներից (_hasHydrated)։
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      login: (userData) =>
        set({
          user: userData,
          isAuthenticated: true,
        }),

      // Single Source of Truth. logout-ը միշտ մաքրում է և՛ JWT տոկենը, և՛ գլոբալ state-ը՝
      // կանխելով Orphaned Token բագը (անկախ նրանից՝ որտեղից է այն կանչվել)
      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      // Թարմացնում է օգտատիրոջ պրոֆիլի տվյալները (օր.՝ ավատար կամ անուն փոխելիս)
      setUser: (updatedUser) =>
        set({
          user: updatedUser,
        }),
    }),
    {
      name: 'auth-storage',

      // Partialize. localStorage-ում պահում ենք ՄԻԱՅՆ մշտական տվյալները՝
      // բացառելով ժամանակավոր _hasHydrated runtime դրոշակի սերիալիզացիան
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),

      // Rehydration Hook. աշխատում է անմիջապես localStorage-ից տվյալները կարդալուց հետո
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // Consistency Check. եթե պահված է isAuthenticated: true, բայց JWT տոկենը բացակայում է,
        // մաքրում ենք անհամապատասխան (Ghost) սեսիան
        if (state.isAuthenticated && !localStorage.getItem('token')) {
          state.logout();
        }

        state.setHasHydrated(true);
      },
    }
  )
);