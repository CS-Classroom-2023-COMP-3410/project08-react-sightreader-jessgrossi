import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    root: './',
    base: '/',  // Ensures that `public/` is correctly mapped
    build: {
        outDir: 'dist', // default output directory
    },
    server: {
        host: true, 
        port: 5173,  // Default port, change if needed
        strictPort: true,  // Ensures it doesn't switch to another port
    }
});
