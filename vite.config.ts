import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This allows the React code to access the process.env.API_KEY set during build
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})