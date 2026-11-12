import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // 브라우저의 /api 요청을 Express(3001번 포트)로 전달한다.
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
});
