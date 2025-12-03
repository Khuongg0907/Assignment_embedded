import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// [https://vitejs.dev/config/](https://vitejs.dev/config/)
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'http://192.168.4.1/',
                changeOrigin: true,
            }
        }
    },
    base: './',
    build: {
        outDir: 'dist',
    }
})