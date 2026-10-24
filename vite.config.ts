import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// API_SERVER_WARP_URL(`https://<warpgate>/?warpgate-ticket=...`)이 있으면 Warpgate로 프록시한다.
// Authorization은 로그인 토큰이 쓰므로 티켓은 쿼리로 붙인다. VITE_ 접두사가 없어 번들에 포함되지 않는다.
function resolveApiProxy(env: Record<string, string>) {
  if (env.API_SERVER_WARP_URL) {
    const warpUrl = new URL(env.API_SERVER_WARP_URL);
    const ticket = warpUrl.searchParams.get('warpgate-ticket');
    return {
      target: warpUrl.origin,
      rewrite: ticket
        ? (requestPath: string) =>
            `${requestPath}${requestPath.includes('?') ? '&' : '?'}warpgate-ticket=${encodeURIComponent(ticket)}`
        : undefined,
    };
  }
  return { target: env.VITE_API_BASE_URL || 'http://localhost:8080', rewrite: undefined };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxy = resolveApiProxy(env);

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
        '/api': {
          ...apiProxy,
          changeOrigin: true,
        },
        '/admin/api': {
          ...apiProxy,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  };
});
