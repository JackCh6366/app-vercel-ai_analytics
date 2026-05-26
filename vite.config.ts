import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import dotenv from 'dotenv';

// Load .env.local for local Vite dev server development
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
// Also load standard .env if present
dotenv.config();

// A local API emulator plugin to run the Vercel serverless function during Vite local development
// This bypasses the need for the Vercel CLI login or GitHub linking locally.
function localApiPlugin() {
  return {
    name: 'local-api-emulator',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url === '/api/generate' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', async () => {
            try {
              const parsedBody = JSON.parse(body || '{}');
              req.body = parsedBody;

              // Emulate standard Vercel response helper methods
              res.status = (statusCode: number) => {
                res.statusCode = statusCode;
                return res;
              };
              res.json = (data: any) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
                return res;
              };

              // Dynamically import the Vercel TypeScript handler inside Vite's Node environment
              const { default: handler } = await server.ssrLoadModule('./api/generate.ts');
              await handler(req, res);
            } catch (err: any) {
              console.error('Local API Error in emulator:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), localApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
