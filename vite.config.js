import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// https://vite.dev/config/
// Un solo build genera las tres apps que se publican en Netlify:
// - /                    plataforma de cursos
// - /reproductor/        reproductor para alumnos (sin respaldos)
// - /reproductor-admin/  reproductor del administrador (con el panel oculto de respaldos)
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        reproductor: resolve(import.meta.dirname, 'reproductor/index.html'),
        'reproductor-admin': resolve(import.meta.dirname, 'reproductor-admin/index.html'),
      },
    },
  },
})
