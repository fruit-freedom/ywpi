import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {createHtmlPlugin} from "vite-plugin-html";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        // createHtmlPlugin({
        //     entry: '/src/index.tsx',
        //     template: '/public/index.html'
        // })
    ],
    server: {
        host: true,
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:5011',
                changeOrigin: true,
                secure: false
            },
            '/api/ws': {
                target: 'ws://localhost:5011',
                changeOrigin: true,
                secure: false,
                ws: true,
                rewriteWsOrigin: true
            },
        },
    },
    resolve: {
        // extensions: ['.tsx', '.ts', '.js', '.jsx', '.scss', '.mjs'],
    }
})
