import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
        cors: true,
        proxy: {
          // Autenticación (login/usuarios)
          '/api/webhook/auth': {
            target: 'https://n8n.red.com.sv',
            changeOrigin: true,
            secure: true,
            rewrite: () => '/webhook/6f27bb4b-bfcd-4776-b554-5194569be2a7',
          },
          // Casos (lista / creación)
          '/api/casos': {
            target: 'https://n8n.red.com.sv',
            changeOrigin: true,
            secure: true,
            rewrite: () => '/webhook/97a6c0f7-ea50-4542-b99e-710b96b58652',
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
