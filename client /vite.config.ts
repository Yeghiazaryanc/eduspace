import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    globals: true, // Թույլ է տալիս գրել describe/it/expect առանց import անելու (ինչպես Jest-ում)
    environment: 'jsdom', // Սիմուլյացիա է անում բրաուզերը Node.js-ի մեջ
    setupFiles: './src/setupTests.ts',
  },
})