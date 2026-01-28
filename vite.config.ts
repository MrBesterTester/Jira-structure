import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Generate build date in PST timezone (YYYY-MM-DD_HH:MM)
const buildDate = new Date().toLocaleString('en-CA', {
  timeZone: 'America/Los_Angeles',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}).replace(', ', '_').replace(':', ':');

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
  server: {
    watch: {
      // Exclude the data directory from file watching to prevent
      // page reloads when the API writes to JSON files
      ignored: ['**/data/**'],
    },
  },
})
