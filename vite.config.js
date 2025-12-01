import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  // Базовый путь для User Pages (taravkov.github.io)
  // Для User Pages всегда используется корневой путь '/'
  base: '/',
  
  build: {
    // Директория для собранных файлов
    outDir: 'dist',
    // Очищать dist перед сборкой
    emptyOutDir: true,
    // Генерировать source maps для отладки
    sourcemap: false,
    // Минимизировать код
    minify: 'terser',
    // Оптимизации
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three']
        }
      }
    }
  },
  
  // Настройки dev сервера
  server: {
    port: 5173,
    open: true
  },
  
  // Оптимизации
  optimizeDeps: {
    include: ['three']
  }
})

