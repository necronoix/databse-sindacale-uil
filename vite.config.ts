import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/index.ts',
      name: 'SindacatoApp',
      formats: ['es']
    },
    rollupOptions: {
      external: ['hono', 'hono/jwt']
    }
  }
})