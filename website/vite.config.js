import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/esp32-iot-hub/',
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173
  }
})
