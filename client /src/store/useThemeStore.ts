import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api'; // ՆԵՐՄՈՒԾՈՒՄ ԵՆՔ API-ն (համոզվիր որ ճիշտ ճանապարհով է)

interface ThemeState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void; // ՆՈՐ: Պետք է Login-ի ժամանակ
  toggleTheme: () => Promise<void>; // ՆՈՐ: Դարձնում ենք async
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      
      // 1. ԱՌԱՆՁԻՆ ՖՈՒՆԿՑԻԱ՝ ՄԻԱՅՆ ԳՈՒՅՆԸ ԴՆԵԼՈՒ ՀԱՄԱՐ
      setTheme: (theme) => {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ theme });
      },

      // 2. ԿՈՃԱԿԻ ՖՈՒՆԿՑԻԱՆ (Տեղում փոխում է + Ուղարկում է Բեքենդ)
      toggleTheme: async () => {
        // Ստանում ենք ընթացիկ թեման
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Optimistic Update: Անմիջապես փոխում ենք էկրանի գույնը (UI-ը չի սպասում սերվերին)
        get().setTheme(newTheme);

        // Ֆոնային ռեժիմով ուղարկում ենք Բեքենդ
        try {
          const token = localStorage.getItem('token');
          // Եթե յուզերը հյուր չէ և ունի token, ուրեմն փոխում ենք նրա բազան
          if (token) {
            await api.put('/api/auth/theme', { theme: newTheme });
          }
        } catch (error) {
          console.error('Failed to sync theme with backend:', error);
        }
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }
  )
);