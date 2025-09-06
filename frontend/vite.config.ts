import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => ({
  plugins: [tailwindcss()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  server: {
    headers: {},
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
}));
