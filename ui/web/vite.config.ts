import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    // Escuchar en todas las IPs para que Docker pueda mapear el puerto
    host: '0.0.0.0',
    port: 5173,
    // Configuración necesaria para que el auto-refresh (HMR) funcione tras el proxy de Docker
    watch: {
      usePolling: true,
    },
    hmr: {
      clientPort: 5173,
    },
  },
})
