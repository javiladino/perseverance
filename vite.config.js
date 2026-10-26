import { defineConfig } from 'vite';

export default defineConfig({
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  // Prebundle juntos para que los addons compartan la misma instancia de three
  optimizeDeps: { include: ['three', 'three/addons/controls/OrbitControls.js'] },
  resolve: { dedupe: ['three'] },
});
