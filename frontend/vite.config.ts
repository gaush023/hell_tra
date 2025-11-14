import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Check if SSL certificates exist
const keyPath = path.resolve(__dirname, '../certs/server.key');
const certPath = path.resolve(__dirname, '../certs/server.crt');
const certsExist = fs.existsSync(keyPath) && fs.existsSync(certPath);

// HTTPS configuration (only if certificates exist)
const httpsConfig = certsExist ? {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
} : undefined;

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    https: httpsConfig,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});