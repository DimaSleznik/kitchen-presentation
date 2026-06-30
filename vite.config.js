import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: Number(process.env.PORT) || 5180, open: false },
  preview: { port: 5180 },
});
