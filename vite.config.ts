import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    server: {
        port: 5173,
        // Native filesystem events (inotify/FSEvents/ReadDirectoryChanges)
        // No polling needed when running locally on Windows
        watch: {
            usePolling: false,
        },
    },
});
