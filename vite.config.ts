import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  
  // 核心逻辑：优先读取 Cohere Key，兼容 Vercel 的 API_KEY
  const apiKey = env.VITE_COHERE_API_KEY || 
                 env.API_KEY || 
                 env.VITE_API_KEY || 
                 process.env.API_KEY || 
                 '';

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
    define: {
      // 将获取到的 Key 注入到全局变量 process.env.API_KEY 中，供前端直接使用
      'process.env.API_KEY': JSON.stringify(apiKey),
    }
  };
});