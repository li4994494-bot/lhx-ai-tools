import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  
  // 核心修改：优先读取 VITE_COHERE_API_KEY
  const apiKey = env.VITE_COHERE_API_KEY || 
                 env.API_KEY || 
                 env.VITE_API_KEY || 
                 process.env.API_KEY || 
                 '';

  // 构建日志：方便你在 Vercel Logs 里确认 Key 是否被读取到
  if (apiKey) {
    console.log(`✅ [Vite Build] Detected API Key (Length: ${apiKey.length})`);
  } else {
    console.warn("⚠️ [Vite Build] No API Key found. Please set VITE_COHERE_API_KEY.");
  }

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
      // 将获取到的 Key 注入到全局变量 process.env.API_KEY 中
      'process.env.API_KEY': JSON.stringify(apiKey),
    }
  };
});