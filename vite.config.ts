import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载 .env 文件
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    base: './', 
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      emptyOutDir: true,
    },
    server: {
      port: 3000,
    },
    // 使用 import.meta.env 方式注入环境变量
    define: {
      'import.meta.env.VITE_COHERE_API_KEY': JSON.stringify(env.VITE_COHERE_API_KEY || ''),
    }
  };
});