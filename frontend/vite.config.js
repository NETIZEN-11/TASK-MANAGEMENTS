import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load .env values so we can target the right backend in dev.
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_BACKEND_URL || 'http://localhost:5001';

  return {
    plugins: [react()],
    build: {
      target: ['chrome80', 'firefox78', 'safari13', 'edge79'],
      cssTarget: ['chrome80', 'firefox78', 'safari13', 'edge79'],
      sourcemap: false,
    },
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: true,
      port: 5173,
    },
  };
});
