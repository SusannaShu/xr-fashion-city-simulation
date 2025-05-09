import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/xr-fashion-city-simulation/', // Set base path for GitHub Pages
    plugins: [
      react({
        jsxRuntime: 'classic',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      open: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      target: 'esnext',
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'es2020',
      },
    },
    esbuild: {
      target: 'es2020',
    },
    define: {
      // Expose env variables
      'process.env': env,
      // Make sure import.meta is properly handled
      'import.meta.env': JSON.stringify({
        ...env,
        DEV: mode === 'development',
        PROD: mode === 'production',
        MODE: mode,
      }),
    },
  };
});
