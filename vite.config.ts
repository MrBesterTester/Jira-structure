import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // Exclude the data directory from file watching to prevent
      // page reloads when the API writes to JSON files
      ignored: ['**/data/**'],
    },
  },
})
