import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { spawn } from 'child_process';

// A plugin to run the proxy server during development
function proxyServerPlugin() {
  let child = null;
  return {
    name: 'proxy-server-plugin',
    configureServer(server) {
      console.log('Starting proxy server on port 3001...');
      child = spawn('node', ['proxy-server.cjs'], {
        stdio: 'inherit',
        shell: true
      });

      child.on('error', (err) => {
        console.error('Failed to start proxy server:', err);
      });

      // Cleanup on exit
      process.on('exit', () => {
        if (child) child.kill();
      });
      
      server.httpServer?.on('close', () => {
        if (child) child.kill();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), proxyServerPlugin()],
  build: {
    chunkSizeWarningLimit: 1200
  },
});

