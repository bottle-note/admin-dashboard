import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8080';
  const warpUrl = env.API_SERVER_WARP_URL ? new URL(env.API_SERVER_WARP_URL) : null;
  const warpTicket = warpUrl?.searchParams.get('warpgate-ticket');
  const proxyOptions = {
    target: warpUrl && warpTicket ? warpUrl.origin : apiBaseUrl,
    changeOrigin: true,
    // 앱이 Authorization(Bearer)을 쓰므로 Warpgate 티켓은 쿼리로 전달한다.
    rewrite: warpTicket
      ? (path: string) =>
          `${path}${path.includes('?') ? '&' : '?'}warpgate-ticket=${encodeURIComponent(warpTicket)}`
      : undefined,
  };

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': proxyOptions,
        '/admin/api': proxyOptions,
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  };
});
