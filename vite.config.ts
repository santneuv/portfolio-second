import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // The lazily loaded 3D chunk (three.js + R3F) is expected to be large.
    chunkSizeWarningLimit: 1200,
  },
})
