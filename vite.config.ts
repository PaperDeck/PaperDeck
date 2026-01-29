import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    root: path.join(__dirname, 'src/renderer'),
    base: './',
    plugins: [
        react(),
        electron([
            {
                entry: path.join(__dirname, 'src/electron/main.ts'),
                vite: {
                    build: {
                        outDir: path.join(__dirname, 'dist/electron'),
                        emptyOutDir: true,
                    }
                }
            }
        ]),
        renderer()
    ],

    build: {
        outDir: path.join(__dirname, 'dist/renderer'),
        emptyOutDir: true,
    },
})